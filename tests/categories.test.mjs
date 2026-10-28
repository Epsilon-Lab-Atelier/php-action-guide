import test from 'node:test';
import assert from 'node:assert/strict';
import { categoryLabels, categoryOrder, serviceGroupsForRole, groupServicesForDisplay, categoryAssignmentIssues } from '../src/categories.mjs';
import { directoryServices, servicesForTopic } from '../src/service-directory.mjs';
import { filterServices, categoriesForRole } from '../src/discovery.mjs';

const categoryFixture = {
  id: 'rail-card', name: 'Rail Card', short: '旅行にも使うカード', roles: ['user'],
  groupByRole: { user: 'finance' }, additionalGroupsByRole: { user: ['transport'] },
};
const categoryPeer = { id: 'rail', name: 'Rail', roles: ['user'], groupByRole: { user: 'transport' } };
const categoryAdmin = { id: 'cms', name: 'CMS', roles: ['admin'], groupByRole: { admin: 'cms' } };
const categoryFixtureIds = groups => groups.flatMap(group => group.services.map(service => service.id));

test('category definitions have labels, distinct order and explicit role boundaries', () => {
  for (const [role, ids] of Object.entries(categoryOrder)) {
    assert.ok(['user', 'admin'].includes(role));
    assert.equal(new Set(ids).size, ids.length);
    for (const id of ids) assert.ok(Object.hasOwn(categoryLabels, id) && categoryLabels[id].trim(), id);
  }
  assert.deepEqual([...new Set(Object.values(categoryOrder).flat())].sort(), Object.keys(categoryLabels).sort());
  assert.ok(categoryOrder.user.includes('education'));
  assert.ok(categoryOrder.user.includes('health'));
  assert.ok(!categoryOrder.admin.includes('education'));
});

test('a secondary category affects discovery without duplicating the all-types list', () => {
  const entries = [categoryFixture, categoryPeer, categoryAdmin];
  assert.deepEqual(serviceGroupsForRole(categoryFixture, 'user'), ['finance', 'transport']);
  assert.deepEqual(categoriesForRole(entries, 'user'), ['finance', 'transport']);
  const filtered = filterServices(entries, { role: 'user', category: 'transport', query: 'Card' });
  assert.deepEqual(filtered.map(service => service.id), ['rail-card']);
  const selected = groupServicesForDisplay(filtered, { role: 'user', category: 'transport' });
  assert.deepEqual(selected.map(group => group.id), ['transport']);
  assert.deepEqual(categoryFixtureIds(selected), ['rail-card']);
  const all = groupServicesForDisplay(entries, { role: 'user' });
  assert.deepEqual(all.find(group => group.id === 'finance').services.map(service => service.id), ['rail-card']);
  assert.deepEqual(all.find(group => group.id === 'transport').services.map(service => service.id), ['rail']);
  assert.equal(categoryFixtureIds(all).length, new Set(categoryFixtureIds(all)).size);
});

test('secondary categories cannot bypass role restrictions or make unknown categories visible', () => {
  assert.deepEqual(serviceGroupsForRole(categoryFixture, 'admin'), []);
  assert.deepEqual(serviceGroupsForRole(categoryFixture, undefined), []);
  for (const role of ['admin', 'unknown', undefined]) {
    assert.deepEqual(filterServices([categoryFixture], { role, category: 'transport' }), []);
    assert.deepEqual(groupServicesForDisplay([categoryFixture], { role, category: 'transport' }), []);
  }
  assert.deepEqual(groupServicesForDisplay([categoryFixture], { role: 'user', category: 'unmapped' }), []);
  assert.deepEqual(serviceGroupsForRole({ ...categoryFixture, groupByRole: { user: 'unmapped' } }, 'user'), []);
  const malformed = { ...categoryFixture, additionalGroupsByRole: { user: ['transport', 'transport', 'finance', 'hosting', 'unmapped'] } };
  assert.deepEqual(serviceGroupsForRole(malformed, 'user'), ['finance', 'transport']);
  assert.ok(categoryAssignmentIssues([malformed]).length);
});

test('published category validation rejects missing, unknown, empty and incompatible assignments', () => {
  const invalid = [
    { ...categoryFixture, groupByRole: undefined },
    { ...categoryFixture, groupByRole: { user: '' } },
    { ...categoryFixture, groupByRole: { user: 'unknown' } },
    { ...categoryFixture, groupByRole: { user: 'hosting' } },
    { ...categoryFixture, groupByRole: { user: 'finance', admin: 'hosting' } },
    { ...categoryFixture, additionalGroupsByRole: {} },
    { ...categoryFixture, additionalGroupsByRole: { user: [] } },
    { ...categoryFixture, additionalGroupsByRole: { user: '' } },
    { ...categoryFixture, additionalGroupsByRole: { user: [''] } },
    { ...categoryFixture, additionalGroupsByRole: { user: ['unknown'] } },
    { ...categoryFixture, additionalGroupsByRole: { user: ['transport', 'transport'] } },
    { ...categoryFixture, additionalGroupsByRole: { user: ['finance'] } },
    { ...categoryFixture, additionalGroupsByRole: { admin: ['hosting'] } },
    { ...categoryFixture, roles: ['user', 'user'] },
    { ...categoryFixture, roles: [] },
    { ...categoryFixture, roles: ['other'] },
  ];
  for (const service of invalid) assert.ok(categoryAssignmentIssues([service]).length, JSON.stringify(service));
  assert.deepEqual(categoryAssignmentIssues([categoryFixture, categoryPeer, categoryAdmin]), []);
});

test('every published service has a recognized classification and appears once in each applicable all-types view', () => {
  assert.deepEqual(categoryAssignmentIssues(directoryServices), []);
  for (const topic of ['breach', 'php']) {
    for (const role of ['user', 'admin']) {
      const entries = servicesForTopic(topic);
      const expected = entries.filter(service => service.roles.includes(role)).map(service => service.id).sort();
      const visible = filterServices(entries, { role });
      const rendered = categoryFixtureIds(groupServicesForDisplay(visible, { role }));
      assert.deepEqual(rendered.slice().sort(), expected, `${topic}/${role}`);
      assert.equal(new Set(rendered).size, rendered.length, `${topic}/${role}`);
      for (const category of categoriesForRole(entries, role)) {
        const matching = filterServices(entries, { role, category });
        const shown = categoryFixtureIds(groupServicesForDisplay(matching, { role, category }));
        assert.deepEqual(shown, matching.map(service => service.id), `${topic}/${role}/${category}`);
      }
    }
  }
});

test('universities are reachable from education rather than being classified by the incident vendor', () => {
  const entries = servicesForTopic('breach');
  const educationIds = filterServices(entries, { role: 'user', category: 'education' }).map(service => service.id);
  for (const id of ['osaka-university', 'osaka-metropolitan-university', 'zen-university-form']) {
    assert.ok(educationIds.includes(id), id);
    assert.equal(entries.find(service => service.id === id).groupByRole.user, 'education', id);
  }
  const result = filterServices(entries, { role: 'user', category: 'education', query: '大阪大学' });
  assert.deepEqual(result.map(service => service.id), ['osaka-university']);
});

test('cross-sector services are reachable from their supported purposes without multiplying service entries', () => {
  const entries = servicesForTopic('breach');
  for (const [id, categories] of [
    ['leanonme-learning', ['health', 'education']],
    ['sendenkaigi-mail', ['media', 'education']],
    ['projectdesign-news', ['media', 'education']],
    ['arcadia-raiden', ['public', 'education']],
    ['view-card', ['finance', 'transport']],
    ['sompo-japan', ['finance', 'business', 'transport']],
    ['onamae-desktop-cloud', ['communication', 'finance', 'business']],
  ]) {
    for (const category of categories) {
      const matching = filterServices(entries, { role: 'user', category });
      assert.equal(matching.filter(service => service.id === id).length, 1, `${id}/${category}`);
      assert.equal(categoryFixtureIds(groupServicesForDisplay(matching, { role: 'user', category })).filter(shownId => shownId === id).length, 1, `${id}/${category}`);
    }
  }
  const allIds = categoryFixtureIds(groupServicesForDisplay(entries, { role: 'user' }));
  assert.equal(allIds.filter(id => id === 'onamae-desktop-cloud').length, 1);
  assert.deepEqual(filterServices(entries, { role: 'user', category: 'finance', query: 'GMOインターネットグループ' }).map(service => service.id), ['onamae-desktop-cloud']);
});
