import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { sources, checkedAt } from '../src/catalog.mjs';
import { directoryServices as services } from '../src/service-directory.mjs';
import { breachIncidents, breachSources, breachReviews } from '../src/incidents.mjs';

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  return value;
}
const serialized = value => JSON.stringify(canonical(value));
const copy = value => JSON.parse(JSON.stringify(value));
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;

function validReviewTime(value) {
  if (typeof value !== 'string') return false;
  const match = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/);
  if (!match || !validDate(match[1]) || Number(match[2]) > 23 || Number(match[3]) > 59 || Number(match[4]) > 59) return false;
  return Number.isFinite(Date.parse(value));
}
const reviewJapanDate = value => new Date(Date.parse(value) + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);

export function createCatalogSnapshot(catalog = { services, sources, checkedAt, breachIncidents, breachSources, breachReviews }) {
  const ids = catalog.services.map(service => service.id);
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate service id');
  const incidents = catalog.breachIncidents ?? [];
  const incidentIds = incidents.map(incident => incident.id);
  if (new Set(incidentIds).size !== incidentIds.length) throw new Error('Duplicate incident id');
  const additionalSources = catalog.breachSources ?? {};
  for (const id of Object.keys(additionalSources)) {
    if (Object.hasOwn(catalog.sources, id)) throw new Error(`Duplicate source id across catalogs: ${id}`);
  }
  return canonical({ schemaVersion: 1, checkedAt: catalog.checkedAt,
    services: Object.fromEntries(catalog.services.map(service => [service.id, service])),
    sources: { ...catalog.sources, ...additionalSources },
    incidents: Object.fromEntries(incidents.map(incident => [incident.id, incident])),
    breachReviews: catalog.breachReviews ?? {},
  });
}

function validateSnapshot(snapshot) {
  if (snapshot?.schemaVersion !== 1 || !snapshot.services || !snapshot.sources) throw new Error('Invalid catalog snapshot');
  // Version 1 snapshots made before incident tracking omit these two maps.
  for (const key of ['services', 'sources', 'incidents', 'breachReviews']) {
    if (snapshot[key] !== undefined && (!snapshot[key] || typeof snapshot[key] !== 'object' || Array.isArray(snapshot[key]))) throw new Error(`Invalid snapshot map: ${key}`);
  }
}

function substantiveSource(source) {
  if (!source) return source;
  const { checkedAt: ignoredDate, checkedAtTime: ignoredTime, lastAttempt: ignoredAttempt, ...content } = source;
  return content;
}

function referencedIds(service) {
  return [...new Set([...(service?.php?.sourceIds ?? []), ...(service?.incident?.sourceIds ?? []), ...(service?.officialAction?.sourceIds ?? []), ...(service?.supportSourceIds ?? []), ...(service?.domainSourceIds ?? [])])];
}

function changedFields(before, after) {
  return [...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])]
    .filter(key => serialized(before?.[key]) !== serialized(after?.[key]));
}

function substantiveReview(review) {
  if (!review) return review;
  const { attemptedAt: ignoredDate, attemptedAtTime: ignoredTime, ...content } = review;
  return content;
}

/** Verification dates, precise times and failures are separate from content changes. */
export function diffCatalogSnapshots(before, after) {
  validateSnapshot(before); validateSnapshot(after);
  const changes = [];
  const verificationChanges = [];
  const changedSourceIds = [];
  const incidentChanges = [];
  const reviewChanges = [];
  const reviewVerificationChanges = [];
  for (const id of [...new Set([...Object.keys(before.sources), ...Object.keys(after.sources)])].sort()) {
    const oldSource = before.sources[id], newSource = after.sources[id];
    if (serialized(substantiveSource(oldSource)) !== serialized(substantiveSource(newSource))) changedSourceIds.push(id);
    if (oldSource?.checkedAt !== newSource?.checkedAt || oldSource?.checkedAtTime !== newSource?.checkedAtTime || serialized(oldSource?.lastAttempt) !== serialized(newSource?.lastAttempt)) {
      const change = { sourceId: id, before: oldSource?.checkedAt ?? null, after: newSource?.checkedAt ?? null };
      if (oldSource?.checkedAtTime !== undefined || newSource?.checkedAtTime !== undefined) Object.assign(change, { beforeTime: oldSource?.checkedAtTime ?? null, afterTime: newSource?.checkedAtTime ?? null });
      if (oldSource?.lastAttempt !== undefined || newSource?.lastAttempt !== undefined) Object.assign(change, { beforeAttempt: oldSource?.lastAttempt ? copy(oldSource.lastAttempt) : null, afterAttempt: newSource?.lastAttempt ? copy(newSource.lastAttempt) : null });
      verificationChanges.push(change);
    }
  }
  for (const id of [...new Set([...Object.keys(before.services), ...Object.keys(after.services)])].sort()) {
    const oldService = before.services[id], newService = after.services[id];
    const fields = changedFields(oldService, newService);
    const relevant = new Set([...referencedIds(oldService), ...referencedIds(newService)]);
    const sourceIds = changedSourceIds.filter(sourceId => relevant.has(sourceId));
    if (fields.length || sourceIds.length) changes.push({ serviceId: id, name: newService?.name ?? oldService?.name, kind: !oldService ? 'added' : !newService ? 'removed' : 'changed', fields, sourceIds });
  }
  const oldIncidents = before.incidents ?? {}, newIncidents = after.incidents ?? {};
  for (const id of [...new Set([...Object.keys(oldIncidents), ...Object.keys(newIncidents)])].sort()) {
    const oldIncident = oldIncidents[id], newIncident = newIncidents[id];
    const fields = changedFields(oldIncident, newIncident);
    const relevant = new Set([...(oldIncident?.sourceIds ?? []), ...(newIncident?.sourceIds ?? [])]);
    const sourceIds = changedSourceIds.filter(sourceId => relevant.has(sourceId));
    if (fields.length || sourceIds.length) incidentChanges.push({ incidentId: id,
      serviceIds: [...new Set([...(oldIncident?.serviceIds ?? []), ...(newIncident?.serviceIds ?? [])])].sort(),
      title: newIncident?.title ?? oldIncident?.title,
      kind: !oldIncident ? 'added' : !newIncident ? 'removed' : 'changed', fields, sourceIds,
    });
  }
  const oldReviews = before.breachReviews ?? {}, newReviews = after.breachReviews ?? {};
  for (const id of [...new Set([...Object.keys(oldReviews), ...Object.keys(newReviews)])].sort()) {
    const oldReview = oldReviews[id], newReview = newReviews[id];
    const fields = changedFields(substantiveReview(oldReview), substantiveReview(newReview));
    if (fields.length) reviewChanges.push({ serviceId: id, kind: !oldReview ? 'added' : !newReview ? 'removed' : 'changed', fields });
    if (oldReview?.attemptedAt !== newReview?.attemptedAt || oldReview?.attemptedAtTime !== newReview?.attemptedAtTime) {
      const change = { serviceId: id, before: oldReview?.attemptedAt ?? null, after: newReview?.attemptedAt ?? null };
      if (oldReview?.attemptedAtTime !== undefined || newReview?.attemptedAtTime !== undefined) Object.assign(change, { beforeTime: oldReview?.attemptedAtTime ?? null, afterTime: newReview?.attemptedAtTime ?? null });
      reviewVerificationChanges.push(change);
    }
  }
  return { schemaVersion: 1,
    hasContentChanges: changes.length > 0 || changedSourceIds.length > 0 || incidentChanges.length > 0 || reviewChanges.length > 0,
    changes, incidentChanges, reviewChanges, changedSourceIds, verificationChanges, reviewVerificationChanges,
    catalogDateChanged: before.checkedAt !== after.checkedAt,
  };
}

/** Only body reads advance verification. Timed failures retain the last successful read. */
export function applySourceReviews(snapshot, reviews) {
  validateSnapshot(snapshot);
  if (!Array.isArray(reviews)) throw new Error('Reviews must be an array');
  const next = copy(snapshot);
  const accepted = [], deferred = [];
  const seen = new Set();
  for (const review of reviews) {
    if (!review || typeof review.sourceId !== 'string' || seen.has(review.sourceId)) throw new Error('Missing or duplicate review source id');
    seen.add(review.sourceId);
    if (!next.sources[review.sourceId]) throw new Error(`Unknown source id: ${review.sourceId}`);
    if (!validDate(review.attemptedAt)) throw new Error('Invalid attempt date');
    const source = next.sources[review.sourceId];
    const timed = review.attemptedAtTime !== undefined;
    if (timed) {
      if (!validReviewTime(review.attemptedAtTime) || reviewJapanDate(review.attemptedAtTime) !== review.attemptedAt) throw new Error('Attempt time must be a valid zoned timestamp matching the Japanese attempt date');
      if (source.checkedAt && review.attemptedAt < source.checkedAt) throw new Error('Review date would move backwards');
      for (const previous of [source.checkedAtTime, source.lastAttempt?.at]) {
        if (validReviewTime(previous) && Date.parse(review.attemptedAtTime) < Date.parse(previous)) throw new Error('Review time would move backwards');
      }
      if (review.note !== undefined && (typeof review.note !== 'string' || review.note.length > 1000)) throw new Error('Review note must be a short string');
    }
    if (review.outcome !== 'read' || review.bodyRead !== true) {
      if (timed) source.lastAttempt = { at: review.attemptedAtTime, outcome: 'unavailable', ...(review.note ? { note: review.note } : {}) };
      deferred.push({ sourceId: review.sourceId, outcome: review.outcome ?? 'unconfirmed', attemptedAt: review.attemptedAt, ...(timed ? { attemptedAtTime: review.attemptedAtTime } : {}) });
      continue;
    }
    if (review.url !== source.url) throw new Error('Reviewed URL does not match the registered source');
    if (source.checkedAt && review.attemptedAt < source.checkedAt) throw new Error('Review date would move backwards');
    if (!timed && validReviewTime(source.lastAttempt?.at) && review.attemptedAt < reviewJapanDate(source.lastAttempt.at)) throw new Error('Review date would move backwards');
    source.checkedAt = review.attemptedAt;
    if (timed) {
      source.checkedAtTime = review.attemptedAtTime;
      source.lastAttempt = { at: review.attemptedAtTime, outcome: 'read', ...(review.note ? { note: review.note } : {}) };
    } else {
      // Do not borrow the previous read's clock time for an untimed new reading,
      // or continue showing a previous failure after a successful body read.
      delete source.checkedAtTime;
      delete source.lastAttempt;
    }
    accepted.push(review.sourceId);
  }
  // A partial source review never advances the whole catalog date.
  return { snapshot: canonical(next), accepted, deferred };
}

async function main(args) {
  const [command, first, second, third] = args;
  if (command === 'write' && first && !second) {
    await writeFile(first, `${JSON.stringify(createCatalogSnapshot(), null, 2)}\n`);
    console.log('Catalog snapshot written. This does not perform a source review.');
  } else if (command === 'diff' && first && second && !third) {
    const diff = diffCatalogSnapshots(JSON.parse(await readFile(first, 'utf8')), JSON.parse(await readFile(second, 'utf8')));
    console.log(JSON.stringify(diff, null, 2));
  } else if (command === 'review' && first && second && third && args.length === 4) {
    const result = applySourceReviews(JSON.parse(await readFile(first, 'utf8')), JSON.parse(await readFile(second, 'utf8')));
    await writeFile(third, `${JSON.stringify(result, null, 2)}\n`);
    console.log(JSON.stringify({ accepted: result.accepted, deferred: result.deferred }));
  } else {
    throw new Error('Usage: node scripts/catalog-snapshot.mjs write OUTPUT | diff BEFORE AFTER | review BASE REVIEWS OUTPUT');
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1; });
