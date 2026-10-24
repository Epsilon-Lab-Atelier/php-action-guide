import test from 'node:test';
import assert from 'node:assert/strict';
import { sessionScopeKey, snapshotSessionProgress, rememberSessionProgress, restoreSessionProgress, resetSessionChecks } from '../src/session.mjs';

const progressFor = (serviceId, role = 'user') => ({
  kind: 'found', service: { id: serviceId }, role,
  usage: ['browse', 'purchase'], checkedTasks: new Set(['common.notice', 'purchase.payment']),
  breachContext: ['former'], checkedBreachTasks: new Set([`breach.record.${serviceId}`])
});

test('reselecting the same service restores both themes and chosen usage', () => {
  const state = progressFor('note');
  const saved = rememberSessionProgress(new Map(), state);
  assert.deepEqual(restoreSessionProgress(saved, 'note', 'user'), snapshotSessionProgress(state));
});

test('a service round trip keeps independent PHP and breach checks', () => {
  let notebook = rememberSessionProgress(new Map(), progressFor('note'));
  const line = progressFor('line');
  line.usage = ['browse']; line.checkedTasks = new Set(['common.support']);
  notebook = rememberSessionProgress(notebook, line);
  assert.deepEqual(restoreSessionProgress(notebook, 'note', 'user'), snapshotSessionProgress(progressFor('note')));
  assert.deepEqual(restoreSessionProgress(notebook, 'line', 'user'), snapshotSessionProgress(line));
});

test('the same service has different user and administrator progress', () => {
  let notebook = rememberSessionProgress(new Map(), progressFor('note'));
  const admin = progressFor('note', 'admin');
  admin.usage = []; admin.checkedTasks = new Set(['admin.0']); admin.breachContext = [];
  notebook = rememberSessionProgress(notebook, admin);
  assert.deepEqual([...restoreSessionProgress(notebook, 'note', 'user').checkedTasks], ['common.notice', 'purchase.payment']);
  assert.deepEqual([...restoreSessionProgress(notebook, 'note', 'admin').checkedTasks], ['admin.0']);
});

test('unknown or invalid inputs cannot overwrite a known service snapshot', () => {
  const saved = rememberSessionProgress(new Map(), progressFor('note'));
  for (const kind of ['unknown', 'invalid', 'empty']) {
    const next = rememberSessionProgress(saved, { ...progressFor('note'), kind, checkedTasks: new Set(['wrong']) });
    assert.deepEqual(next, saved);
  }
  const unknown = rememberSessionProgress(saved, { ...progressFor('note'), service: null });
  assert.deepEqual(unknown, saved);
  assert.deepEqual(restoreSessionProgress(unknown, null, 'user'), snapshotSessionProgress());
});

test('snapshots and restored selections do not share mutable arrays or Sets', () => {
  const original = progressFor('note');
  const notebook = rememberSessionProgress(new Map(), original);
  original.usage.push('post'); original.checkedTasks.clear(); original.breachContext.push('payment'); original.checkedBreachTasks.clear();
  const restored = restoreSessionProgress(notebook, 'note', 'user');
  assert.deepEqual(restored, snapshotSessionProgress(progressFor('note')));
  restored.usage.length = 0; restored.checkedTasks.clear(); restored.breachContext.length = 0; restored.checkedBreachTasks.clear();
  assert.deepEqual(restoreSessionProgress(notebook, 'note', 'user'), snapshotSessionProgress(progressFor('note')));
});

test('reset removes checks for the selected scope while preserving choices and other scopes', () => {
  let notebook = rememberSessionProgress(new Map(), progressFor('note'));
  notebook = rememberSessionProgress(notebook, progressFor('line'));
  notebook = rememberSessionProgress(notebook, progressFor('note', 'admin'));
  const reset = resetSessionChecks(restoreSessionProgress(notebook, 'note', 'user'));
  assert.deepEqual(reset.usage, ['browse', 'purchase']);
  assert.deepEqual(reset.breachContext, ['former']);
  assert.equal(reset.checkedTasks.size, 0); assert.equal(reset.checkedBreachTasks.size, 0);
  notebook = rememberSessionProgress(notebook, { ...progressFor('note'), ...reset });
  assert.equal(restoreSessionProgress(notebook, 'note', 'user').checkedTasks.size, 0);
  assert.deepEqual(restoreSessionProgress(notebook, 'line', 'user'), snapshotSessionProgress(progressFor('line')));
  assert.deepEqual(restoreSessionProgress(notebook, 'note', 'admin'), snapshotSessionProgress(progressFor('note', 'admin')));
});

test('a new page session starts with no choices or completed checks', () => {
  assert.deepEqual(restoreSessionProgress(new Map(), 'note', 'user'), { usage: [], checkedTasks: new Set(), breachContext: [], checkedBreachTasks: new Set() });
});

test('only progress fields enter the session snapshot', () => {
  const state = { ...progressFor('note'), hostname: 'private.example', query: 'private query', topic: 'php', inputUrl: 'https://example.org/private?token=secret' };
  const snapshot = snapshotSessionProgress(state);
  assert.deepEqual(Object.keys(snapshot).sort(), ['breachContext', 'checkedBreachTasks', 'checkedTasks', 'usage']);
  assert.equal(sessionScopeKey(null, 'user'), null);
  assert.equal(sessionScopeKey('note', 'unknown'), null);
});
