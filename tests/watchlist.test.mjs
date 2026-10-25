import test from 'node:test';
import assert from 'node:assert/strict';
import { WATCHLIST_KEY, readWatchlist, writeWatchlist, toggleWatchService, markWatchServiceSeen, watchServiceRevision, watchServiceRevisions, watchlistRows, renderWatchlistView } from '../src/watchlist.mjs';

const watchTestServices = [
  { id: 'alpha', name: 'Alpha', topics: ['breach', 'php'], php: { label: '利用確認', sourceIds: ['php-a'] }, incident: { label: '対応確認', sourceIds: ['php-a'] }, officialAction: { text: '公式案内の環境を確認する', sourceIds: ['php-a'] }, domainSourceIds: ['domain-a'] },
  { id: 'beta', name: 'Beta', topics: ['breach'] },
];
const watchTestIncidents = [{ id: 'incident-a', serviceIds: ['alpha'], sourceIds: ['source-a'], title: '登録機能の公表', publishedAt: '2026-10-24', scope: '対象機能の登録者', affectedPeriod: '2026年9月まで', status: { code: 'possible', label: '流出の可能性' }, officialAction: { text: '公式のお知らせで対象を確認' } }];
const watchTestHistory = [{ id: 'first-a', type: 'content', date: '2026-10-25', serviceIds: ['alpha'], sourceIds: ['source-a'], incidentId: 'incident-a', title: '対象機能を掲載', summary: '対象機能の登録情報について掲載しました。' }];
const watchTestSources = {
  'source-a': { url: 'https://example.test/notice', title: '公式告知', publishedAt: '2026-10-24', checkedAt: '2026-10-25' },
  'php-a': { url: 'https://example.test/php', title: 'PHP公式案内', checkedAt: '2026-10-24' },
  'domain-a': { url: 'https://example.test/', title: 'ドメインの根拠', checkedAt: '2026-01-01' },
};
const watchTestData = { services: watchTestServices, incidents: watchTestIncidents, history: watchTestHistory, sources: watchTestSources };
const watchTestRevision = watchServiceRevision(watchTestServices[0], watchTestData);
const watchTestRevisions = watchServiceRevisions(watchTestServices[0], watchTestData);
const watchTestItem = { serviceId: 'alpha', seenRevisions: watchTestRevisions };
function watchTestStorage(raw) {
  const values = new Map(raw === undefined ? [] : [[WATCHLIST_KEY, raw]]);
  const writes = [];
  return { values, writes, getItem(key) { return values.get(key) ?? null; }, setItem(key, value) { writes.push([key, value]); values.set(key, value); } };
}
const watchTestPayload = items => JSON.stringify({ version: 1, items });

test('reading does not write or migrate previously saved notebook data', () => {
  const storage = watchTestStorage(); storage.values.set('epsilon-service-notebook.saved-services.v1', 'legacy data');
  assert.deepEqual(readWatchlist(storage, watchTestServices), { ok: true, status: 'empty', items: [] });
  assert.equal(storage.writes.length, 0);
  storage.values.set(WATCHLIST_KEY, watchTestPayload([watchTestItem]));
  const read = readWatchlist(storage, watchTestServices);
  assert.deepEqual(read, { ok: true, status: 'loaded', items: [watchTestItem] });
  read.items[0].seenRevisions.breach = '0000000000000000';
  assert.deepEqual(readWatchlist(storage, watchTestServices).items[0].seenRevisions, watchTestRevisions);
  assert.equal(storage.writes.length, 0);
});

test('explicit changes save only IDs and viewed revisions and leave unrelated storage alone', () => {
  const storage = watchTestStorage(); storage.values.set('other-app', 'keep');
  const result = writeWatchlist(storage, { items: [{ ...watchTestItem, usage: ['purchase'], url: 'https://private.test/?token=secret' }], selections: ['secret'], hostname: 'private.test' });
  assert.equal(result.ok, true);
  assert.deepEqual(JSON.parse(storage.values.get(WATCHLIST_KEY)), { version: 1, items: [watchTestItem] });
  assert.doesNotMatch(storage.values.get(WATCHLIST_KEY), /secret|private|purchase|usage/);
  const removed = toggleWatchService(result, 'alpha');
  assert.equal(removed.status, 'removed');
  writeWatchlist(storage, removed);
  assert.deepEqual(readWatchlist(storage, watchTestServices).items, []);
  assert.equal(storage.values.get('other-app'), 'keep');
});

test('unknown or removed company IDs and duplicates are filtered without discarding valid watches', () => {
  const storage = watchTestStorage(watchTestPayload([watchTestItem, { serviceId: 'old-service', seenRevisions: watchTestRevisions }, watchTestItem]));
  assert.deepEqual(readWatchlist(storage, watchTestServices), { ok: true, status: 'filtered', items: [watchTestItem] });
  assert.equal(storage.writes.length, 0);
});

test('malformed payloads, inherited IDs, extra fields and oversized data are safely rejected', () => {
  for (const raw of ['{', '', 'null', '[]', JSON.stringify({ version: 2, items: [] }), JSON.stringify({ version: 1, items: [], extra: 'private' }), watchTestPayload([{ ...watchTestItem, extra: 'private' }]), watchTestPayload([{ serviceId: '__proto__', seenRevisions: watchTestRevisions }]), watchTestPayload([{ serviceId: 'alpha', seenRevisions: { breach: 'https://private.test' } }]), watchTestPayload([{ serviceId: 'alpha', seenRevisions: { breach: 1111111111111111 } }]), watchTestPayload(Array(501).fill(watchTestItem)), ' '.repeat(131073)]) {
    const storage = watchTestStorage(raw);
    assert.equal(readWatchlist(storage, watchTestServices).status, 'malformed', raw.slice(0, 80));
    assert.equal(storage.writes.length, 0);
  }
  assert.deepEqual(toggleWatchService({ items: [] }, '__proto__', watchTestRevisions).items, []);
  assert.equal(toggleWatchService({ items: [] }, 'alpha', 'bad').status, 'invalid');
  assert.equal({}.polluted, undefined);
});

test('blocked storage and quota failures preserve intended session-only items without throwing', () => {
  const denied = Object.assign(new Error('blocked'), { name: 'SecurityError' });
  const blocked = { getItem() { throw denied; }, setItem() { throw denied; } };
  assert.equal(readWatchlist(blocked, watchTestServices).status, 'unavailable');
  assert.equal(readWatchlist(null, watchTestServices).status, 'unavailable');
  const getter = Object.defineProperty({}, 'getItem', { get() { throw denied; } });
  assert.equal(readWatchlist(getter, watchTestServices).status, 'unavailable');
  assert.deepEqual(writeWatchlist(blocked, { items: [watchTestItem] }), { ok: false, status: 'unavailable', items: [watchTestItem] });
  const storage = watchTestStorage(watchTestPayload([watchTestItem]));
  storage.setItem = () => { throw Object.assign(new Error('full'), { name: 'QuotaExceededError' }); };
  const changed = toggleWatchService({ items: [watchTestItem] }, 'beta', { breach: '0000000000000000' });
  const result = writeWatchlist(storage, changed);
  assert.equal(result.status, 'quota'); assert.equal(result.items.length, 2);
  assert.deepEqual(readWatchlist(storage, watchTestServices).items, [watchTestItem]);
});

test('new watches baseline existing history, view rendering stays unread-neutral, and only explicit open marks seen', () => {
  const added = toggleWatchService({ items: [] }, 'alpha', watchTestRevisions);
  assert.equal(watchlistRows(added, watchTestData)[0].unread, false);
  const changedData = { ...watchTestData, history: [...watchTestHistory, { ...watchTestHistory[0], id: 'second-a', summary: '同じ日の新しい追記', changedAtTime: '2026-10-25T18:20:00+09:00' }] };
  const rows = watchlistRows(added, changedData);
  assert.equal(rows[0].unread, true);
  assert.deepEqual(added.items, [watchTestItem]);
  assert.equal(watchlistRows(added, changedData)[0].unread, true);
  const viewed = markWatchServiceSeen(added, 'alpha', rows[0].revisions.breach, 'breach');
  assert.equal(watchlistRows(viewed, changedData)[0].unread, false);
  assert.equal(watchlistRows(added, changedData)[0].unread, true);
  assert.equal(markWatchServiceSeen(added, 'beta', rows[0].revisions.breach, 'breach').items.length, 1);
});

test('revision ignores source verification attempts and clock changes but includes substantive facts and source URLs', () => {
  const rechecked = structuredClone(watchTestData);
  rechecked.sources['source-a'].checkedAt = '2026-10-26';
  rechecked.sources['source-a'].checkedAtTime = '2026-10-26T06:12:00+09:00';
  rechecked.sources['source-a'].lastAttempt = { at: '2026-10-26T18:00:00+09:00', outcome: 'unavailable' };
  assert.equal(watchServiceRevision(watchTestServices[0], rechecked), watchTestRevision);
  for (const change of [
    data => { data.sources['source-a'].url = 'https://example.test/correction'; },
    data => { data.sources['source-a'].verificationNote = '対象資料に訂正があります'; },
    data => { data.incidents[0].scope = '別の機能の登録者も対象'; },
    data => { data.history[0].summary = '同日中に対象期間を訂正'; },
  ]) {
    const data = structuredClone(watchTestData); change(data);
    assert.notEqual(watchServiceRevision(watchTestServices[0], data), watchTestRevision);
  }
  const reversedSources = Object.fromEntries(Object.entries(watchTestSources).reverse());
  assert.equal(watchServiceRevision(watchTestServices[0], { ...watchTestData, sources: reversedSources }), watchTestRevision);
});

test('unread companies sort first, topics stay independent and empty incident coverage does not become safety', () => {
  const betaRevisions = watchServiceRevisions(watchTestServices[1], watchTestData);
  const state = { items: [watchTestItem, { serviceId: 'beta', seenRevisions: betaRevisions }] };
  const data = { ...watchTestData, history: [...watchTestHistory, { id: 'beta-new', type: 'content', incidentId: 'beta-notice', date: '2026-10-25', serviceIds: ['beta'], title: '掲載対象を更新', summary: '公式窓口を追加' }] };
  const rows = watchlistRows(state, data);
  assert.equal(rows[0].serviceId, 'beta'); assert.equal(rows[0].unread, true);
  assert.deepEqual(rows[0].topics, ['breach']); assert.equal(rows[0].php, null);
  assert.equal(rows[0].breach.label, '掲載事案なし');
  assert.equal(rows[1].php.label, '対応確認');
  assert.equal(rows[1].breach.label, '流出の可能性');
});

test('verification dates use relevant evidence conservatively and historical action comparison remains unknown', () => {
  const row = watchlistRows({ items: [watchTestItem] }, watchTestData)[0];
  assert.equal(row.metadata.checkedAt, '2026-10-24'); // Domain-only 2026-01-01 does not refresh or date the evidence.
  assert.equal(row.metadata.checkedAtTime, null);
  assert.equal(row.metadata.lastActionChangedAt, null);
  assert.equal(row.actionImpactSummary.code, 'unknown');
  const data = structuredClone(watchTestData);
  data.history.push({ ...watchTestHistory[0], id: 'next-day', date: '2026-10-26', changedAtTime: '2026-10-26T18:20:00+09:00', actionImpact: 'unchanged', actionSummary: '続報を追加しました。必要な対応に変更はありません。' });
  assert.equal(watchlistRows({ items: [watchTestItem] }, data)[0].actionImpactSummary.code, 'unchanged');
});

test('opening PHP does not dismiss unseen breach changes, and vice versa', () => {
  const initial = toggleWatchService({ items: [] }, 'alpha', watchTestRevisions);
  const data = structuredClone(watchTestData); data.incidents[0].scope = '対象機能の登録者・以前の利用者';
  let row = watchlistRows(initial, data)[0];
  assert.deepEqual(row.unreadTopics, ['breach']);
  const phpOpened = markWatchServiceSeen(initial, 'alpha', row.revisions.php, 'php');
  row = watchlistRows(phpOpened, data)[0];
  assert.deepEqual(row.unreadTopics, ['breach']); assert.equal(row.unread, true);
  const breachOpened = markWatchServiceSeen(phpOpened, 'alpha', row.revisions.breach, 'breach');
  assert.equal(watchlistRows(breachOpened, data)[0].unread, false);
  data.services[0].incident.label = '公式の追加案内を掲載';
  row = watchlistRows(breachOpened, data)[0];
  assert.deepEqual(row.unreadTopics, ['php']);
  const breachAgain = markWatchServiceSeen(breachOpened, 'alpha', row.revisions.breach, 'breach');
  assert.deepEqual(watchlistRows(breachAgain, data)[0].unreadTopics, ['php']);
  assert.deepEqual(initial.items, [watchTestItem]);
});

test('newly added PHP coverage is unread without marking existing breach coverage changed', () => {
  const service = watchTestServices[1];
  const initial = toggleWatchService({ items: [] }, service.id, watchServiceRevisions(service, watchTestData));
  const data = structuredClone(watchTestData);
  data.services[1].topics.push('php');
  data.services[1].php = { label: '利用確認', sourceIds: [] };
  data.services[1].incident = { label: '関連案内を掲載', sourceIds: [] };
  assert.deepEqual(watchlistRows(initial, data)[0].unreadTopics, ['php']);
});

test('same-day update ordering compares absolute ISO instants and displays Japanese time', () => {
  const data = structuredClone(watchTestData);
  data.history = [
    { ...watchTestHistory[0], id: 'morning', title: '朝の追記', changedAtTime: '2026-10-25T10:00:00+09:00' },
    { ...watchTestHistory[0], id: 'evening', title: '夕方の追記', changedAtTime: '2026-10-25T09:20:00Z' },
  ];
  const row = watchlistRows({ items: [watchTestItem] }, data)[0];
  assert.equal(row.latestTitle, '夕方の追記');
  assert.equal(row.latestChangedAtTime, '2026-10-25T09:20:00.000Z');
});

test('a same-day record without a clock time keeps the last-change time unknown', () => {
  const data = structuredClone(watchTestData);
  data.history.push({ ...watchTestHistory[0], id: 'timed', title: '時刻付きの追記', changedAtTime: '2026-10-25T18:20:00+09:00' });
  const row = watchlistRows({ items: [watchTestItem] }, data)[0];
  assert.equal(row.latestChangedAt, '2026-10-25');
  assert.equal(row.latestChangedAtTime, null);
});

class WatchTestNode {
  constructor(document, tag) { this.ownerDocument = document; this.tagName = tag; this.children = []; this.dataset = {}; this.attributes = {}; this.listeners = {}; this.textContent = ''; }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  setAttribute(key, value) { this.attributes[key] = value; }
  addEventListener(name, callback) { this.listeners[name] = callback; }
}
function watchTestDocument() {
  const document = { createElement(tag) { return new WatchTestNode(document, tag); } };
  return document;
}
function watchTestDescendants(node) { return [node, ...node.children.flatMap(watchTestDescendants)]; }
function watchTestText(node) { return watchTestDescendants(node).map(item => item.textContent).join(' '); }

test('watchlist DOM shows separate statuses, historical-time limits, explicit remove/open controls and no false safe state', () => {
  const document = watchTestDocument(); const container = document.createElement('section'); const opened = []; const removed = [];
  const rows = watchlistRows({ items: [watchTestItem, { serviceId: 'beta', seenRevisions: { breach: '0000000000000000' } }] }, watchTestData);
  const result = renderWatchlistView(container, { rows, onOpen: (...args) => opened.push(args), onRemove: id => removed.push(id) });
  const text = watchTestText(container);
  assert.equal(result.count, 2);
  assert.match(text, /情報漏洩・不正アクセス/); assert.match(text, /PHPの問題/);
  assert.match(text, /時刻未記録/); assert.match(text, /未掲載は「被害なし」を意味しません/);
  assert.doesNotMatch(text, /今回の確認で.*変更.*ありません/);
  assert.match(text, /このブラウザだけに保存/);
  const all = watchTestDescendants(container);
  const open = all.find(node => node.attributes['aria-label'] === 'AlphaのPHPの案内を見る');
  open.listeners.click(); assert.deepEqual(opened, [['alpha', 'php']]);
  all.find(node => node.attributes['aria-label'] === 'Alphaをウォッチリストから外す').listeners.click();
  assert.deepEqual(removed, ['alpha']);
});

test('empty and unavailable-storage views offer a working entry without claiming persistence', () => {
  const document = watchTestDocument(); const container = document.createElement('section'); let browsed = false;
  renderWatchlistView(container, { rows: [], storageAvailable: false, onBrowse: () => { browsed = true; } });
  assert.match(watchTestText(container), /ページを開いている間だけ/);
  assert.match(watchTestText(container), /気になる企業を追加/);
  watchTestDescendants(container).find(node => node.textContent === '企業・サービスを探す').listeners.click();
  assert.equal(browsed, true);
});
