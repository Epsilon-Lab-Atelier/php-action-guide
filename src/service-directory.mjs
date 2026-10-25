import { services } from './catalog.mjs';
import { breachServices } from './catalog-breach.mjs';

// Keep the PHP evidence catalog independent from services researched for data incidents.
// Shared service IDs let readers move between topics without transferring factual claims.
export function mergeServiceDirectories(phpEntries, breachEntries) {
  const directory = new Map(phpEntries.map(service => [service.id, { ...service, topics: ['php', 'breach'] }]));
  for (const service of breachEntries) {
    // A later evidence-backed PHP entry takes precedence for the same service ID.
    // Keeping the ID stable preserves incident links and saved-service references.
    if (!directory.has(service.id)) directory.set(service.id, { ...service, topics: ['breach'] });
  }
  return [...directory.values()];
}

export const directoryServices = mergeServiceDirectories(services, breachServices);

export function supportsTopic(service, topic) {
  if (!service || !Array.isArray(service.topics)) return false;
  if (topic === 'all') return service.topics.length > 0;
  return ['php', 'breach'].includes(topic) && service.topics.includes(topic);
}

export function servicesForTopic(topic) {
  return directoryServices.filter(service => supportsTopic(service, topic));
}
