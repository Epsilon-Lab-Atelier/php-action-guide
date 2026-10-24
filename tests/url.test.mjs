import test from 'node:test';
import assert from 'node:assert/strict';
import { parseInput, matchHostname, resolveInput } from '../src/url.mjs';

const catalog = [
  { id: 'note', domains: [{ host: 'note.com', includeSubdomains: true }, { host: 'note.jp', includeSubdomains: false }] },
  { id: 'specific', domains: [{ host: 'help.note.com', includeSubdomains: true }] },
  { id: 'wordpress-self', domains: [] },
];

for (const [input, hostname, service] of [
  ['https://note.com/', 'note.com', 'note'],
  ['  NOTE.COM  ', 'note.com', 'note'],
  ['http://www.NOTE.com/path?secret=123#fragment', 'www.note.com', 'note'],
  ['note.com/path?secret=123', 'note.com', 'note'],
  ['note.com:8443/path', 'note.com', 'note'],
  ['https://note.com:443', 'note.com', 'note'],
  ['https://note.com./', 'note.com', 'note'],
  ['https://help.note.com', 'help.note.com', 'specific'],
  ['https://a.help.note.com', 'a.help.note.com', 'specific'],
  ['note.jp', 'note.jp', 'note'],
  ['www.note.jp', 'www.note.jp', undefined],
  ['notnote.com', 'notnote.com', undefined],
  ['note.com.evil.example', 'note.com.evil.example', undefined],
  ['https://unlisted.example/note.com?next=https://note.com#note.com', 'unlisted.example', undefined],
  ['https://nоte.com', 'xn--nte-sed.com', undefined],
  ['https://例え.テスト/記事', 'xn--r8jz45g.xn--zckzah', undefined],
  ['https://note.com/#@evil.example', 'note.com', 'note'],
  ['https://note.com/path%20with%20space', 'note.com', 'note'],
]) {
  test(`normalizes and matches ${input}`, () => {
    const actual = resolveInput(input, catalog);
    assert.equal(actual.ok, true);
    assert.equal(actual.hostname, hostname);
    assert.equal(actual.service?.id, service);
    assert.deepEqual(Object.keys(actual).sort(), ['hostname', 'ok', 'service']);
    assert.equal(JSON.stringify(actual).includes('secret=123'), false);
  });
}

for (const input of [
  '', ' ', null, 123, '\nnote.com', 'note.com\n', 'no te.com',
  'https://note.com\\@evil.example', 'https://note.com\u0000.evil.example',
  '//note.com', 'ftp://note.com', 'javascript:alert(1)', 'mailto:user@note.com',
  'https:note.com', 'http:/note.com', 'https:///note.com',
  'https://user:pass@note.com', 'https://note.com@evil.example', 'https://@note.com',
  'https://%6eote.com', 'https://note%2ecom',
  'note.com:', 'note.com:abc', 'note.com:65536', 'https://note.com:443:443',
  'localhost', '127.0.0.1', 'https://[::1]/', 'https://2130706433/', 'https://0x7f.1',
  'service.local', 'service.internal', 'service.localhost', 'service.onion',
  '.note.com', 'note..com', 'note.com..', '-note.com', 'note-.com', 'note_com.example',
  `${'a'.repeat(64)}.com`, 'https://ｎｏｔｅ.com', 'https://note。com', 'x'.repeat(4097),
]) {
  test(`rejects unsupported or misleading address ${String(input).slice(0, 85)}`, () => {
    const actual = resolveInput(input, catalog);
    assert.equal(actual.ok, false);
    assert.equal(typeof actual.error, 'string');
    assert.equal(actual.service, null);
    assert.equal('hostname' in actual, false);
  });
}

test('explicit includeSubdomains is required', () => {
  assert.equal(matchHostname('a.example.com', [{ id: 'a', domains: [{ host: 'example.com' }] }]), null);
});

test('more specific domain wins regardless of catalog order', () => {
  assert.equal(matchHostname('help.note.com', [...catalog].reverse()).id, 'specific');
});

test('parser output never retains path, credentials or query', () => {
  assert.deepEqual(parseInput('https://note.com/private/path?token=secret#fragment'), { ok: true, hostname: 'note.com' });
});
