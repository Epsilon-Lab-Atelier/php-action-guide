import test from 'node:test';
import assert from 'node:assert/strict';
import { groupUpdatesByDate, japanDate } from '../src/update-view.mjs';
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
