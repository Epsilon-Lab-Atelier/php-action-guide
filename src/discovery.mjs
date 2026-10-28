/** Normalize display/search text without making a claim about a site's identity. */
export function normalizeSearchText(text) {
  return String(text ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u30a1-\u30f6]/gu, character => String.fromCharCode(character.charCodeAt(0) - 0x60))
    .replace(/\s+/gu, ' ')
    .trim();
}

function isListedForRole(service, role) {
  return (role === 'user' || role === 'admin') && Array.isArray(service.roles) && service.roles.includes(role);
}

/** Return visible catalog entries in their original order. Query terms use AND. */
export function filterServices(services, { role, query = '', category = 'all' } = {}) {
  const terms = normalizeSearchText(query).split(' ').filter(Boolean);
  return services.filter(service => {
    if (!isListedForRole(service, role)) return false;
    if (category !== 'all' && service.groupByRole?.[role] !== category) return false;
    const searchable = normalizeSearchText([
      service.name,
      service.short,
      service.operator,
      ...(service.companyAliases ?? []),
      ...(service.keywords ?? []),
      ...(service.domains ?? []).map(domain => domain.host),
    ].filter(value => value != null).join(' '));
    return terms.every(term => searchable.includes(term));
  });
}

/** Suggest a separate topic without transferring its evidence to the current one.
 * Category filtering is deliberately omitted: the destination starts at "all".
 * Prefer the current role; a different role is returned explicitly for the UI.
 */
export function relatedTopicMatches(services, { topic, role, query = '' } = {}) {
  if (!['php', 'breach'].includes(topic) || !['user', 'admin'].includes(role) || !normalizeSearchText(query)) return [];
  const otherTopic = topic === 'php' ? 'breach' : 'php';
  const candidates = services.filter(service => Array.isArray(service.topics)
    && service.topics.includes(otherTopic) && !service.topics.includes(topic));
  const suggestions = [];
  const seen = new Set();
  for (const nextRole of [role, role === 'user' ? 'admin' : 'user']) {
    const matches = filterServices(candidates, { role: nextRole, query })
      .filter(service => !seen.has(service.id));
    if (!matches.length) continue;
    matches.forEach(service => seen.add(service.id));
    suggestions.push({ topic: otherTopic, role: nextRole, services: matches });
  }
  return suggestions;
}

/** Category IDs are unique and retain their first visible catalog appearance. */
export function categoriesForRole(services, role) {
  return [...new Set(services
    .filter(service => isListedForRole(service, role))
    .map(service => service.groupByRole?.[role])
    .filter(category => typeof category === 'string' && category.length > 0))];
}
