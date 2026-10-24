import test from 'node:test';
import assert from 'node:assert/strict';
import { usageOptions, normalizeUsage, guidanceForUsage } from '../src/usage.mjs';

const taskIds = result => result.groups.flatMap(group => group.tasks.map(task => task.id));
const selectedIds = ['account', 'browse', 'purchase', 'sell', 'post'];

test('unknown or missing usage does not assume an account, purchase or post', () => {
  for (const value of [undefined, null, [], ['unknown'], 'account', {}, 1]) {
    assert.deepEqual(normalizeUsage(value), []);
    assert.deepEqual(guidanceForUsage(value).groups.map(group => group.id), ['common', 'unselected']);
    assert.deepEqual(taskIds(guidanceForUsage(value)), ['common.official-notice', 'unselected.choose-usage']);
  }
});

test('normalization removes duplicates and unknown values without mutating input', () => {
  const input = Object.freeze(['post', 'browse', 'account', 'post', 'unknown', null, 'purchase']);
  assert.deepEqual(normalizeUsage(input), selectedIds.filter(id => id !== 'sell'));
  assert.deepEqual(input, ['post', 'browse', 'account', 'post', 'unknown', null, 'purchase']);
});

test('Set state and array state produce the same stable selection', () => {
  assert.deepEqual(normalizeUsage(new Set(['post', 'account'])), ['account', 'post']);
  assert.deepEqual(guidanceForUsage(new Set(['post', 'account'])), guidanceForUsage(['account', 'post']));
});

test('registration alone shows account guidance without billing or posting tasks', () => {
  const result = guidanceForUsage(['account']);
  assert.deepEqual(result.groups.map(group => group.id), ['common', 'account']);
  assert.deepEqual(taskIds(result), ['common.official-notice', 'account.profile', 'account.activity']);
});

test('browsing alone does not require an account or a purchase history', () => {
  const result = guidanceForUsage(['browse']);
  assert.deepEqual(result.groups.map(group => group.id), ['common', 'browse']);
  const text = result.groups.flatMap(group => group.tasks.map(task => task.text)).join('\n');
  assert.doesNotMatch(text, /アカウント|ログイン履歴|注文履歴|請求|カード|投稿/);
});

test('purchasing alone permits guest transactions rather than assuming an account', () => {
  const result = guidanceForUsage(['purchase']);
  assert.deepEqual(result.groups.map(group => group.id), ['common', 'purchase']);
  assert.ok(taskIds(result).includes('purchase.history'));
  assert.ok(taskIds(result).includes('purchase.subscription'));
  assert.doesNotMatch(result.groups[1].tasks.map(task => task.text).join('\n'), /ログイン履歴|アカウント画面|投稿/);
});

test('posting alone focuses on content and sharing without imposing payment checks', () => {
  const result = guidanceForUsage(['post']);
  assert.deepEqual(result.groups.map(group => group.id), ['common', 'post']);
  assert.ok(taskIds(result).includes('post.visibility'));
  assert.doesNotMatch(result.groups[1].tasks.map(task => task.text).join('\n'), /請求|カード|注文履歴/);
});

test('all nonempty facet combinations produce the union, never a highest-risk replacement', () => {
  for (let mask = 1; mask < 32; mask++) {
    const selected = selectedIds.filter((_, index) => mask & (1 << index));
    const result = guidanceForUsage([...selected].reverse());
    assert.deepEqual(result.groups.map(group => group.id), ['common', ...selected]);
    const expectedIds = [...new Set(selected.flatMap(id => taskIds(guidanceForUsage([id]))))];
    assert.deepEqual(taskIds(result), expectedIds);
    assert.equal(taskIds(result).filter(id => id === 'common.official-notice').length, 1);
    assert.equal(new Set(taskIds(result)).size, taskIds(result).length);
  }
});

test('duplicate selections do not duplicate headings or checklist items', () => {
  assert.deepEqual(guidanceForUsage(['account', 'account', 'post', 'post']), guidanceForUsage(['account', 'post']));
});

test('editing returned checklist state cannot mutate the next guidance result', () => {
  const original = guidanceForUsage(['account']);
  const changed = guidanceForUsage(['account']);
  changed.groups[0].tasks[0].text = 'changed';
  changed.groups[1].tasks.push({ id: 'extra', text: 'extra' });
  changed.groups[1].title = 'changed';
  assert.deepEqual(guidanceForUsage(['account']), original);
});

test('option labels are unique and map to the five supported facets', () => {
  assert.deepEqual(usageOptions.map(option => option.id), selectedIds);
  assert.equal(new Set(usageOptions.map(option => option.label)).size, 5);
  for (const option of usageOptions) {
    for (const key of ['id', 'label', 'short', 'icon']) assert.ok(option[key].trim());
    assert.equal(guidanceForUsage([option.id]).groups[1].id, option.id);
  }
});

 test('seller guidance distinguishes platform selling from server management', () => {
  const result = guidanceForUsage(['sell']);
  assert.deepEqual(result.groups.map(group => group.id), ['common', 'sell']);
  assert.ok(taskIds(result).includes('sell.management'));
  assert.ok(!taskIds(result).includes('purchase.history'));
});
