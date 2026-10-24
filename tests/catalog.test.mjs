import test from 'node:test';
import assert from 'node:assert/strict';
import { checkedAt, sources, services } from '../src/catalog.mjs';
import { resolveInput } from '../src/url.mjs';

const serviceFor = (input) => resolveInput(input, services).service?.id ?? null;

test('expanded catalog separates user services from administration environments', () => {
  assert.equal(services.length,22);
  assert.equal(new Set(services.map(({ id }) => id)).size,services.length);
  assert.equal(services.filter(s=>s.roles.includes('user')).length,14);
  assert.equal(services.filter(s=>s.roles.includes('admin')).length,13);
  for (const service of services) {
    assert.ok(service.roles.length);
    for (const role of service.roles) {
      assert.ok(['user','admin'].includes(role));
      assert.ok(service.groupByRole[role]);
    }
  }
  for (const id of ['sakura-rental','sakura-vps','wordpress-selfhost','ec-cube']) assert.deepEqual(services.find(s=>s.id===id).roles,['admin']);
  for (const id of ['amazon-jp','youtube','pixiv']) assert.deepEqual(services.find(s=>s.id===id).roles,['user']);
});

test('every entry separates PHP facts, incident facts, official actions and role-based guidance', () => {
  for (const service of services) {
    for (const key of ['name', 'short', 'caution']) assert.ok(service[key]?.trim(), `${service.id}.${key}`);
    for (const key of ['php', 'incident', 'officialAction']) {
      assert.ok(service[key].text?.trim(), `${service.id}.${key}.text`);
      if (!service[key].sourceIds.length) {
        assert.match(service[key].text,/未確認|まだ掲載/);
        assert.ok(service.supportSourceIds?.length, `${service.id} needs an official contact route`);
      }
      for (const id of service[key].sourceIds) assert.ok(!['support','domain'].includes(sources[id]?.kind), `${id} cannot establish PHP or incident claims`);
      for (const id of service[key].sourceIds) assert.ok(Object.hasOwn(sources, id), `missing source ${id}`);
    }
    assert.ok(service.php.label?.trim());
    assert.ok(service.incident.label?.trim());
    for (const role of ['user', 'admin']) {
      assert.ok(service.actions[role].length > 0);
      assert.ok(service.actions[role].every((action) => typeof action === 'string' && action.trim()));
    }
    assert.notDeepEqual(service.actions.user, service.actions.admin);
  }
});

test('all evidence links are HTTPS and have valid, explicit confirmation dates', () => {
  const isDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(value).toISOString().slice(0, 10) === value;
  assert.ok(isDate(checkedAt));
  const allowedHosts = new Set(['note.jp','wordpress.com','inside.pixiv.blog','booth.pm','booth.pixiv.help','wordpress.org','www.drupal.org','www.amazon.co.jp','ichiba.faq.rakuten.net','support.yahoo-net.jp','shopping.yahoo.co.jp','help.jp.mercari.com','status.jp.mercari.com','help.thebase.in','support.google.com','www.youtube.com','help.instagram.com','www.instagram.com','help.x.com','help.line.me','www.line.me','fanbox.pixiv.help','www.sakura.ad.jp','help.sakura.ad.jp','www.xserver.ne.jp','lolipop.jp','www.conoha.jp','support.conoha.jp','www.ec-cube.net']);
  for (const [id, source] of Object.entries(sources)) {
    const url = new URL(source.url);
    assert.equal(url.protocol, 'https:', id);
    assert.ok(allowedHosts.has(url.hostname), `${id} source owner`);
    assert.equal(url.username + url.password, '', id);
    assert.ok(source.title?.trim(), id);
    assert.ok(isDate(source.checkedAt), id);
    // Sources are reviewed independently; their dates need not match the baseline.
    if (source.publishedAt !== null) {
      assert.ok(isDate(source.publishedAt), id);
      assert.ok(source.publishedAt <= source.checkedAt, id);
    }
  }
});

test('registered domain rules are explicit, valid and unambiguous', () => {
  const used = new Set();
  for (const service of services) {
    assert.ok(Array.isArray(service.domains));
    for (const domain of service.domains) {
      assert.equal(typeof domain.includeSubdomains, 'boolean');
      assert.equal(domain.host, domain.host.toLowerCase());
      assert.equal(new URL(`https://${domain.host}`).hostname, domain.host);
      assert.ok(!used.has(domain.host), `duplicate ${domain.host}`);
      used.add(domain.host);
    }
  }
});

test('note recognizes only its three explicitly registered service hostnames', () => {
  for (const host of ['note.com', 'money.note.com', 'tales.note.com']) assert.equal(serviceFor(host), 'note', host);
  for (const host of ['www.note.com', 'help.note.com', 'a.money.note.com', 'note.jp']) assert.equal(serviceFor(host), null, host);
});

test('WordPress.com and BOOTH recognize registered subdomains only within their domain boundary', () => {
  for (const host of ['wordpress.com', 'example.wordpress.com']) assert.equal(serviceFor(host), 'wordpress-com', host);
  for (const host of ['booth.pm', 'example.booth.pm']) assert.equal(serviceFor(host), 'booth', host);
  for (const host of ['wordpress.com.example.org', 'notwordpress.com', 'booth.pm.example.org', 'notbooth.pm']) assert.equal(serviceFor(host), null, host);
});

test('pixiv recognizes only its two explicit hostnames and does not absorb related services', () => {
  for (const host of ['pixiv.net', 'www.pixiv.net']) assert.equal(serviceFor(host), 'pixiv', host);
  for (const host of ['accounts.pixiv.net', 'inside.pixiv.blog', 'booth.pixiv.help']) assert.equal(serviceFor(host), null, host);
});

test('self-managed CMS entries require a manual selection and are never inferred from paths', () => {
  for (const id of ['wordpress-selfhost', 'drupal']) assert.deepEqual(services.find((service) => service.id === id).domains, []);
  for (const address of ['https://example.org/wp-admin/', 'https://example.org/?cms=drupal', 'wordpress.org', 'drupal.org']) assert.equal(serviceFor(address), null, address);
});

test('lookalikes and URL content never become registered service matches', () => {
  for (const address of ['https://notnote.com/', 'https://note.com.example.org/', 'https://nоte.com/', 'https://example.org/?next=https://note.com', 'https://example.org/#booth.pm']) assert.equal(serviceFor(address), null, address);
});

test('missing incident evidence remains explicitly unknown for BOOTH and individual CMS sites', () => {
  assert.equal(services.find(({ id }) => id === 'booth').php.label, '未確認');
  for (const id of ['booth', 'wordpress-selfhost', 'drupal']) assert.equal(services.find((service) => service.id === id).incident.label, '未確認');
});

test('URL input distinguishes service names, registered Amazon and unregistered domains', () => {
  const name = resolveInput('amazon', services);
  assert.equal(name.ok, false);
  assert.match(name.error, /サービス名だけでは検索できません/);
  for (const input of ['amazon.co.jp', 'https://amazon.co.jp/']) {
    const domain = resolveInput(input, services);
    assert.equal(domain.ok, true);
    assert.equal(domain.service.id, 'amazon-jp');
    assert.equal(domain.service.php.label, '未確認');
  }
});

test('new domains do not match company-wide or lookalike hosts', () => {
  assert.equal(serviceFor('amazon.co.jp'),'amazon-jp');
  assert.equal(serviceFor('fanbox.cc'),'fanbox');
  assert.equal(serviceFor('shopping.yahoo.co.jp'),'yahoo-shopping');
  for (const input of ['aws.amazon.com','amazon.co.jp.example.org','yahoo.co.jp','support.google.com','unlisted.example.org']) assert.equal(serviceFor(input),null);
});
test('hosting and CMS choice never infers a provider from a customer domain', () => {
  for(const service of services.filter(s=>['hosting','server','cms'].includes(s.groupByRole.admin))) assert.deepEqual(service.domains,[]);
});
test('support and domain routes remain separate from technical evidence', () => {
  for(const service of services) {
    for(const id of service.supportSourceIds ?? []) assert.equal(sources[id]?.kind,'support');
    for(const id of service.domainSourceIds ?? []) assert.ok(['domain','support'].includes(sources[id]?.kind));
  }
});
