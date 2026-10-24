import test from 'node:test';
import assert from 'node:assert/strict';
import { parseGuideHash, buildGuideLink } from '../src/navigation.mjs';
import { services } from '../src/catalog.mjs';

const baseUrl = 'https://epsilon-lab-atelier.github.io/php-action-guide/';

test('each listed service and supported role round-trips for every topic', () => {
  for (const service of services) {
    for (const role of service.roles) {
      for (const topic of ['all', 'php', 'breach']) {
        const selection = { serviceId: service.id, role, topic };
        const url = buildGuideLink(baseUrl, selection, services);
        assert.ok(url, JSON.stringify(selection));
        assert.deepEqual(parseGuideHash(new URL(url).hash, services), selection);
      }
    }
  }
});

test('legacy links change only the theme and ordinary page anchors are ignored', () => {
  assert.deepEqual(parseGuideHash('#php', services), { topic: 'php' });
  assert.deepEqual(parseGuideHash('#breaches', services), { topic: 'breach' });
  for (const hash of ['', '#', '#main', '#finder', '#issue', '#updates', '#unknown']) assert.equal(parseGuideHash(hash, services), null, hash);
});

test('strict service links accept reordered and valid percent-encoded parameters', () => {
  assert.deepEqual(parseGuideHash('#topic=breach&role=admin&service=note', services), { serviceId: 'note', role: 'admin', topic: 'breach' });
  assert.deepEqual(parseGuideHash('#service=%6eote&%72ole=user&topic=all', services), { serviceId: 'note', role: 'user', topic: 'all' });
});

test('unknown services and unsupported roles do not select a misleading guide', () => {
  for (const hash of [
    '#service=not-listed&role=user&topic=all',
    '#service=wordpress-selfhost&role=user&topic=php',
    '#service=amazon-jp&role=admin&topic=all',
    '#service=note&role=owner&topic=php',
    '#service=note&role=USER&topic=php',
    '#service=note&role=user&topic=breaches',
    '#service=NOTE&role=user&topic=all',
    '#service=note.com&role=user&topic=all',
  ]) assert.equal(parseGuideHash(hash, services), null, hash);
});

test('missing, duplicate and extra parameters are rejected rather than partially applied', () => {
  for (const hash of [
    '#service=note&role=user',
    '#service=note&topic=php',
    '#role=user&topic=php',
    '#service=&role=user&topic=php',
    '#service=note&role=&topic=php',
    '#service=note&role=user&topic=',
    '#service=note&role=user&role=admin',
    '#service=note&role=user&%72ole=admin',
    '#service=note&role=user&topic=php&topic=breach',
    '#service=note&role=user&topic=php&usage=purchase',
    '#service=note&role=user&topic=php&',
    '#service=note&&role=user&topic=php',
    '#service=note&role=user&topic',
  ]) assert.equal(parseGuideHash(hash, services), null, hash);
});

test('malformed, oversized and encoded unsafe hashes fail without throwing', () => {
  for (const hash of [
    null, undefined, 10, {}, [],
    'service=note&role=user&topic=php',
    '#service=note&role=user&topic=php\n',
    '#service=note&role=user&topic=%',
    '#service=note&role=user&topic=%E0%A4%A',
    '#service=note%00&role=user&topic=php',
    '#service=note%0A&role=user&topic=php',
    '#service=note&role=user&topic=%3Cscript%3E',
    '#service=note&role=user&topic=+php',
    '#service=note&role=user&topic=php#finder',
    `#service=${'n'.repeat(600)}&role=user&topic=php`,
  ]) assert.equal(parseGuideHash(hash, services), null);
});

test('copying a guide never includes credentials, search data, old hash or personal state', () => {
  const selection = {
    serviceId: 'note', role: 'user', topic: 'breach',
    hostname: 'private.example.com', inputUrl: 'https://private.example.com/private?token=abc',
    usage: ['purchase'], checkedTasks: ['payment'], breachContext: ['address'],
  };
  const link = buildGuideLink('https://login:password@epsilon-lab-atelier.github.io/php-action-guide/?token=secret&input=private#private-note', selection, services);
  assert.equal(link, `${baseUrl}#service=note&role=user&topic=breach`);
  const parsed = new URL(link);
  assert.equal(parsed.search, '');
  assert.equal(parsed.username, '');
  assert.equal(parsed.password, '');
  assert.deepEqual([...new URLSearchParams(parsed.hash.slice(1)).keys()], ['service', 'role', 'topic']);
});

test('sharing preserves the app pathname, including project and standalone HTML paths', () => {
  const selection = { serviceId: 'wordpress-selfhost', role: 'admin', topic: 'php' };
  assert.equal(buildGuideLink('https://example.com/tools/notebook/index.html?q=secret', selection, services), 'https://example.com/tools/notebook/index.html#service=wordpress-selfhost&role=admin&topic=php');
  assert.equal(buildGuideLink('http://example.com/notebook/', selection, services), 'http://example.com/notebook/#service=wordpress-selfhost&role=admin&topic=php');
});

test('non-web, local and malformed base URLs cannot become reader links', () => {
  const selection = { serviceId: 'note', role: 'user', topic: 'all' };
  for (const base of [
    null, undefined, 42, {}, '', '/php-action-guide/', '//example.com/',
    'file:///Users/reader/notebook.html', 'javascript:alert(1)', 'data:text/html,example',
    'ftp://example.com/', 'https:example.com/', 'https:///example.com/',
    'https://localhost/', 'http://localhost:4173/', 'http://terminal.local:4173/',
    'https://site.localhost/', 'https://internal/', 'https://host.internal/',
    'https://127.0.0.1/', 'https://10.0.0.1/', 'https://[::1]/', 'https://[2001:db8::1]/',
    'https://exa_mple.com/', 'https://example.com:invalid/', 'https://example.com\n/',
    'https://example.com\\private', `https://example.com/${'p'.repeat(4096)}`,
  ]) assert.equal(buildGuideLink(base, selection, services), null, String(base));
});

test('invalid selections cannot be serialized even when their other fields look valid', () => {
  for (const selection of [
    null, {}, { serviceId: 'note', role: 'user' },
    { serviceId: 'missing', role: 'user', topic: 'all' },
    { serviceId: 'wordpress-selfhost', role: 'user', topic: 'all' },
    { serviceId: 'note', role: 'user', topic: 'secret' },
    { serviceId: 'note&input=secret', role: 'user', topic: 'all' },
  ]) assert.equal(buildGuideLink(baseUrl, selection, services), null);
  assert.equal(buildGuideLink(baseUrl, { serviceId: 'note', role: 'user', topic: 'all' }, null), null);
});
