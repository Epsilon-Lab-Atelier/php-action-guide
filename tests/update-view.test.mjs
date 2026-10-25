import test from 'node:test';
import assert from 'node:assert/strict';
import { groupUpdatesByDate, japanDate, renderUpdateView } from '../src/update-view.mjs';
import { updateHistory, updateTrackedSince } from '../src/updates.mjs';
import { directoryServices } from '../src/service-directory.mjs';
import { breachIncidents } from '../src/incidents.mjs';

const companies = [{ id: 'alpha', name: 'Alpha' }, { id: 'beta', name: 'Beta' }];
const change = (id, date, serviceIds, extras = {}) => ({ id, date, serviceIds, type: 'content', title: id, summary: `${id} summary`, sourceIds: ['source-a'], ...extras });

test('Japan calendar dates cross midnight independently from the runner timezone', () => {
  assert.equal(japanDate('2026-10-24T14:59:59Z'), '2026-10-24');
  assert.equal(japanDate('2026-10-24T15:00:00Z'), '2026-10-25');
  assert.equal(japanDate('invalid'), null);
});

test('a company is counted once per date across incidents and themes', () => {
  const history = [
    change('first', '2026-10-25', ['alpha'], { incidentId: 'one' }),
    change('second', '2026-10-25', ['alpha'], { incidentId: 'two' }),
    change('third', '2026-10-25', ['alpha']),
    change('shared', '2026-10-25', ['alpha', 'beta', 'beta'], { incidentId: 'shared' }),
  ];
  const [day] = groupUpdatesByDate(history, companies);
  assert.equal(day.serviceCount, 2);
  assert.equal(day.eventCount, 4);
  assert.equal(day.services[0].events.length, 4);
  assert.deepEqual(day.services[0].topics, ['breach', 'php']);
  assert.equal(day.services[1].events.length, 1);
  const [phpDay] = groupUpdatesByDate(history, companies, { topic: 'php' });
  assert.equal(phpDay.serviceCount, 1);
  assert.equal(phpDay.eventCount, 1);
  assert.deepEqual(phpDay.services[0].topics, ['php']);
});

test('baseline records do not pretend all services changed on the baseline date', () => {
  const baseline = { type: 'baseline', date: '2026-10-24', serviceIds: ['alpha', 'beta'] };
  assert.deepEqual(groupUpdatesByDate([baseline], companies), []);
  const [day] = groupUpdatesByDate([baseline, change('php-change', '2026-10-25', ['alpha'])], companies);
  assert.deepEqual(day.services[0].kinds, ['update']);
});

test('service-specific history and name searches retain accurate date and event counts', () => {
  const history = [
    change('one', '2026-10-24', ['alpha']),
    change('two', '2026-10-25', ['beta']),
    change('shared', '2026-10-25', ['alpha', 'beta'], { incidentId: 'shared' }),
  ];
  const dates = groupUpdatesByDate(history, companies, { serviceId: 'alpha' });
  assert.equal(dates.length, 2);
  assert.ok(dates.every(day => day.serviceCount === 1 && day.eventCount === 1));
  assert.deepEqual(dates[0].services.map(service => service.serviceId), ['alpha']);
  const search = groupUpdatesByDate(history, companies, { query: 'ＡＬＰＨＡ' });
  assert.deepEqual(search, dates);
  assert.deepEqual(groupUpdatesByDate(history, companies, { query: 'absent' }), []);
});

test('initial listing remains initial even when its source is a follow-up or correction', () => {
  const history = [
    change('new', '2026-10-25', ['alpha'], { incidentId: 'one', title: '続報と訂正を確認して掲載' }),
    change('followup', '2026-10-26', ['alpha'], { incidentId: 'one', title: '続報を追加しました' }),
    change('correction', '2026-10-27', ['alpha'], { incidentId: 'one', title: '対象人数の訂正を反映' }),
  ];
  const days = groupUpdatesByDate(history, companies);
  assert.deepEqual(days.map(day => day.date), ['2026-10-27', '2026-10-26', '2026-10-25']);
  assert.deepEqual(days.map(day => day.services[0].kinds[0]), ['correction', 'followup', 'new']);
});

test('explicit classifications are retained and source/service arrays are copied', () => {
  const event = change('explicit', '2026-10-25', ['alpha'], { changeKind: 'update' });
  const [day] = groupUpdatesByDate([event], companies);
  const copy = day.services[0].events[0];
  assert.equal(copy.kind, 'update');
  assert.deepEqual(copy.sourceIds, ['source-a']);
  copy.sourceIds.push('other'); copy.serviceIds.length = 0;
  assert.deepEqual(event.sourceIds, ['source-a']);
  assert.deepEqual(event.serviceIds, ['alpha']);
});

test('fully timed same-day morning and evening changes use actual chronological order', () => {
  const history = [
    change('evening', '2026-10-26', ['alpha'], { incidentId: 'one', title: '公式の続報を反映', changedAtTime: '2026-10-26T09:20:00Z' }),
    change('morning', '2026-10-26', ['alpha'], { incidentId: 'one', changedAtTime: '2026-10-26T10:00:00+09:00' }),
  ];
  const events = groupUpdatesByDate(history, companies)[0].services[0].events;
  assert.deepEqual(events.map(event => [event.id, event.kind]), [['morning', 'new'], ['evening', 'followup']]);
});

test('mixed date-only batches keep their recorded order and explicit classifications', () => {
  const history = [
    change('clock-unknown', '2026-10-26', ['alpha'], { incidentId: 'one', changeKind: 'correction' }),
    change('timed', '2026-10-26', ['alpha'], { incidentId: 'one', changedAtTime: '2026-10-26T06:12:00+09:00', changeKind: 'followup' }),
  ];
  const events = groupUpdatesByDate(history, companies)[0].services[0].events;
  assert.deepEqual(events.map(event => [event.id, event.kind]), [['clock-unknown', 'correction'], ['timed', 'followup']]);
  assert.equal(events[0].changedAtTime, undefined);
});

test('fully timed ordering never overrides an explicit change classification', () => {
  const history = [
    change('later', '2026-10-26', ['alpha'], { incidentId: 'one', changedAtTime: '2026-10-26T18:20:00+09:00', changeKind: 'new' }),
    change('earlier', '2026-10-26', ['alpha'], { incidentId: 'one', changedAtTime: '2026-10-26T06:12:00+09:00', changeKind: 'correction' }),
  ];
  const events = groupUpdatesByDate(history, companies)[0].services[0].events;
  assert.deepEqual(events.map(event => [event.id, event.kind]), [['earlier', 'correction'], ['later', 'new']]);
});

test('duplicate events, invalid dates, unknown companies and non-content records do not inflate counts', () => {
  const event = change('same', '2026-10-25', ['alpha']);
  const days = groupUpdatesByDate([
    event, event, change('invalid', '2026-02-30', ['alpha']), change('missing', '2026-10-26', ['unknown']),
    { ...change('release', '2026-10-27', ['beta']), type: 'release' },
  ], companies);
  assert.equal(days.length, 1);
  assert.equal(days[0].serviceCount, 1);
  assert.equal(days[0].eventCount, 1);
  assert.deepEqual(groupUpdatesByDate([], companies), []);
});

test('current publication data groups independently from verification dates and preserves every content event', () => {
  const days = groupUpdatesByDate(updateHistory, directoryServices);
  const content = updateHistory.filter(event => event.type === 'content');
  assert.equal(days.reduce((count, day) => count + day.eventCount, 0), content.length);
  for (const day of days) {
    const expectedIds = new Set(content.filter(event => event.date === day.date).flatMap(event => event.serviceIds));
    assert.equal(day.serviceCount, expectedIds.size);
    assert.equal(day.services.length, expectedIds.size);
    for (const row of day.services) for (const event of row.events) assert.equal(event.date, day.date);
  }
});

test('app history never borrows a provider date before tracking began, and Arcadia appears on its actual listing day', () => {
  for (const event of updateHistory.filter(event => event.type === 'content')) {
    assert.ok(event.date >= updateTrackedSince, `${event.id} must record the app listing date, not the provider announcement date`);
  }
  const listedDay = groupUpdatesByDate(updateHistory, directoryServices).find(day => day.date === '2026-10-25');
  const arcadia = listedDay.services.find(service => service.serviceId === 'arcadia-raiden');
  assert.ok(arcadia);
  assert.equal(arcadia.events.length, 3);
  assert.ok(arcadia.events.every(event => event.kind === 'new' && event.date === '2026-10-25'));
  assert.deepEqual(arcadia.events.map(event => event.incidentId).sort(), ['arcadia-119raiden-2026', 'arcadia-net119-2026', 'arcadia-speecan-2026']);
  const providerDates = Object.fromEntries(breachIncidents.filter(record => record.serviceIds.includes('arcadia-raiden')).map(record => [record.id, [record.publishedAt, record.updatedAt]]));
  assert.deepEqual(providerDates, {
    'arcadia-speecan-2026': ['2026-10-13', '2026-10-23'],
    'arcadia-net119-2026': ['2026-10-14', '2026-10-23'],
    'arcadia-119raiden-2026': ['2026-10-14', '2026-10-23'],
  });
});

// Minimal detached DOM captures the public text and order without a browser or
// an external package. Interactive behavior is checked in the live UI.
function updateTestDocument() {
  const document = {
    createElement(tag) {
      return {
        tag, ownerDocument: document, children: [], dataset: {}, attributes: {}, events: {}, _text: '',
        set textContent(value) { this._text = String(value); this.children = []; },
        get textContent() { return this._text + this.children.map(child => child.textContent).join(''); },
        get childElementCount() { return this.children.filter(child => child.tag !== '#text').length; },
        append(...nodes) { this.children.push(...nodes); },
        replaceChildren(...nodes) { this._text = ''; this.children = [...nodes]; },
        setAttribute(name, value) { this.attributes[name] = value; },
        addEventListener(name, action) { this.events[name] = action; },
      };
    },
    createTextNode(text) { return { tag: '#text', textContent: String(text) }; },
  };
  return document;
}

function updateTestFind(node, predicate) {
  if (predicate(node)) return node;
  for (const child of node.children ?? []) { const found = updateTestFind(child, predicate); if (found) return found; }
  return null;
}

test('today count explains historical listings before controls and results', () => {
  const container = updateTestDocument().createElement('main');
  renderUpdateView(container, { history: [change('one', '2026-10-25', ['alpha'])], services: companies, now: new Date('2026-10-25T06:00:00+09:00') });
  const heading = container.children[0];
  const count = heading.children.findIndex(node => node.className === 'update-today');
  assert.match(heading.children[count + 1].textContent, /過去の事案の新規掲載も含みます/);
  assert.match(heading.children[count + 1].textContent, /今日起きた事故の件数ではありません/);
});

test('update details show explicit action changes and actual publication time', () => {
  const container = updateTestDocument().createElement('main');
  renderUpdateView(container, { history: [change('one', '2026-10-25', ['alpha'], { changedAtTime: '2026-10-25T18:20:00+09:00', actionImpact: 'scope-expanded', actionSummary: '対象期間が広がりました。過去の登録時期を再確認してください。' })], services: companies, now: new Date('2026-10-25T20:00:00+09:00') });
  const detail = updateTestFind(container, node => node.className === 'update-impact-detail update-impact-scope-expanded');
  assert.match(detail.textContent, /対象期間が広がりました/);
  assert.match(container.textContent, /アプリへの掲載変更：2026-10-25 18:20（日本時間）/);
  const rowHeading = updateTestFind(container, node => node.className === 'update-service-heading');
  assert.match(rowHeading.textContent, /対象範囲が拡大/);
});

test('old unclassified update details stay unknown and keep their date-only precision', () => {
  const container = updateTestDocument().createElement('main');
  renderUpdateView(container, { history: [change('one', '2026-10-25', ['alpha'])], services: companies, now: new Date('2026-10-25T20:00:00+09:00') });
  assert.match(container.textContent, /対応の変更は未分類/);
  assert.match(container.textContent, /2026-10-25（時刻未記録）/);
  assert.doesNotMatch(container.textContent, /必要な対応の変更なし|必要な対応の変更はありません/);
});
