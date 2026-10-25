import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createCatalogSnapshot, diffCatalogSnapshots, applySourceReviews } from '../scripts/catalog-snapshot.mjs';

const clone = value => JSON.parse(JSON.stringify(value));
// Historical fixture remains fixed while the live catalog legitimately evolves.
const baselineFixture = JSON.parse(await readFile(new URL('../maintenance/catalog-baseline.json', import.meta.url), 'utf8'));
const initial = () => clone(baselineFixture);

test('tracking baseline is valid and comparison is reproducible', async () => {
  const baseline = initial();
  assert.equal(baseline.schemaVersion, 1);
  assert.ok(Object.keys(baseline.services).length > 0);
  assert.equal(diffCatalogSnapshots(baseline, clone(baseline)).hasContentChanges, false);
  assert.equal(diffCatalogSnapshots(createCatalogSnapshot(), createCatalogSnapshot()).hasContentChanges, false);
});

test('date-only updates do not claim content changes', () => {
  const before = initial(), after = clone(before);
  after.sources.noteNotice.checkedAt = '2026-10-25';
  after.checkedAt = '2026-10-25';
  const diff = diffCatalogSnapshots(before, after);
  assert.equal(diff.hasContentChanges, false);
  assert.deepEqual(diff.changes, []);
  assert.equal(diff.verificationChanges[0].sourceId, 'noteNotice');
  assert.equal(diff.catalogDateChanged, true);
});

test('source URL and text changes reach every service using that source', () => {
  const before = initial(), after = clone(before);
  after.sources.wordpressComNotice.url += '?revision=2';
  const diff = diffCatalogSnapshots(before, after);
  assert.ok(diff.hasContentChanges);
  assert.deepEqual(diff.changedSourceIds, ['wordpressComNotice']);
  assert.ok(diff.changes.some(change => change.serviceId === 'wordpress-com'));
  assert.ok(diff.changes.some(change => change.serviceId === 'wordpress-selfhost'));
  assert.ok(!diff.changes.some(change => change.serviceId === 'note'));
});

test('source publication date corrections are substantive and not inspection dates', () => {
  const before = initial(), after = clone(before);
  after.sources.noteNotice.publishedAt = '2026-10-23';
  assert.ok(diffCatalogSnapshots(before, after).hasContentChanges);
});

test('service instructions, additions and removals are captured', () => {
  const before = initial(), after = clone(before);
  after.services.note.officialAction.text += ' updated';
  after.services.newService = { ...after.services.note, id:'newService', name:'New' };
  delete after.services.booth;
  const diff = diffCatalogSnapshots(before, after);
  assert.equal(diff.changes.find(change => change.serviceId === 'newService').kind, 'added');
  assert.equal(diff.changes.find(change => change.serviceId === 'booth').kind, 'removed');
  assert.deepEqual(diff.changes.find(change => change.serviceId === 'note').fields, ['officialAction']);
});

test('object key reordering is not a content change', () => {
  const before = initial(), after = clone(before);
  after.sources.noteNotice = Object.fromEntries(Object.entries(after.sources.noteNotice).reverse());
  assert.equal(diffCatalogSnapshots(before, after).hasContentChanges, false);
});

test('failed or header-only readings never advance verification dates', () => {
  const before = initial();
  for (const review of [{outcome:'failed',bodyRead:false},{outcome:'unconfirmed',bodyRead:false},{outcome:'read',bodyRead:false}]) {
    const result = applySourceReviews(before, [{sourceId:'noteNotice', attemptedAt:'2026-10-25', ...review}]);
    assert.deepEqual(result.snapshot, before);
    assert.equal(result.accepted.length, 0);
    assert.equal(result.deferred.length, 1);
  }
});

test('verified body reads update only matched source date, never global or content facts', () => {
  const before = initial();
  const result = applySourceReviews(before, [{sourceId:'noteNotice', attemptedAt:'2026-10-25', outcome:'read', bodyRead:true, url:before.sources.noteNotice.url}]);
  assert.equal(result.snapshot.sources.noteNotice.checkedAt, '2026-10-25');
  assert.equal(result.snapshot.checkedAt, before.checkedAt);
  assert.equal(before.sources.noteNotice.checkedAt, '2026-10-24');
  assert.equal(diffCatalogSnapshots(before, result.snapshot).hasContentChanges, false);
});

test('unknown source, duplicate source, mismatched URL and regressing date are rejected', () => {
  const before = initial();
  const valid = {sourceId:'noteNotice', attemptedAt:'2026-10-25', outcome:'read', bodyRead:true, url:before.sources.noteNotice.url};
  for (const reviews of [ [{...valid,sourceId:'unknown'}], [valid,valid], [{...valid,url:'https://example.test'}], [{...valid,attemptedAt:'2026-10-23'}], [{...valid,attemptedAt:'2026-02-30'}] ]) {
    assert.throws(() => applySourceReviews(before, reviews));
  }
});

function incidentFixture() {
  return createCatalogSnapshot({
    services: [{ id: 'fixture-service', name: 'Fixture service' }], sources: {}, checkedAt: '2026-10-24',
    breachSources: { fixtureNotice: { title: 'Fixture notice', url: 'https://example.test/notice', publishedAt: '2026-10-01', checkedAt: '2026-10-24' } },
    breachIncidents: [{ id: 'fixture-incident', title: 'Fixture incident', serviceIds: ['fixture-service'], sourceIds: ['fixtureNotice'],
      status: { label: '調査中', text: 'Fixture explanation' }, providerResponse: { label: '対策実施', text: 'Fixture mitigation' } }],
    breachReviews: { 'fixture-service': { attemptedAt: '2026-10-24', status: 'body-reviewed', note: 'Fixture review', sourceIds: ['fixtureNotice'] } },
  });
}

test('older schema 1 snapshots remain compatible when incident maps are absent', () => {
  const before = initial(), after = clone(before);
  after.incidents = {}; after.breachReviews = {};
  const diff = diffCatalogSnapshots(before, after);
  assert.equal(diff.hasContentChanges, false);
  assert.deepEqual(diff.incidentChanges, []);
});

test('source IDs cannot collide across PHP and breach catalogs', () => {
  assert.throws(() => createCatalogSnapshot({ services: [], sources: { notice: {} }, breachSources: { notice: {} } }), /Duplicate source id/);
  assert.throws(() => createCatalogSnapshot({ services: [], sources: {}, breachIncidents: [{ id: 'duplicate' }, { id: 'duplicate' }] }), /Duplicate incident id/);
});

test('incident status and provider response changes retain affected services separately', () => {
  const before = incidentFixture(), after = clone(before);
  after.incidents['fixture-incident'].status.label = '流出を確認';
  after.incidents['fixture-incident'].serviceIds.push('another-service');
  const diff = diffCatalogSnapshots(before, after);
  assert.equal(diff.hasContentChanges, true);
  assert.deepEqual(diff.changes, []);
  assert.deepEqual(diff.incidentChanges[0].serviceIds, ['another-service', 'fixture-service']);
  assert.equal(diff.incidentChanges[0].incidentId, 'fixture-incident');
  assert.ok(diff.incidentChanges[0].fields.includes('status'));
  assert.ok(!diff.incidentChanges[0].fields.includes('providerResponse'));
});

test('incident addition, removal and source corrections are reported', () => {
  const before = incidentFixture(), after = clone(before);
  after.sources.fixtureNotice.url += '/corrected';
  assert.deepEqual(diffCatalogSnapshots(before, after).incidentChanges[0].sourceIds, ['fixtureNotice']);
  after.incidents['second-incident'] = { ...after.incidents['fixture-incident'], id: 'second-incident' };
  delete after.incidents['fixture-incident'];
  const changes = diffCatalogSnapshots(before, after).incidentChanges;
  assert.equal(changes.find(change => change.incidentId === 'fixture-incident').kind, 'removed');
  assert.equal(changes.find(change => change.incidentId === 'second-incident').kind, 'added');
});

test('breach source and search attempt date-only updates are verification changes', () => {
  const before = incidentFixture(), after = clone(before);
  after.sources.fixtureNotice.checkedAt = '2026-10-25';
  after.breachReviews['fixture-service'].attemptedAt = '2026-10-25';
  const diff = diffCatalogSnapshots(before, after);
  assert.equal(diff.hasContentChanges, false);
  assert.deepEqual(diff.incidentChanges, []);
  assert.deepEqual(diff.reviewChanges, []);
  assert.equal(diff.verificationChanges[0].sourceId, 'fixtureNotice');
  assert.equal(diff.reviewVerificationChanges[0].serviceId, 'fixture-service');
});

test('changed search scope is distinguishable from an incident content change', () => {
  const before = incidentFixture(), after = clone(before);
  after.breachReviews['fixture-service'].note = 'Different review scope';
  const diff = diffCatalogSnapshots(before, after);
  assert.equal(diff.hasContentChanges, true);
  assert.deepEqual(diff.incidentChanges, []);
  assert.deepEqual(diff.reviewChanges[0].fields, ['note']);
});

test('breach source body review advances only that source and failed review changes nothing', () => {
  const before = incidentFixture();
  const failed = applySourceReviews(before, [{ sourceId: 'fixtureNotice', attemptedAt: '2026-10-25', outcome: 'failed', bodyRead: false }]);
  assert.deepEqual(failed.snapshot, before);
  const success = applySourceReviews(before, [{ sourceId: 'fixtureNotice', attemptedAt: '2026-10-25', outcome: 'read', bodyRead: true, url: before.sources.fixtureNotice.url }]);
  assert.equal(success.snapshot.sources.fixtureNotice.checkedAt, '2026-10-25');
  assert.deepEqual(success.snapshot.incidents, before.incidents);
  assert.deepEqual(success.snapshot.breachReviews, before.breachReviews);
  assert.equal(diffCatalogSnapshots(before, success.snapshot).hasContentChanges, false);
});

const timedRead = (snapshot, at, extras = {}) => ({
  sourceId: 'fixtureNotice', attemptedAt: '2026-10-25', attemptedAtTime: at,
  outcome: 'read', bodyRead: true, url: snapshot.sources.fixtureNotice.url, ...extras,
});

test('morning and evening body reads are distinguishable without creating content changes', () => {
  const before = incidentFixture();
  const morning = applySourceReviews(before, [timedRead(before, '2026-10-25T06:12:00+09:00')]).snapshot;
  const evening = applySourceReviews(morning, [timedRead(morning, '2026-10-25T18:20:35+09:00')]).snapshot;
  assert.equal(evening.sources.fixtureNotice.checkedAt, '2026-10-25');
  assert.equal(evening.sources.fixtureNotice.checkedAtTime, '2026-10-25T18:20:35+09:00');
  assert.deepEqual(evening.sources.fixtureNotice.lastAttempt, { at: '2026-10-25T18:20:35+09:00', outcome: 'read' });
  assert.equal(evening.checkedAt, before.checkedAt);
  assert.deepEqual(evening.incidents, before.incidents);
  const diff = diffCatalogSnapshots(morning, evening);
  assert.equal(diff.hasContentChanges, false);
  assert.deepEqual(diff.changedSourceIds, []);
  assert.equal(diff.verificationChanges.length, 1);
  assert.equal(diff.verificationChanges[0].before, '2026-10-25');
  assert.equal(diff.verificationChanges[0].after, '2026-10-25');
  assert.equal(diff.verificationChanges[0].beforeTime, '2026-10-25T06:12:00+09:00');
  assert.equal(diff.verificationChanges[0].afterTime, '2026-10-25T18:20:35+09:00');
  diff.verificationChanges[0].afterAttempt.outcome = 'unavailable';
  assert.equal(evening.sources.fixtureNotice.lastAttempt.outcome, 'read');
});

test('failed timed rereads preserve the exact last successful check and report the failed attempt', () => {
  const before = incidentFixture();
  const morning = applySourceReviews(before, [timedRead(before, '2026-10-25T06:12:00+09:00')]).snapshot;
  for (const review of [{ outcome: 'failed', bodyRead: false }, { outcome: 'read', bodyRead: false }]) {
    const result = applySourceReviews(morning, [timedRead(morning, '2026-10-25T18:20:00+09:00', { ...review, note: '公式本文を取得できず' })]);
    const source = result.snapshot.sources.fixtureNotice;
    assert.equal(source.checkedAt, '2026-10-25');
    assert.equal(source.checkedAtTime, '2026-10-25T06:12:00+09:00');
    assert.deepEqual(source.lastAttempt, { at: '2026-10-25T18:20:00+09:00', outcome: 'unavailable', note: '公式本文を取得できず' });
    assert.equal(result.accepted.length, 0);
    assert.equal(result.deferred.length, 1);
    assert.equal(result.deferred[0].attemptedAtTime, '2026-10-25T18:20:00+09:00');
    assert.equal(diffCatalogSnapshots(morning, result.snapshot).hasContentChanges, false);
  }
  assert.equal(morning.sources.fixtureNotice.lastAttempt.outcome, 'read');
});

test('review times require an explicit zone and the actual Japanese calendar date', () => {
  const before = incidentFixture();
  // Midnight in Japan can still be the previous UTC date.
  const midnight = applySourceReviews(before, [timedRead(before, '2026-10-24T15:00:00Z')]).snapshot;
  assert.equal(midnight.sources.fixtureNotice.checkedAt, '2026-10-25');
  for (const at of ['2026-10-25T06:12:00', '2026-10-25', '2026-10-24T14:59:59Z', '2026-02-30T06:12:00+09:00', '2026-10-25T24:00:00+09:00', '2026-10-25T06:60:00+09:00', '2026-10-25T06:12:60+09:00', '2026-10-25T06:12:00+24:00']) {
    assert.throws(() => applySourceReviews(before, [timedRead(before, at)]), /Attempt time/);
  }
});

test('out-of-order successful and unavailable timed attempts cannot move the review clock backwards', () => {
  const before = incidentFixture();
  const evening = applySourceReviews(before, [timedRead(before, '2026-10-25T18:20:00+09:00')]).snapshot;
  for (const extras of [{}, { outcome: 'failed', bodyRead: false }]) {
    assert.throws(() => applySourceReviews(evening, [timedRead(evening, '2026-10-25T06:12:00+09:00', extras)]), /backwards/);
  }
  const failure = applySourceReviews(evening, [timedRead(evening, '2026-10-26T06:00:00+09:00', { attemptedAt: '2026-10-26', outcome: 'failed', bodyRead: false })]).snapshot;
  assert.throws(() => applySourceReviews(failure, [timedRead(failure, '2026-10-25T19:00:00+09:00')]), /backwards/);
  assert.throws(() => applySourceReviews(failure, [{ sourceId: 'fixtureNotice', attemptedAt: '2026-10-25', outcome: 'read', bodyRead: true, url: failure.sources.fixtureNotice.url }]), /backwards/);
  const utcEqual = applySourceReviews(evening, [timedRead(evening, '2026-10-25T09:20:00Z')]).snapshot;
  assert.equal(utcEqual.sources.fixtureNotice.checkedAtTime, '2026-10-25T09:20:00Z');
});

test('an untimed later successful read cannot reuse an old precise time or stale failure', () => {
  const before = incidentFixture();
  const morning = applySourceReviews(before, [timedRead(before, '2026-10-25T06:12:00+09:00')]).snapshot;
  const failure = applySourceReviews(morning, [timedRead(morning, '2026-10-25T18:20:00+09:00', { outcome: 'failed', bodyRead: false })]).snapshot;
  const nextDay = applySourceReviews(failure, [{ sourceId: 'fixtureNotice', attemptedAt: '2026-10-26', outcome: 'read', bodyRead: true, url: failure.sources.fixtureNotice.url }]).snapshot;
  assert.equal(nextDay.sources.fixtureNotice.checkedAt, '2026-10-26');
  assert.equal(Object.hasOwn(nextDay.sources.fixtureNotice, 'checkedAtTime'), false);
  assert.equal(Object.hasOwn(nextDay.sources.fixtureNotice, 'lastAttempt'), false);
  assert.equal(diffCatalogSnapshots(failure, nextDay).hasContentChanges, false);
});

test('partial timed reviews update only the reviewed source and service attempt times stay verification-only', () => {
  const before = incidentFixture();
  before.sources.secondNotice = { ...before.sources.fixtureNotice, url: 'https://example.test/second' };
  const after = applySourceReviews(before, [timedRead(before, '2026-10-25T06:12:00+09:00')]).snapshot;
  assert.deepEqual(after.sources.secondNotice, before.sources.secondNotice);
  after.breachReviews['fixture-service'].attemptedAtTime = '2026-10-24T06:12:00+09:00';
  const diff = diffCatalogSnapshots(before, after);
  assert.equal(diff.hasContentChanges, false);
  assert.deepEqual(diff.reviewChanges, []);
  assert.deepEqual(diff.reviewVerificationChanges, [{ serviceId: 'fixture-service', before: '2026-10-24', after: '2026-10-24', beforeTime: null, afterTime: '2026-10-24T06:12:00+09:00' }]);
});
