import test from 'node:test';
import assert from 'node:assert/strict';
import { informationStatus, formatInformationTime, actionImpactForEvent, summarizeActionImpact } from '../src/information-status.mjs';
import { sources } from '../src/catalog.mjs';
import { breachSources, breachIncidents } from '../src/incidents.mjs';
import { updateHistory } from '../src/updates.mjs';

const source = (checkedAt, checkedAtTime, extra = {}) => ({ checkedAt, checkedAtTime, ...extra });
const event = (date, changedAtTime, actionImpact, extra = {}) => ({ type: 'content', date, changedAtTime, actionImpact, ...extra });

test('date-only historical verification does not acquire an invented clock time', () => {
  const status = informationStatus({ sourceIds: ['a', 'b'], history: [{ date: '2026-10-24' }] }, { a: source('2026-10-25'), b: source('2026-10-24') });
  assert.equal(status.checkedAt, '2026-10-24');
  assert.equal(status.checkedAtTime, null);
  assert.equal(formatInformationTime(status.checkedAt, status.checkedAtTime), '2026-10-24（時刻未記録）');
  assert.equal(status.lastChangedAt, '2026-10-24');
  assert.equal(status.lastActionChangedAt, null);
  assert.equal(status.actionComparisonUnknown, true);
});

test('verification is the oldest referenced successful body-read time, with deduplication', () => {
  const status = informationStatus({ sourceIds: ['a', 'b', 'a'] }, {
    a: source('2026-10-25', '2026-10-25T18:12:00+09:00'),
    b: source('2026-10-25', '2026-10-24T21:12:00Z'),
  });
  assert.equal(status.checkedAt, '2026-10-25');
  assert.equal(status.checkedAtTime, '2026-10-24T21:12:00.000Z');
  assert.equal(formatInformationTime(status.checkedAt, status.checkedAtTime), '2026-10-25 06:12（日本時間）');
});

test('partial readings and missing referenced source dates cannot refresh the full set', () => {
  const sources = { a: source('2026-10-25', '2026-10-25T18:12:00+09:00'), b: source('2026-10-25') };
  assert.equal(informationStatus({ sourceIds: ['a', 'b'] }, sources).checkedAtTime, null);
  const missing = informationStatus({ sourceIds: ['a', 'unknown'] }, sources);
  assert.equal(missing.checkedAt, null);
  assert.equal(missing.checkedAtTime, null);
  assert.deepEqual(missing.missingSourceIds, ['unknown']);
  assert.equal(informationStatus({ sourceIds: [] }, sources).checkedAt, null);
});

test('failed attempts retain previous successful timestamps and expose the unread source', () => {
  const status = informationStatus({ sourceIds: ['a', 'b'] }, {
    a: source('2026-10-25', '2026-10-25T18:10:00+09:00'),
    b: source('2026-10-25', '2026-10-25T06:12:00+09:00', { lastAttempt: { at: '2026-10-25T18:11:00+09:00', outcome: 'unavailable', note: '公式ページの取得に失敗' } }),
  });
  assert.equal(status.checkedAtTime, '2026-10-24T21:12:00.000Z');
  assert.deepEqual(status.checkFailures, [{ sourceId: 'b', at: '2026-10-25T09:11:00.000Z', note: '公式ページの取得に失敗' }]);
});

test('a successful later read clears an older failure without hiding a same-day date-only failure', () => {
  const stale = source('2026-10-25', '2026-10-25T18:12:00+09:00', { lastAttempt: { at: '2026-10-25T06:12:00+09:00', outcome: 'unavailable' } });
  assert.deepEqual(informationStatus({ sourceIds: ['a'] }, { a: stale }).checkFailures, []);
  const unknownClock = source('2026-10-25', null, { lastAttempt: { at: '2026-10-25T18:12:00+09:00', outcome: 'unavailable' } });
  assert.equal(informationStatus({ sourceIds: ['a'] }, { a: unknownClock }).checkFailures.length, 1);
});

test('timestamps require a real calendar day, an explicit timezone and the matching Japanese day', () => {
  for (const time of ['2026-10-25T06:12:00', '2026-02-30T06:12:00+09:00', '2026-10-25T24:00:00+09:00', '2026-10-24T06:12:00+09:00', 'not-a-time']) {
    assert.equal(formatInformationTime('2026-10-25', time), '2026-10-25（時刻未記録）', time);
    assert.equal(informationStatus({ sourceIds: ['a'] }, { a: source('2026-10-25', time) }).checkedAtTime, null, time);
  }
  assert.equal(formatInformationTime('2026-02-30', '2026-03-02T06:12:00+09:00'), '未記録');
  assert.equal(formatInformationTime('2026-10-25', '2026-10-24T15:00:00Z'), '2026-10-25 00:00（日本時間）');
});

test('content time and actionable-instruction time differ when a later update changes no action', () => {
  const status = informationStatus({ history: [
    event('2026-10-25', '2026-10-25T06:12:00+09:00', 'changed'),
    event('2026-10-25', '2026-10-25T18:20:00+09:00', 'unchanged'),
  ] });
  assert.equal(status.lastChangedAtTime, '2026-10-25T09:20:00.000Z');
  assert.equal(status.lastActionChangedAtTime, '2026-10-24T21:12:00.000Z');
  assert.equal(status.actionImpact.code, 'unchanged');
  assert.equal(status.actionComparisonUnknown, false);
});

test('newer unclassified changes cannot imply old instructions remain unchanged', () => {
  const history = [event('2026-10-24', '2026-10-24T18:20:00+09:00', 'changed'), event('2026-10-25', '2026-10-25T06:12:00+09:00')];
  const status = informationStatus({ history });
  assert.equal(status.lastActionChangedAt, null);
  assert.equal(status.lastActionChangedAtTime, null);
  assert.equal(status.actionComparisonUnknown, true);
  assert.equal(status.actionImpact.code, 'unknown');
  assert.doesNotMatch(status.actionImpact.text, /変更はありません/);
});

test('same-day unknown clock times do not silently choose an exact latest time', () => {
  const status = informationStatus({ history: [event('2026-10-25', '2026-10-25T06:12:00+09:00', 'changed'), event('2026-10-25', null)] });
  assert.equal(status.lastChangedAt, '2026-10-25');
  assert.equal(status.lastChangedAtTime, null);
  assert.equal(status.lastActionChangedAt, null);
  assert.equal(status.actionComparisonUnknown, true);
});

test('provider dates, invalid history and app releases never become action or content timestamps', () => {
  const status = informationStatus({ publishedAt: '2026-10-25', updatedAt: '2026-10-25', history: [event('2026-02-30', null, 'changed'), event('2026-10-25', null, 'changed', { type: 'release' }), event('2026-10-24', null, 'changed', { type: 'baseline' })] });
  assert.equal(status.lastChangedAt, null);
  assert.equal(status.lastActionChangedAt, null);
});

test('only explicit impact classifications can state that required actions did not change', () => {
  assert.equal(actionImpactForEvent({ title: '必要な対応の変更なし', actionSummary: '変更なし' }).code, 'unknown');
  assert.equal(actionImpactForEvent({ actionImpact: 'unchanged', actionSummary: '公式続報を追加。必要な対応に変更はありません。' }).text, '公式続報を追加。必要な対応に変更はありません。');
  assert.equal(summarizeActionImpact([{ actionImpact: 'unchanged' }, {}]).code, 'unknown');
  assert.equal(summarizeActionImpact([{ actionImpact: 'unchanged' }, { actionImpact: 'changed' }]).code, 'changed');
  assert.equal(summarizeActionImpact([{ actionImpact: 'scope-expanded' }, { actionImpact: 'changed' }]).code, 'scope-expanded');
  assert.equal(summarizeActionImpact([]).code, 'unknown');
});

test('presentation does not mutate source timestamps or history', () => {
  const history = [event('2026-10-25', '2026-10-25T06:12:00+09:00', 'changed')];
  const sources = { a: source('2026-10-25', '2026-10-25T06:10:00+09:00') };
  const before = JSON.stringify({ history, sources });
  informationStatus({ sourceIds: ['a'], history }, sources);
  assert.equal(JSON.stringify({ history, sources }), before);
});

test('every optional live source time has a timezone and matches its recorded Japanese date', () => {
  const allSources = { ...sources, ...breachSources };
  for (const [id, source] of Object.entries(allSources)) {
    if (source.checkedAtTime === undefined) continue;
    const status = informationStatus({ sourceIds: [id] }, allSources);
    assert.ok(status.checkedAtTime, `${id}: time must be valid and belong to checkedAt in Japan`);
    assert.equal(status.checkedAtTime, new Date(source.checkedAtTime).toISOString(), id);
  }
});

test('optional incident timing and action comparison metadata survive publication-history projection', () => {
  for (const incident of breachIncidents) incident.history.forEach((entry, index) => {
    const id = `incident-${incident.id}-${entry.id ?? `${entry.date}-${index}`}`;
    const projected = updateHistory.find(event => event.id === id);
    assert.ok(projected, id);
    for (const field of ['changedAtTime', 'actionImpact', 'actionSummary', 'changeKind']) {
      if (entry[field] !== undefined) assert.equal(projected[field], entry[field], `${id}: ${field}`);
    }
    if (entry.changedAtTime !== undefined) assert.ok(informationStatus({ history: [entry] }).lastChangedAtTime, `${id}: invalid change timestamp`);
    if (entry.actionImpact !== undefined) assert.ok(['changed', 'unchanged', 'scope-expanded', 'unknown'].includes(entry.actionImpact), `${id}: invalid action comparison`);
  });
});

test('Awa Bank keeps older provider dates separate from its actual source read and first listing', () => {
  const incident = breachIncidents.find(record => record.id === 'awa-bank-test-environment-2026');
  assert.ok(incident);
  const initial = incident.history.find(entry => entry.id === 'initial-listing-20261025');
  assert.ok(initial);
  const firstSourceIds = ['breachAwaBankFirst2026', 'breachAwaBankFollowup2026'];
  const status = informationStatus({ sourceIds: firstSourceIds, history: [initial] }, breachSources);
  assert.equal(incident.publishedAt, '2026-04-03');
  assert.ok(incident.updatedAt >= '2026-06-03');
  assert.equal(breachSources.breachAwaBankFollowup2026.publishedAt, '2026-06-03');
  const sourceTimes = firstSourceIds.map(id => breachSources[id].checkedAtTime);
  assert.ok(sourceTimes.every(Boolean));
  assert.equal(status.checkedAtTime, sourceTimes.map(value => new Date(value).toISOString()).sort()[0]);
  assert.equal(status.lastChangedAtTime, new Date(initial.changedAtTime).toISOString());
  assert.ok(status.checkedAt > '2026-06-03');
  assert.equal(status.lastActionChangedAt, null);
  assert.equal(status.actionImpact.code, 'unknown');
  assert.equal(initial.changeKind, 'new');
});
