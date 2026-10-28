import test from 'node:test';
import assert from 'node:assert/strict';
import { filterServices, relatedTopicMatches } from '../src/discovery.mjs';
import { directoryServices, servicesForTopic } from '../src/service-directory.mjs';

const targetId = 'onamae-desktop-cloud';

test('the announced cloud service is discoverable by formal company and service names', () => {
  const entries = servicesForTopic('breach');
  for (const query of [
    'GMO', 'GMOインターネット', 'GMOインターネット株式会社',
    'GMOインターネットグループ', 'GMOインターネットグループ株式会社', 'ＧＭＯインターネットグループ',
    'お名前.com', 'お名前ドットコム', 'デスクトップクラウド',
    'FX', 'MT4', 'MT5', 'GMO デスクトップ',
  ]) {
    assert.ok(filterServices(entries, { role: 'user', query }).some(service => service.id === targetId), query);
  }
  const target = entries.find(service => service.id === targetId);
  assert.equal(target.operator, 'GMOインターネット株式会社');
  assert.ok(target.companyAliases.includes('GMOインターネットグループ株式会社'));
});

test('company aliases do not turn unrelated service names into a matching cloud incident', () => {
  const target = directoryServices.find(service => service.id === targetId);
  for (const query of ['GMOクリック証券', 'GMOコイン', 'GMOあおぞらネット銀行', 'DMM FX']) {
    assert.deepEqual(filterServices([target], { role: 'user', query }), [], query);
  }
  assert.deepEqual(filterServices([target], { role: 'admin', query: 'GMO' }), []);
  assert.deepEqual(filterServices([target], { role: 'user', category: 'finance', query: 'GMO' }), []);
  assert.deepEqual(filterServices([target], { role: 'user', category: 'business', query: 'GMO' }).map(service => service.id), [targetId]);
});

test('a GMO search in PHP points to the separate breach view without inferring PHP use', () => {
  const query = 'GMOインターネットグループ';
  assert.deepEqual(filterServices(servicesForTopic('php'), { role: 'user', query }), []);
  const target = directoryServices.find(service => service.id === targetId);
  assert.deepEqual(target.topics, ['breach']);
  assert.equal(target.php, undefined);
  for (const role of ['user', 'admin']) {
    const matches = relatedTopicMatches(directoryServices, { topic: 'php', role, query, category: 'hosting' });
    assert.ok(matches.some(match => match.topic === 'breach' && match.role === 'user'
      && match.services.some(service => service.id === targetId)));
  }
  assert.deepEqual(relatedTopicMatches(directoryServices, { topic: 'breach', role: 'user', query }), []);
});
