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
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;

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
  const { checkedAt: ignored, ...content } = source;
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
  const { attemptedAt: ignored, ...content } = review;
  return content;
}

/** Date-only rereads are reported separately from actual content or source changes. */
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
    if (oldSource?.checkedAt !== newSource?.checkedAt) verificationChanges.push({ sourceId: id, before: oldSource?.checkedAt ?? null, after: newSource?.checkedAt ?? null });
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
    if (oldReview?.attemptedAt !== newReview?.attemptedAt) reviewVerificationChanges.push({ serviceId: id, before: oldReview?.attemptedAt ?? null, after: newReview?.attemptedAt ?? null });
  }
  return { schemaVersion: 1,
    hasContentChanges: changes.length > 0 || changedSourceIds.length > 0 || incidentChanges.length > 0 || reviewChanges.length > 0,
    changes, incidentChanges, reviewChanges, changedSourceIds, verificationChanges, reviewVerificationChanges,
    catalogDateChanged: before.checkedAt !== after.checkedAt,
  };
}

/** Explicit successful reading can advance a source date; failures never erase it. */
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
    if (review.outcome !== 'read' || review.bodyRead !== true) {
      deferred.push({ sourceId: review.sourceId, outcome: review.outcome ?? 'unconfirmed', attemptedAt: review.attemptedAt });
      continue;
    }
    if (review.url !== next.sources[review.sourceId].url) throw new Error('Reviewed URL does not match the registered source');
    if (next.sources[review.sourceId].checkedAt && review.attemptedAt < next.sources[review.sourceId].checkedAt) throw new Error('Review date would move backwards');
    next.sources[review.sourceId].checkedAt = review.attemptedAt;
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
