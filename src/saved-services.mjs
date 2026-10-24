// Device storage is used only through the injected object. The UI calls writes
// after an explicit save/remove action; reading never repairs or rewrites data.
export const SAVED_SERVICES_KEY = 'epsilon-service-notebook.saved-services.v1';
const savedServicesMaxLength = 32768;
const savedServicesMaxEntries = 100;
const savedServiceRoles = new Set(['user', 'admin']);
const savedServiceRevisionPattern = /^[a-f0-9]{16}$/;

function savedServicePlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}

function savedServiceIdentity(entry, catalog) {
  if (!savedServicePlainObject(entry) || !Object.hasOwn(entry, 'serviceId') || !Object.hasOwn(entry, 'role')) return null;
  if (typeof entry.serviceId !== 'string' || entry.serviceId.length > 80 || !savedServiceRoles.has(entry.role)) return null;
  if (['__proto__', 'prototype', 'constructor'].includes(entry.serviceId)) return null;
  const service = Array.isArray(catalog) && catalog.find(item => item?.id === entry.serviceId);
  if (!service || !Array.isArray(service.roles) || !service.roles.includes(entry.role)) return null;
  return { serviceId: entry.serviceId, role: entry.role };
}

function savedServiceEntry(entry, catalog, strict = false) {
  const identity = savedServiceIdentity(entry, catalog);
  if (!identity || !Object.hasOwn(entry, 'revision') || typeof entry.revision !== 'string' || !savedServiceRevisionPattern.test(entry.revision)) return null;
  if (strict && (Object.keys(entry).length !== 3 || Object.keys(entry).some(key => !['serviceId', 'role', 'revision'].includes(key)))) return null;
  return { ...identity, revision: entry.revision };
}

function savedServicesResult(ok, status, entries = []) {
  return { ok, status, entries: entries.map(entry => ({ ...entry })) };
}

function savedServicesStorageError(error, entries = []) {
  return savedServicesResult(false, error?.name === 'QuotaExceededError' || error?.code === 22 || error?.code === 1014 ? 'quota' : 'unavailable', entries);
}

export function readSavedServices(storage, catalog) {
  let raw;
  try {
    if (!storage || typeof storage.getItem !== 'function') return savedServicesResult(false, 'unavailable');
    raw = storage.getItem(SAVED_SERVICES_KEY);
  } catch (error) { return savedServicesStorageError(error); }
  if (raw === null || raw === undefined) return savedServicesResult(true, 'empty');
  if (typeof raw !== 'string' || raw.length > savedServicesMaxLength) return savedServicesResult(false, 'malformed');
  try {
    const payload = JSON.parse(raw);
    if (!savedServicePlainObject(payload) || Object.keys(payload).length !== 3 || payload.version !== 1 || payload.consent !== true || !Array.isArray(payload.entries) || payload.entries.length > savedServicesMaxEntries) return savedServicesResult(false, 'malformed');
    if (Object.keys(payload).some(key => !['version', 'consent', 'entries'].includes(key))) return savedServicesResult(false, 'malformed');
    const entries = payload.entries.map(entry => savedServiceEntry(entry, catalog, true));
    const keys = entries.map(entry => entry ? `${entry.serviceId}:${entry.role}` : null);
    if (entries.some(entry => entry === null) || new Set(keys).size !== entries.length) return savedServicesResult(false, 'malformed');
    return savedServicesResult(true, entries.length ? 'loaded' : 'empty', entries);
  } catch { return savedServicesResult(false, 'malformed'); }
}

function writeSavedServices(storage, entries, prior, status) {
  try {
    if (!storage || typeof storage.setItem !== 'function') return savedServicesResult(false, 'unavailable', prior);
    storage.setItem(SAVED_SERVICES_KEY, JSON.stringify({ version: 1, consent: true, entries }));
    return savedServicesResult(true, status, entries);
  } catch (error) { return savedServicesStorageError(error, prior); }
}

export function saveSavedService(storage, catalog, entry) {
  const clean = savedServiceEntry(entry, catalog);
  if (!clean) return savedServicesResult(false, 'invalid');
  const current = readSavedServices(storage, catalog);
  if (!current.ok) return current;
  const index = current.entries.findIndex(item => item.serviceId === clean.serviceId && item.role === clean.role);
  if (index < 0 && current.entries.length >= savedServicesMaxEntries) return savedServicesResult(false, 'limit', current.entries);
  const next = current.entries.map(item => ({ ...item }));
  if (index < 0) next.push(clean);
  else next[index] = clean;
  return writeSavedServices(storage, next, current.entries, 'saved');
}

export function removeSavedService(storage, catalog, entry) {
  const identity = savedServiceIdentity(entry, catalog);
  if (!identity) return savedServicesResult(false, 'invalid');
  const current = readSavedServices(storage, catalog);
  if (!current.ok) return current;
  const next = current.entries.filter(item => item.serviceId !== identity.serviceId || item.role !== identity.role);
  if (next.length === current.entries.length) return savedServicesResult(true, 'unchanged', next);
  if (next.length) return writeSavedServices(storage, next, current.entries, 'removed');
  const cleared = clearSavedServices(storage);
  return cleared.ok ? savedServicesResult(true, 'removed') : savedServicesResult(false, cleared.status, current.entries);
}

export function clearSavedServices(storage) {
  try {
    if (!storage || typeof storage.removeItem !== 'function') return savedServicesResult(false, 'unavailable');
    storage.removeItem(SAVED_SERVICES_KEY);
    return savedServicesResult(true, 'cleared');
  } catch (error) { return savedServicesStorageError(error); }
}

function savedRevisionSerialize(value, seen) {
  if (value === null || ['string', 'boolean'].includes(typeof value)) return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
  if (typeof value !== 'object' || seen.has(value)) throw new TypeError('A saved-service revision requires finite JSON data');
  seen.add(value);
  let result;
  if (Array.isArray(value)) result = `[${value.map(item => savedRevisionSerialize(item, seen)).join(',')}]`;
  else if (savedServicePlainObject(value)) result = `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${savedRevisionSerialize(value[key], seen)}`).join(',')}}`;
  else throw new TypeError('A saved-service revision requires finite JSON data');
  seen.delete(value);
  return result;
}

// Stable, opaque content marker for detecting changes, not a security checksum.
// Pass published catalog content only, never reader input or check selections.
export function savedServiceRevision(content) {
  const serialized = savedRevisionSerialize(content, new Set());
  let digest = 14695981039346656037n;
  for (let index = 0; index < serialized.length; index += 1) {
    digest ^= BigInt(serialized.charCodeAt(index));
    digest = BigInt.asUintN(64, digest * 1099511628211n);
  }
  return digest.toString(16).padStart(16, '0');
}
