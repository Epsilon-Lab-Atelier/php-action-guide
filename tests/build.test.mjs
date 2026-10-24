import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Script } from 'node:vm';

const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
const styles = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)];
const csp = html.match(/<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"/i)?.[1];
const hash = (text) => `sha256-${createHash('sha256').update(text).digest('base64')}`;

test('deliverable is one complete Japanese HTML document with inline code and styling', async () => {
  assert.match(html, /^<!doctype html>/i);
  assert.match(html, /<html lang="ja">/);
  assert.match(html, /<meta name="viewport" content="width=device-width,initial-scale=1">/);
  assert.match(html, /<\/body>\s*<\/html>\s*$/);
  assert.equal(scripts.length, 1);
  assert.equal(styles.length, 1);
  assert.ok(scripts[0][2].length > 0);
  assert.ok(styles[0][1].length > 0);
  assert.equal((await stat(new URL('../dist/.nojekyll', import.meta.url))).isFile(), true);
});

test('CSP hashes exactly authorize the delivered script and stylesheet', () => {
  assert.ok(csp);
  const directives = new Map(csp.split(';').map((part) => part.trim().split(/\s+/)).filter(([name]) => name).map(([name, ...values]) => [name, values]));
  assert.deepEqual(directives.get('script-src'), [`'${hash(scripts[0][2])}'`]);
  assert.deepEqual(directives.get('style-src'), [`'${hash(styles[0][1])}'`]);
  for (const key of ['default-src', 'connect-src', 'base-uri', 'form-action', 'object-src']) assert.deepEqual(directives.get(key), ["'none'"], key);
  assert.doesNotMatch(csp, /unsafe-inline|unsafe-eval/);
});

test('standalone file has no external resource dependencies or module imports', () => {
  const resourceTags = [...html.matchAll(/<(?:script|img|iframe|object|embed|audio|video|source|link)\b[^>]*>/gi)].map(([tag]) => tag);
  for (const tag of resourceTags) {
    const source = tag.match(/\b(?:src|href|data)=["']([^"']+)["']/i)?.[1];
    assert.ok(!source || source.startsWith('data:'), tag);
  }
  assert.doesNotMatch(styles[0][1], /@import\b|url\(\s*["']?(?!data:)/i);
  assert.doesNotMatch(scripts[0][2], /^\s*(?:import|export)\b|\bimport\s*\(/m);
  assert.doesNotMatch(html, /<base\b/i);
});

test('bundled JavaScript parses as a standalone script without a module loader', () => {
  assert.doesNotThrow(() => new Script(scripts[0][2], { filename: 'php-action-guide.inline.js' }));
});

test('runtime contains no network, persistent-storage, unsafe-HTML or dynamic-code APIs', () => {
  const script = scripts[0][2];
  assert.doesNotMatch(script, /\b(?:fetch|eval)\s*\(|\bnew\s+(?:Function|XMLHttpRequest|WebSocket|EventSource)\b|\.sendBeacon\s*\(/);
  assert.doesNotMatch(script, /\b(?:localStorage|sessionStorage|indexedDB|serviceWorker)\b|document\s*\.\s*cookie|\bcaches\s*\./);
  assert.doesNotMatch(script, /\.\s*(?:innerHTML|outerHTML)\s*=|\.\s*(?:insertAdjacentHTML|write|writeln)\s*\(/);
});

test('bundle has no unresolved template placeholders or inline event attributes', () => {
  assert.doesNotMatch(html, /__[A-Z][A-Z0-9_]*__/);
  assert.doesNotMatch(html, /<[a-z][^>]*\son[a-z]+\s*=/i);
});

test('static controls retain unique accessible IDs and non-JavaScript fallback', () => {
  const ids = [...html.matchAll(/<[^>]+\bid="([^"]+)"/g)].map(([, id]) => id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ['url-form', 'url-input', 'url-error', 'service-list', 'result', 'result-title', 'announcement']) assert.ok(ids.includes(id), id);
  assert.match(html, /<label for="url-input">/);
  assert.match(html, /id="url-error"[^>]*role="alert"/);
  assert.match(html, /<noscript>[\s\S]*https:\/\/www\.php\.net\/archive\/2026\.php[\s\S]*<\/noscript>/);
});
