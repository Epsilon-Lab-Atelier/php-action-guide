import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSearchText, filterServices, categoriesForRole } from '../src/discovery.mjs';

const catalog = [
  { id: 'amazon', name: 'Amazon.co.jp', short: '商品の購入', roles: ['user'], groupByRole: { user: 'shopping' }, keywords: ['アマゾン'], domains: [{ host: 'www.amazon.co.jp' }] },
  { id: 'wordpress-com', name: 'WordPress.com', short: 'ブログの投稿', roles: ['user', 'admin'], groupByRole: { user: 'publishing', admin: 'publishing' }, keywords: ['ワードプレス'], domains: [{ host: 'wordpress.com' }] },
  { id: 'sakura', name: 'さくらのレンタルサーバ', short: 'PHPの管理', roles: ['admin'], groupByRole: { admin: 'hosting' }, keywords: ['サクラ', 'sakura'], domains: [] },
  { id: 'note', name: 'note', short: '記事の投稿', roles: ['user', 'admin'], groupByRole: { user: 'publishing', admin: 'publishing' }, keywords: ['ノート'], domains: [{ host: 'note.com' }] },
  { id: 'unclassified', name: 'Hidden entry', short: '', domains: [] },
];
const ids = options => filterServices(catalog, options).map(service => service.id);

test('search normalization handles fullwidth Latin, halfwidth kana and whitespace', () => {
  assert.equal(normalizeSearchText('  ＷＯＲＤＰＲＥＳＳ　ｱﾏｿﾞﾝ  '), 'wordpress あまぞん');
});

test('missing query text is safely treated as empty', () => {
  assert.equal(normalizeSearchText(null), '');
  assert.equal(normalizeSearchText(undefined), '');
  assert.deepEqual(ids({ role: 'user', query: null }), ['amazon', 'wordpress-com', 'note']);
});

test('user and administrator lists are distinct and missing roles are excluded', () => {
  assert.deepEqual(ids({ role: 'user' }), ['amazon', 'wordpress-com', 'note']);
  assert.deepEqual(ids({ role: 'admin' }), ['wordpress-com', 'sakura', 'note']);
});

test('a query cannot expose entries assigned only to the other role', () => {
  assert.deepEqual(ids({ role: 'user', query: 'さくら' }), []);
  assert.deepEqual(ids({ role: 'admin', query: 'amazon' }), []);
});

test('an unrecognized or missing role never receives a catalog', () => {
  assert.deepEqual(ids({ role: 'owner' }), []);
  assert.deepEqual(filterServices(catalog), []);
  assert.deepEqual(categoriesForRole(catalog, undefined), []);
});

test('category filtering uses the selected role and cannot bypass role restrictions', () => {
  assert.deepEqual(ids({ role: 'user', category: 'publishing' }), ['wordpress-com', 'note']);
  assert.deepEqual(ids({ role: 'user', category: 'hosting' }), []);
  assert.deepEqual(ids({ role: 'admin', category: 'hosting' }), ['sakura']);
});

test('categories retain first appearance, omit duplicates and exclude invisible entries', () => {
  assert.deepEqual(categoriesForRole(catalog, 'user'), ['shopping', 'publishing']);
  assert.deepEqual(categoriesForRole(catalog, 'admin'), ['publishing', 'hosting']);
});

test('Japanese aliases match hiragana, katakana and halfwidth input', () => {
  for (const query of ['あまぞん', 'アマゾン', 'ｱﾏｿﾞﾝ']) {
    assert.deepEqual(ids({ role: 'user', query }), ['amazon']);
  }
});

test('fullwidth and separated WordPress search terms match the same visible service', () => {
  for (const query of ['ＷｏｒｄＰｒｅｓｓ', 'Word Press', 'わーどぷれす']) {
    assert.deepEqual(ids({ role: 'user', query }), ['wordpress-com']);
  }
});

test('all query terms must match across name, subtitle, aliases or domains', () => {
  assert.deepEqual(ids({ role: 'user', query: 'amazon 購入' }), ['amazon']);
  assert.deepEqual(ids({ role: 'user', query: 'amazon 投稿' }), []);
  assert.deepEqual(ids({ role: 'admin', query: 'sakura PHP' }), ['sakura']);
});

test('domain search uses the catalog text and produces no inferred service entries', () => {
  assert.deepEqual(ids({ role: 'user', query: 'WWW.AMAZON.CO.JP' }), ['amazon']);
  assert.deepEqual(ids({ role: 'user', query: 'unregistered.example' }), []);
});

test('empty and narrowed results preserve catalog order without mutating input', () => {
  const before = JSON.stringify(catalog);
  assert.deepEqual(ids({ role: 'user', query: '投稿' }), ['wordpress-com', 'note']);
  assert.deepEqual(ids({ role: 'user', query: '  ' }), ['amazon', 'wordpress-com', 'note']);
  assert.deepEqual(ids({ role: 'user', query: '検索結果なし' }), []);
  assert.equal(JSON.stringify(catalog), before);
});
