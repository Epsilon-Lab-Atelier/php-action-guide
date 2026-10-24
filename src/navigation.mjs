const guideLinkRoles = new Set(['user', 'admin']);
const guideLinkTopics = new Set(['all', 'php', 'breach']);
const guideLinkKeys = new Set(['service', 'role', 'topic']);

function validGuideSelection(selection, services) {
  if (!selection || typeof selection !== 'object' || !Array.isArray(services)) return null;
  const { serviceId, role, topic } = selection;
  if (typeof serviceId !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(serviceId)) return null;
  if (!guideLinkRoles.has(role) || !guideLinkTopics.has(topic)) return null;
  const service = services.find(record => record?.id === serviceId);
  if (!service || !Array.isArray(service.roles) || !service.roles.includes(role)) return null;
  return { serviceId, role, topic };
}

/** Parse only guide navigation; normal in-page anchors deliberately return null. */
export function parseGuideHash(hash, services) {
  if (hash === '#php') return { topic: 'php' };
  if (hash === '#breaches') return { topic: 'breach' };
  if (typeof hash !== 'string' || !hash.startsWith('#') || hash.length > 512 || /[\u0000-\u0020\u007f]/u.test(hash)) return null;
  const query = hash.slice(1);
  // URLSearchParams is intentionally forgiving; reject malformed escaping first.
  try { decodeURIComponent(query); } catch { return null; }
  if (query.split('&').length !== 3 || query.split('&').some(part => !part || !part.includes('='))) return null;
  const params = new URLSearchParams(query);
  const entries = [...params];
  if (entries.length !== 3 || new Set(entries.map(([key]) => key)).size !== 3 || entries.some(([key]) => !guideLinkKeys.has(key))) return null;
  return validGuideSelection({ serviceId: params.get('service'), role: params.get('role'), topic: params.get('topic') }, services);
}

function shareableGuideHost(hostname) {
  const host = hostname.toLowerCase().replace(/\.$/u, '');
  // A file or local preview address is not a link another reader can open.
  if (!host.includes('.') || host.includes(':') || /^[\d.]+$/u.test(host)) return false;
  if (/(?:^|\.)(?:localhost|local|internal|lan|home|test|invalid|example)$/u.test(host)) return false;
  return host.split('.').every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/u.test(label));
}

/** Share only catalog identifiers; never copy query parameters or personal choices. */
export function buildGuideLink(baseUrl, selection, services) {
  const valid = validGuideSelection(selection, services);
  if (!valid || typeof baseUrl !== 'string' || baseUrl.length > 4096 || !/^https?:\/\/[^/?#]/iu.test(baseUrl) || /[\u0000-\u0020\u007f\\]/u.test(baseUrl)) return null;
  try {
    const url = new URL(baseUrl);
    if (!['https:', 'http:'].includes(url.protocol) || !shareableGuideHost(url.hostname)) return null;
    url.username = '';
    url.password = '';
    url.search = '';
    url.hash = new URLSearchParams({ service: valid.serviceId, role: valid.role, topic: valid.topic }).toString();
    return url.href;
  } catch {
    return null;
  }
}
