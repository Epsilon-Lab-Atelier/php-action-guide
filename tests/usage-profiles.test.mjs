import test from 'node:test';
import assert from 'node:assert/strict';
import { services } from '../src/catalog.mjs';
import { usageOptions } from '../src/usage.mjs';
import { usageProfileServiceIds, usageOptionsForService, normalizeServiceUsage, guidanceForServiceUsage, usageScopeForService } from '../src/usage-profiles.mjs';

const userServices = services.filter(service => service.roles.includes('user'));
const findService = id => services.find(service => service.id === id);
const optionIds = service => usageOptionsForService(service).map(option => option.id);

test('all current user services have an explicit usage profile', () => {
  assert.equal(userServices.length, 14);
  assert.deepEqual([...usageProfileServiceIds].sort(), userServices.map(service => service.id).sort());
  for (const service of userServices) {
    const options = usageOptionsForService(service);
    assert.ok(options.length >= 3 && options.length <= 5, service.id);
    assert.equal(new Set(options.map(option => option.id)).size, options.length);
    for (const option of options) {
      for (const key of ['id', 'label', 'short', 'icon']) assert.ok(option[key].trim(), `${service.id}:${key}`);
    }
    assert.ok(usageScopeForService(service));
  }
});

test('unknown or admin-only targets retain generic guidance rather than assuming features', () => {
  for (const service of [null, undefined, {}, { id: 'unknown' }, { id: '__proto__' }, findService('drupal'), { id: 'note', roles: ['admin'] }]) {
    assert.deepEqual(usageOptionsForService(service), usageOptions);
    assert.deepEqual(normalizeServiceUsage(['sell', 'post'], service), ['sell', 'post']);
  }
});

test('YouTube omits shop selling, but keeps viewing, payments and creator uploads', () => {
  const service = findService('youtube');
  assert.deepEqual(optionIds(service), ['account', 'browse', 'purchase', 'post']);
  assert.match(usageOptionsForService(service).find(option => option.id === 'post').label, /動画/);
  assert.deepEqual(normalizeServiceUsage(['sell', 'post'], service), ['post']);
  assert.deepEqual(guidanceForServiceUsage(['sell'], service).groups.map(group => group.id), ['common', 'unselected']);
});

test('switching from a selling service removes an unavailable selling selection', () => {
  const boothSelection = normalizeServiceUsage(['browse', 'sell', 'post'], findService('booth'));
  assert.deepEqual(boothSelection, ['browse', 'sell']);
  assert.deepEqual(normalizeServiceUsage(boothSelection, findService('amazon-jp')), ['browse']);
});

test('shopping reviews and private messages do not prescribe unrelated public sharing settings', () => {
  const review = guidanceForServiceUsage(['post'], findService('amazon-jp')).groups[1];
  assert.match(review.title, /レビュー/);
  assert.doesNotMatch(review.tasks.map(task => task.text).join(''), /限定公開|非公開/);
  const message = guidanceForServiceUsage(['post'], findService('line')).groups[1];
  assert.match(message.title, /メッセージ/);
  assert.doesNotMatch(message.tasks.map(task => task.text).join(''), /公開範囲|限定公開|非公開/);
});

test('creator support uses creator wording rather than goods or order management', () => {
  for (const id of ['note', 'fanbox']) {
    const result = guidanceForServiceUsage(['sell'], findService(id));
    assert.match(result.groups[1].tasks[0].text, /クリエイター/);
    assert.doesNotMatch(result.groups[1].tasks.map(task => task.text).join(''), /出店者|注文/);
  }
});

test('subscription payments do not assume a product delivery or order history', () => {
  const result = guidanceForServiceUsage(['purchase'], findService('youtube'));
  assert.match(result.groups[1].title, /契約/);
  assert.doesNotMatch(result.groups[1].tasks.map(task => task.text).join(''), /注文履歴|配送/);
});

test('all service selection combinations keep stable order without hidden or duplicate tasks', () => {
  for (const service of userServices) {
    const ids = optionIds(service);
    for (let mask = 0; mask < 2 ** ids.length; mask++) {
      const selected = ids.filter((_, index) => mask & (1 << index));
      const result = guidanceForServiceUsage([...selected].reverse(), service);
      assert.deepEqual(result.groups.map(group => group.id), ['common', ...(selected.length ? selected : ['unselected'])]);
      const tasks = result.groups.flatMap(group => group.tasks.map(task => task.id));
      assert.equal(new Set(tasks).size, tasks.length);
    }
  }
});

test('invalid selections and mutable results never alter another service or future call', () => {
  const service = findService('line');
  assert.deepEqual(normalizeServiceUsage(null, service), []);
  assert.deepEqual(normalizeServiceUsage('post', service), []);
  assert.deepEqual(normalizeServiceUsage(new Set(['post', 'account', 'bad', 'post']), service), ['account', 'post']);
  const before = guidanceForServiceUsage(['post'], service);
  const mutated = guidanceForServiceUsage(['post'], service);
  mutated.groups[1].tasks[0].text = 'changed';
  const options = usageOptionsForService(service);
  options[0].label = 'changed'; options.pop();
  assert.deepEqual(guidanceForServiceUsage(['post'], service), before);
  assert.equal(usageOptionsForService(service).length, 4);
  assert.notEqual(usageOptionsForService(service)[0].label, 'changed');
  assert.match(guidanceForServiceUsage(['post'], findService('note')).groups[1].tasks[0].text, /公開範囲/);
});
