import test from 'node:test';
import assert from 'node:assert/strict';
import { sources } from '../src/catalog.mjs';
import { directoryServices as services } from '../src/service-directory.mjs';
import { breachIncidents, breachSources, breachReviews } from '../src/incidents.mjs';
import { incidentsForService, incidentMetadata } from '../src/incident-model.mjs';

function assertCalendarDate(value, label) {
  assert.match(value, /^\d{4}-\d{2}-\d{2}$/, label);
  const parsed = new Date(`${value}T00:00:00Z`);
  assert.ok(Number.isFinite(parsed.getTime()), label);
  assert.equal(parsed.toISOString().slice(0, 10), value, label);
}

const serviceIds = new Set(services.map(service => service.id));

test('Arcadia preserves the latest NET119 count and separates provider-wide scopes', () => {
  const records = incidentsForService(breachIncidents, 'arcadia-raiden');
  assert.equal(records.length, 3);
  const net = records.find(record => record.id === 'arcadia-net119-2026');
  const fire = records.find(record => record.id === 'arcadia-119raiden-2026');
  const mail = records.find(record => record.id === 'arcadia-speecan-2026');
  assert.match(net.scope, /9,020/);
  assert.match(net.excludedData, /要配慮個人情報/);
  assert.match(fire.scope, /fs119\.ktaiwork\.jp のみ/);
  assert.match(fire.excludedData, /対象外/);
  assert.match(mail.scope, /313万6,000/);
  assert.ok(records.every(record => record.status.code === 'possible'));
  assert.ok(records.every(record => record.caution.includes('合算できません')));
});

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
  const referenced = new Set(services.flatMap(service => service.domainSourceIds ?? []));
  for (const incident of breachIncidents) {
    assert.ok(incident.sourceIds.length > 0, incident.id);
    assert.equal(new Set(incident.sourceIds).size, incident.sourceIds.length, incident.id);
    for (const id of incident.sourceIds) {
      assert.ok(Object.hasOwn(breachSources, id), `${incident.id}: ${id}`);
      assert.equal(breachSources[id].kind, 'incident', `${incident.id}: domain evidence must not establish incident facts`);
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
    assert.ok(['incident', 'domain'].includes(source.kind), id);
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
    assert.ok(Array.isArray(incident.dataTypes) && incident.dataTypes.every(text => typeof text === 'string' && text.trim()), incident.id);
    if (!incident.dataTypes.length) assert.match(`${incident.scope} ${incident.status.text}`, /未公表|未確認|調査中/, `${incident.id}: undisclosed data types need an explicit explanation`);
    assert.ok(['confirmed', 'possible', 'access-confirmed', 'investigating', 'unknown', 'not-confirmed'].includes(incident.status.code), incident.id);
    assert.ok(incident.status.label.trim() && incident.status.text.trim(), incident.id);
    assert.ok(incident.providerResponse.label.trim() && incident.providerResponse.text.trim(), incident.id);
    assert.notStrictEqual(incident.status, incident.providerResponse, incident.id);
    assert.ok(incident.officialAction.text.trim(), incident.id);
    for (const id of incident.serviceIds) {
      const service = services.find(item => item.id === id);
      assert.notStrictEqual(incident, service.incident);
      assert.notStrictEqual(incident.officialAction, service.officialAction);
      for (const sourceId of incident.sourceIds) assert.ok(!(service.php?.sourceIds ?? []).includes(sourceId), incident.id);
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

test('JR East and View Card retain the later no-leak report and distinct affected services', () => {
  for (const [serviceId, incidentId] of [['jr-east', 'jr-east-external-mail-2026'], ['view-card', 'view-card-external-mail-2026']]) {
    const [record] = incidentsForService(breachIncidents, serviceId);
    assert.equal(record.id, incidentId);
    assert.deepEqual(record.serviceIds, [serviceId]);
    assert.equal(record.publishedAt, '2026-10-09');
    assert.equal(record.updatedAt, '2026-10-15');
    assert.equal(record.status.code, 'not-confirmed');
    assert.match(record.status.text, /漏えいはなかったと判断したとの報告/);
    assert.ok(record.dataTypes.every(text => text.startsWith('当初調査対象：')));
  }
});

test('Sagawa and Times Car retain uncertainty instead of treating all records as confirmed exposure', () => {
  const [sagawa] = incidentsForService(breachIncidents, 'sagawa');
  assert.equal(sagawa.status.code, 'possible');
  assert.match(sagawa.scope, /重複.*実人数ではありません/);
  assert.match(sagawa.affectedPeriod, /2026年6月21日〜9月30日/);
  const [times] = incidentsForService(breachIncidents, 'times-car');
  assert.equal(times.updatedAt, '2026-10-23');
  assert.match(times.status.text, /外部送信.*閲覧できたかは別/);
  assert.ok(times.dataTypes.some(text => /外部送信の痕跡.*アクセスのみ確認/.test(text)));
});

test('Burger King document reproduction is recorded transparently with publication-index evidence', () => {
  const [record] = incidentsForService(breachIncidents, 'burger-king');
  assert.equal(record.publishedAt, '2026-10-15');
  assert.match(record.excludedData, /パスワード情報の漏えいは未確認/);
  const body = breachSources.breachBurgerKing2026;
  assert.equal(body.verificationMethod, 'official-document-reproduction');
  assert.equal(new URL(body.verificationUrl).protocol, 'https:');
  assert.match(body.verificationNote, /直接取得できず/);
  assert.match(body.verificationNote, /再確認は未完了/);
  assert.ok(record.sourceIds.includes('breachBurgerKingNoticeIndex2026'));
  assert.equal(breachSources.breachBurgerKingNoticeIndex2026.sourceRole, 'publication-index');
});
