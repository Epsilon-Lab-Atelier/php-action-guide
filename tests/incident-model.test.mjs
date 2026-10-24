import test from 'node:test';
import assert from 'node:assert/strict';
import { incidentsForService, incidentMetadata, breachContextOptions, normalizeBreachContext, breachGuidance } from '../src/incident-model.mjs';

test('incident lookup matches explicit service scope and sorts by publication date', () => {
  const records = [
    { id: 'old', serviceIds: ['line'], publishedAt: '2023-11-27', status: { label: '確認' } },
    { id: 'other', serviceIds: ['line-game'], publishedAt: '2026-10-20' },
    { id: 'new', serviceIds: ['line', 'another'], publishedAt: '2026-07-01' },
    { id: 'undated', serviceIds: ['line'], publishedAt: null },
  ];
  assert.deepEqual(incidentsForService(records, 'line').map(record => record.id), ['new', 'old', 'undated']);
  assert.deepEqual(incidentsForService(records, 'unlisted'), []);
  assert.deepEqual(incidentsForService(records, null), []);
  assert.deepEqual(incidentsForService(null, 'line'), []);
  const copy = incidentsForService(records, 'line');
  copy[1].serviceIds.push('unlisted'); copy[1].status.label = 'changed';
  assert.deepEqual(records[0].serviceIds, ['line']);
  assert.equal(records[0].status.label, '確認');
});

test('incident dates distinguish source verification, history and publication', () => {
  const record = { publishedAt: '2023-11-27', updatedAt: '2026-10-21', sourceIds: ['first', 'second', 'first'], history: [{ date: '2026-10-24' }, { date: '2026-10-23' }] };
  const sourceMap = { first: { checkedAt: '2026-10-28' }, second: { checkedAt: '2026-10-26' } };
  assert.deepEqual(incidentMetadata(record, sourceMap), { checkedAt: '2026-10-26', lastChangedAt: '2026-10-24' });
  assert.deepEqual(incidentMetadata({ ...record, history: [] }, sourceMap), { checkedAt: '2026-10-26', lastChangedAt: null });
  assert.deepEqual(incidentMetadata({ publishedAt: '2026-10-24' }, sourceMap), { checkedAt: null, lastChangedAt: null });
});

test('missing or invalid referenced dates cannot make an incident look freshly checked', () => {
  const record = { sourceIds: ['first', 'second'], history: [{ date: '2026-02-30' }, { date: 'not-a-date' }] };
  for (const value of [null, '2026-02-30', '2026-13-01', 'not-a-date']) {
    assert.deepEqual(incidentMetadata(record, { first: { checkedAt: '2026-10-24' }, second: { checkedAt: value } }), { checkedAt: null, lastChangedAt: null });
  }
  assert.deepEqual(incidentMetadata(record, { first: { checkedAt: '2026-10-24' } }), { checkedAt: null, lastChangedAt: null });
  assert.deepEqual(incidentMetadata(null), { checkedAt: null, lastChangedAt: null });
});

test('context normalization rejects unsupported input and keeps stable order', () => {
  assert.deepEqual(normalizeBreachContext(['notice', 'payment', 'notice', 'unknown', '__proto__', 'former']), ['former', 'payment', 'notice']);
  assert.deepEqual(normalizeBreachContext(new Set(['address', 'former'])), ['former', 'address']);
  for (const input of [null, undefined, 'payment', { payment: true }]) assert.deepEqual(normalizeBreachContext(input), []);
});

test('every context combination adds its checks without replacing common checks', () => {
  const ids = breachContextOptions.map(option => option.id);
  for (let mask = 0; mask < 2 ** ids.length; mask++) {
    const selected = ids.filter((_, index) => mask & (1 << index));
    const result = breachGuidance([...selected].reverse());
    assert.deepEqual(result.groups.map(group => group.id), ['breach.common', ...selected.map(id => `breach.${id}`)]);
    const taskIds = result.groups.flatMap(group => group.tasks.map(task => task.id));
    assert.equal(new Set(taskIds).size, taskIds.length);
    assert.ok(taskIds.every(id => id.startsWith('breach.')));
    assert.deepEqual(result.groups[0], breachGuidance([]).groups[0]);
  }
});

test('admin guidance separates provider scope, remediation and affected users', () => {
  const result = breachGuidance(['payment'], 'admin');
  assert.deepEqual(result.groups.map(group => group.id), ['breach.common', 'breach.admin', 'breach.payment']);
  const adminText = result.groups[1].tasks.map(task => task.text).join('\n');
  assert.match(adminText, /対象とは判断しない/);
  assert.match(adminText, /作業の完了と、情報流出の有無は別/);
  assert.deepEqual(breachGuidance([], 'unknown'), breachGuidance([], 'user'));
});

test('past use and payment guide confirmation without diagnosing exposure', () => {
  const result = breachGuidance(['former', 'address', 'payment']);
  const text = result.groups.flatMap(group => group.tasks.map(task => task.text)).join('\n');
  assert.match(text, /退会したことだけで対象外とは判断しない/);
  assert.match(text, /登録したことだけで、その情報が流出したとは判断しない/);
  assert.match(text, /カード番号の流出とは判断しない/);
  assert.doesNotMatch(text, /必ず.*再発行|全員.*変更|被害なし|安全です/);
});

test('returned guidance can be edited without changing future calls', () => {
  const expected = breachGuidance(['notice', 'payment'], 'admin');
  const changed = breachGuidance(['notice', 'payment'], 'admin');
  changed.groups[0].tasks[0].text = 'changed';
  changed.groups[1].tasks.length = 0;
  changed.groups.pop();
  assert.deepEqual(breachGuidance(['notice', 'payment'], 'admin'), expected);
  assert.ok(Object.isFrozen(breachContextOptions));
  assert.ok(breachContextOptions.every(Object.isFrozen));
});
