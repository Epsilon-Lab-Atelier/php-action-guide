import test from 'node:test';
import assert from 'node:assert/strict';
import { services as phpServices } from '../src/catalog.mjs';
import { breachServices } from '../src/catalog-breach.mjs';
import { directoryServices, servicesForTopic, supportsTopic, mergeServiceDirectories } from '../src/service-directory.mjs';
import { breachSources, breachReviews, breachIncidents } from '../src/incidents.mjs';
import { resolveInput } from '../src/url.mjs';
import { createCatalogSnapshot, diffCatalogSnapshots } from '../scripts/catalog-snapshot.mjs';
import { categoryAssignmentIssues } from '../src/categories.mjs';

test('topic directories preserve PHP coverage and do not infer PHP from a breach', () => {
  assert.equal(new Set(directoryServices.map(service => service.id)).size, directoryServices.length);
  assert.deepEqual(servicesForTopic('php').map(service => service.id), phpServices.map(service => service.id));
  assert.equal(servicesForTopic('all').length, directoryServices.length);
  assert.equal(servicesForTopic('breach').length, directoryServices.length);
  for (const service of breachServices) {
    const entry = directoryServices.find(item => item.id === service.id);
    assert.ok(supportsTopic(entry, 'breach'), service.id);
    assert.ok(!supportsTopic(entry, 'php'), service.id);
    for (const field of ['php', 'incident', 'officialAction', 'actions']) assert.ok(!Object.hasOwn(entry, field), `${service.id}.${field}`);
  }
  assert.deepEqual(servicesForTopic('unrecognized'), []);
  assert.equal(supportsTopic(null, 'breach'), false);
});

test('breach-only entries have distinct documented domains and published incident evidence', () => {
  const knownHosts = new Set();
  for (const service of directoryServices) {
    for (const domain of service.domains) {
      assert.equal(typeof domain.includeSubdomains, 'boolean', service.id);
      assert.equal(new URL(`https://${domain.host}`).hostname, domain.host, service.id);
      assert.ok(!knownHosts.has(domain.host), `Duplicate domain: ${domain.host}`);
      knownHosts.add(domain.host);
    }
  }
  for (const service of breachServices) {
    assert.ok(service.name && service.short && service.keywords.length, service.id);
    assert.deepEqual(service.roles, ['user']);
    assert.deepEqual(categoryAssignmentIssues([service]), [], service.id);
    assert.ok(service.domains.length > 0 && service.domainSourceIds.length > 0, service.id);
    const sourceIds = breachIncidents.filter(incident => incident.serviceIds.includes(service.id)).flatMap(incident => incident.sourceIds);
    for (const id of service.domainSourceIds) {
      assert.ok(breachSources[id] && (sourceIds.includes(id) || breachSources[id].kind === 'domain'), `${service.id}: ${id}`);
    }
    assert.equal(breachReviews[service.id]?.status, 'body-reviewed', service.id);
    for (const domain of service.domains) {
      assert.equal(resolveInput(domain.host, directoryServices).service?.id, service.id);
      assert.equal(resolveInput(`${domain.host}.example.org`, directoryServices).service, null);
      if (!domain.includeSubdomains) assert.equal(resolveInput(`unlisted.${domain.host}`, directoryServices).service, null);
    }
  }
});

test('snapshots retain independent topic membership for breach-only additions', () => {
  const snapshot = createCatalogSnapshot();
  const before = structuredClone(snapshot);
  for (const service of breachServices) {
    assert.deepEqual(snapshot.services[service.id].topics, ['breach']);
    delete before.services[service.id];
  }
  for (const service of phpServices) assert.deepEqual(snapshot.services[service.id].topics, ['php', 'breach']);
  const changes = diffCatalogSnapshots(before, snapshot).changes;
  assert.deepEqual(changes.map(change => change.serviceId).sort(), breachServices.map(service => service.id).sort());
  assert.ok(changes.every(change => change.kind === 'added' && !change.fields.includes('php')));
});

test('a later PHP catalog entry reuses the identity without duplicating the breach service', () => {
  const php = { id: 'shared-service', name: 'Shared', php: { label: 'Verified PHP evidence' } };
  const breach = { id: 'shared-service', name: 'Existing breach directory name' };
  const merged = mergeServiceDirectories([php], [breach, { id: 'breach-only' }]);
  assert.equal(merged.length, 2);
  assert.equal(merged[0].id, 'shared-service');
  assert.deepEqual(merged[0].php, php.php);
  assert.deepEqual(merged[0].topics, ['php', 'breach']);
  assert.deepEqual(merged[1].topics, ['breach']);
  assert.ok(!Object.hasOwn(breach, 'php'));
});
