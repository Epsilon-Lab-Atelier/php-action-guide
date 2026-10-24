import test from 'node:test';
import assert from 'node:assert/strict';
import { services, sources } from '../src/catalog.mjs';
import { breachIncidents, breachSources, breachReviews } from '../src/incidents.mjs';
import { incidentsForService, incidentMetadata } from '../src/incident-model.mjs';

function assertCalendarDate(value, label) {
  assert.match(value, /^\d{4}-\d{2}-\d{2}$/, label);
  const parsed = new Date(`${value}T00:00:00Z`);
  assert.ok(Number.isFinite(parsed.getTime()), label);
  assert.equal(parsed.toISOString().slice(0, 10), value, label);
}

const serviceIds = new Set(services.map(service => service.id));

test('incident IDs and service references remain unique and resolvable', () => {
  assert.ok(breachIncidents.length > 0);
  assert.equal(new Set(breachIncidents.map(incident => incident.id)).size, breachIncidents.length);
  for (const incident of breachIncidents) {
    assert.match(incident.id, /^[a-z][a-z0-9-]+$/);
    assert.equal(incident.type, 'breach');
    assert.ok(incident.title.trim());
    assert.ok(incident.serviceIds.length > 0, incident.id);
    assert.equal(new Set(incident.serviceIds).size, incident.serviceIds.length, incident.id);
    for (const id of incident.serviceIds) assert.ok(serviceIds.has(id), `${incident.id}: ${id}`);
  }
});

test('incident sources resolve to credential-free HTTPS links and valid calendar dates', () => {
  const referenced = new Set();
  for (const incident of breachIncidents) {
    assert.ok(incident.sourceIds.length > 0, incident.id);
    assert.equal(new Set(incident.sourceIds).size, incident.sourceIds.length, incident.id);
    for (const id of incident.sourceIds) {
      assert.ok(Object.hasOwn(breachSources, id), `${incident.id}: ${id}`);
      referenced.add(id);
    }
  }
  for (const [id, source] of Object.entries(breachSources)) {
    assert.ok(referenced.has(id), `Unreferenced source: ${id}`);
    assert.ok(source.title.trim(), id);
    const url = new URL(source.url);
    assert.equal(url.protocol, 'https:', id);
    assert.equal(url.username, '', id);
    assert.equal(url.password, '', id);
    assert.equal(url.hash, '', id);
    assert.equal(source.kind, 'incident', id);
    assertCalendarDate(source.checkedAt, `${id}.checkedAt`);
    for (const field of ['publishedAt', 'updatedAt']) {
      if (source[field] === null) continue;
      assertCalendarDate(source[field], `${id}.${field}`);
      assert.ok(source[field] <= source.checkedAt, `${id}: ${field} is after the recorded reading`);
    }
    if (source.publishedAt && source.updatedAt) assert.ok(source.publishedAt <= source.updatedAt, id);
  }
});

test('disclosure dates and guide history dates are separately valid', () => {
  for (const incident of breachIncidents) {
    assertCalendarDate(incident.publishedAt, `${incident.id}.publishedAt`);
    if (incident.updatedAt !== null) {
      assertCalendarDate(incident.updatedAt, `${incident.id}.updatedAt`);
      assert.ok(incident.publishedAt <= incident.updatedAt, incident.id);
    }
    assert.ok(incident.affectedPeriod.trim(), incident.id);
    assert.ok(incident.occurredAt.trim(), incident.id);
    assert.ok(Array.isArray(incident.history) && incident.history.length > 0, incident.id);
    for (const entry of incident.history) {
      assertCalendarDate(entry.date, `${incident.id}.history.date`);
      assert.ok(entry.title.trim() && entry.summary.trim(), incident.id);
      if (entry.sourceIds) for (const id of entry.sourceIds) assert.ok(Object.hasOwn(breachSources, id), id);
    }
    const dates = incident.sourceIds.map(id => breachSources[id].checkedAt).sort();
    assert.equal(incidentMetadata(incident, breachSources).checkedAt, dates[0]);
  }
});

test('breach evidence and provider response remain independent of PHP patch data', () => {
  for (const id of Object.keys(breachSources)) assert.ok(!Object.hasOwn(sources, id), `Source ID collision: ${id}`);
  for (const incident of breachIncidents) {
    assert.ok(!Object.hasOwn(incident, 'php'), incident.id);
    assert.ok(incident.scope.trim(), incident.id);
    assert.ok(incident.dataTypes.length > 0 && incident.dataTypes.every(text => typeof text === 'string' && text.trim()), incident.id);
    assert.ok(['confirmed', 'possible', 'access-confirmed', 'investigating', 'unknown'].includes(incident.status.code), incident.id);
    assert.ok(incident.status.label.trim() && incident.status.text.trim(), incident.id);
    assert.ok(incident.providerResponse.label.trim() && incident.providerResponse.text.trim(), incident.id);
    assert.notStrictEqual(incident.status, incident.providerResponse, incident.id);
    assert.ok(incident.officialAction.text.trim(), incident.id);
    for (const id of incident.serviceIds) {
      const service = services.find(item => item.id === id);
      assert.notStrictEqual(incident, service.incident);
      assert.notStrictEqual(incident.officialAction, service.officialAction);
      for (const sourceId of incident.sourceIds) assert.ok(!service.php.sourceIds.includes(sourceId), incident.id);
    }
  }
});

test('Sakura rental-area access is not attributed to VPS environments', () => {
  const rentalId = 'sakura-rental-access-2026';
  const memberId = 'sakura-member-access-2026';
  const rental = incidentsForService(breachIncidents, 'sakura-rental');
  const vps = incidentsForService(breachIncidents, 'sakura-vps');
  assert.ok(rental.some(incident => incident.id === rentalId));
  assert.ok(!vps.some(incident => incident.id === rentalId));
  assert.ok(rental.some(incident => incident.id === memberId));
  const member = vps.find(incident => incident.id === memberId);
  assert.ok(member);
  assert.match(member.scope, /VPSの提供環境への侵入を示すものではありません/);
});

test('LINE GAME notice retains the three-game scope and does not imply all LINE users', () => {
  const incident = breachIncidents.find(item => item.id === 'line-game-identifiers-2026');
  assert.ok(incident);
  assert.deepEqual(incident.serviceIds, ['line']);
  assert.match(incident.scope, /3作品.*対象期間/);
  assert.match(incident.scope, /LINE全利用者が対象という意味ではない/);
  for (const game of ['LINE ポコポコ', 'LINE ポコパンタウン', 'LINE ポコパン']) assert.ok(incident.affectedPeriod.includes(`${game}:`), game);
  assert.match(incident.excludedData, /LINE IDとは異なる/);
  assert.ok(!incidentsForService(breachIncidents, 'yahoo-shopping').some(item => item.id === incident.id));
});

test('research attempts distinguish reading from search without claiming no breach', () => {
  for (const [id, review] of Object.entries(breachReviews)) {
    assert.ok(serviceIds.has(id), id);
    assertCalendarDate(review.attemptedAt, `${id}.attemptedAt`);
    assert.ok(['searched', 'body-reviewed', 'not-reviewed'].includes(review.status), id);
    assert.ok(review.note.trim(), id);
    assert.equal(new Set(review.sourceIds).size, review.sourceIds.length, id);
    for (const sourceId of review.sourceIds) assert.ok(Object.hasOwn(breachSources, sourceId), `${id}: ${sourceId}`);
    if (review.status === 'body-reviewed') assert.ok(review.sourceIds.length > 0, id);
    if (review.status === 'searched') assert.match(review.note, /被害がない.*(意味しません|判断できません)/, id);
  }
});
