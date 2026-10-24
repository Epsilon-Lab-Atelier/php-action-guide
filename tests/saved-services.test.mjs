import test from 'node:test';
import assert from 'node:assert/strict';
import { SAVED_SERVICES_KEY, readSavedServices, saveSavedService, removeSavedService, clearSavedServices, savedServiceRevision } from '../src/saved-services.mjs';

const catalog = [{ id: 'note', roles: ['user', 'admin'] }, { id: 'line', roles: ['user'] }, { id: 'wordpress-selfhost', roles: ['admin'] }];
const firstRevision = savedServiceRevision({ title: '公式案内', action: '確認する', date: '2026-10-25' });
const note = { serviceId: 'note', role: 'user', revision: firstRevision };
function fakeStorage(initial) {
  const values = new Map(initial === undefined ? [] : [[SAVED_SERVICES_KEY, initial]]);
  const mutations = [];
  return { values, mutations,
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { mutations.push(['set', key]); values.set(key, value); },
    removeItem(key) { mutations.push(['remove', key]); values.delete(key); }
  };
}
function payload(entries, extra = {}) { return JSON.stringify({ version: 1, consent: true, entries, ...extra }); }

test('initial reading and reading an explicitly saved list never write or repair storage', () => {
  const empty = fakeStorage();
  assert.deepEqual(readSavedServices(empty, catalog), { ok: true, status: 'empty', entries: [] });
  assert.equal(empty.mutations.length, 0);
  const stored = fakeStorage(payload([note]));
  const result = readSavedServices(stored, catalog);
  assert.deepEqual(result, { ok: true, status: 'loaded', entries: [note] });
  result.entries[0].role = 'admin';
  assert.deepEqual(readSavedServices(stored, catalog).entries, [note]);
  assert.equal(stored.mutations.length, 0);
});

test('explicit save stores only the service, role and content revision with consent', () => {
  const storage = fakeStorage();
  const result = saveSavedService(storage, catalog, { ...note, usage: ['purchase'], checkedTasks: ['secret'], payment: true, hostname: 'private.example', url: 'https://private.example/?token=secret' });
  assert.deepEqual(result, { ok: true, status: 'saved', entries: [note] });
  assert.equal(storage.mutations.length, 1);
  assert.deepEqual(JSON.parse(storage.values.get(SAVED_SERVICES_KEY)), { version: 1, consent: true, entries: [note] });
  assert.doesNotMatch(storage.values.get(SAVED_SERVICES_KEY), /secret|payment|purchase|private/);
});

test('services and roles have separate entries, while an explicit save replaces a revision', () => {
  const storage = fakeStorage();
  saveSavedService(storage, catalog, note);
  const admin = { ...note, role: 'admin' };
  saveSavedService(storage, catalog, admin);
  const changed = { ...note, revision: savedServiceRevision({ action: '変更後' }) };
  assert.notEqual(changed.revision, note.revision);
  const result = saveSavedService(storage, catalog, changed);
  assert.deepEqual(result.entries, [changed, admin]);
  assert.deepEqual(readSavedServices(storage, catalog).entries, [changed, admin]);
});

test('invalid identities and revisions are rejected before any write', () => {
  const storage = fakeStorage();
  for (const input of [null, {}, { ...note, serviceId: 'unknown' }, { ...note, serviceId: '__proto__' }, { ...note, serviceId: 'constructor' }, { ...note, serviceId: 'line', role: 'admin' }, { ...note, role: 'owner' }, { ...note, revision: 'https://secret.example' }, { ...note, revision: '' }, { ...note, revision: 'a'.repeat(17) }, Object.create(note)]) {
    assert.equal(saveSavedService(storage, catalog, input).status, 'invalid');
  }
  assert.equal(storage.mutations.length, 0);
});

test('malformed, unconsented, unknown and duplicate stored entries are rejected without writes', () => {
  for (const raw of ['', '{', 'null', '[]', payload([note], { version: 2 }), payload([note], { consent: false }), JSON.stringify({ version: 1, entries: [note] }), payload([note, note]), payload([{ ...note, serviceId: 'missing' }]), payload([{ ...note, serviceId: 'line', role: 'admin' }]), payload([{ ...note, checkedTasks: ['private'] }]), payload([note], { extra: 'private' }), '{"version":1,"consent":true,"entries":[],"__proto__":{"polluted":true}}', ' '.repeat(32769)]) {
    const storage = fakeStorage(raw);
    assert.equal(readSavedServices(storage, catalog).status, 'malformed');
    assert.equal(saveSavedService(storage, catalog, note).status, 'malformed');
    assert.equal(storage.mutations.length, 0);
  }
  assert.equal({}.polluted, undefined);
});

test('blocked storage and quota errors are returned without throwing or discarding the old list', () => {
  const denied = Object.assign(new Error('blocked'), { name: 'SecurityError' });
  const readBlocked = { getItem() { throw denied; } };
  assert.equal(readSavedServices(readBlocked, catalog).status, 'unavailable');
  assert.equal(saveSavedService(readBlocked, catalog, note).status, 'unavailable');
  assert.equal(readSavedServices(null, catalog).status, 'unavailable');
  const getterBlocked = Object.defineProperty({}, 'getItem', { get() { throw denied; } });
  assert.equal(readSavedServices(getterBlocked, catalog).status, 'unavailable');
  const storage = fakeStorage(payload([note]));
  storage.setItem = () => { throw Object.assign(new Error('full'), { name: 'QuotaExceededError' }); };
  const result = saveSavedService(storage, catalog, { ...note, role: 'admin' });
  assert.deepEqual(result, { ok: false, status: 'quota', entries: [note] });
  assert.deepEqual(readSavedServices(storage, catalog).entries, [note]);
});

test('removal is scoped to service and role and leaves unrelated origin storage alone', () => {
  const admin = { ...note, role: 'admin' };
  const line = { ...note, serviceId: 'line' };
  const storage = fakeStorage(payload([note, admin, line]));
  storage.values.set('another-app', 'keep me');
  assert.deepEqual(removeSavedService(storage, catalog, note).entries, [admin, line]);
  assert.equal(storage.values.get('another-app'), 'keep me');
  assert.equal(removeSavedService(storage, catalog, note).status, 'unchanged');
  assert.equal(storage.mutations.length, 1);
  removeSavedService(storage, catalog, admin);
  assert.deepEqual(removeSavedService(storage, catalog, line), { ok: true, status: 'removed', entries: [] });
  assert.equal(storage.values.has(SAVED_SERVICES_KEY), false);
  assert.equal(storage.values.get('another-app'), 'keep me');
});

test('explicit clear can remove a malformed list and never calls storage.clear', () => {
  const storage = fakeStorage('{');
  storage.values.set('another-app', 'keep me');
  storage.clear = () => { throw new Error('must not clear origin storage'); };
  assert.deepEqual(clearSavedServices(storage), { ok: true, status: 'cleared', entries: [] });
  assert.equal(storage.values.get('another-app'), 'keep me');
  assert.deepEqual(storage.mutations, [['remove', SAVED_SERVICES_KEY]]);
});

test('failed removal reports the previous list, and clear reports blocked storage', () => {
  const storage = fakeStorage(payload([note]));
  storage.removeItem = () => { throw new Error('blocked'); };
  assert.deepEqual(removeSavedService(storage, catalog, note), { ok: false, status: 'unavailable', entries: [note] });
  assert.equal(clearSavedServices(storage).status, 'unavailable');
  assert.deepEqual(readSavedServices(storage, catalog).entries, [note]);
});

test('content markers are stable across key order and change for same-day content revisions', () => {
  assert.equal(savedServiceRevision({ b: [1, null, '日本語'], a: true }), savedServiceRevision({ a: true, b: [1, null, '日本語'] }));
  assert.notEqual(savedServiceRevision({ date: '2026-10-25', action: 'before' }), savedServiceRevision({ date: '2026-10-25', action: 'after' }));
  assert.match(firstRevision, /^[a-f0-9]{16}$/);
  const cyclic = {}; cyclic.self = cyclic;
  for (const value of [cyclic, undefined, Infinity, new Date(), { value: undefined }]) assert.throws(() => savedServiceRevision(value), TypeError);
});
