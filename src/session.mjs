// Volatile progress only: callers own this Map for the lifetime of the page.
// URL inputs, hostnames, theme and search filters are deliberately excluded.
export function sessionScopeKey(serviceId, role) {
  if (typeof serviceId !== 'string' || !serviceId || !['user', 'admin'].includes(role)) return null;
  return `${role}:${serviceId}`;
}

export function snapshotSessionProgress(progress = {}) {
  const list = value => Array.isArray(value) ? value.filter(item => typeof item === 'string') : [];
  const checks = value => new Set(value instanceof Set || Array.isArray(value) ? [...value].filter(item => typeof item === 'string') : []);
  return {
    usage: [...list(progress.usage)],
    checkedTasks: checks(progress.checkedTasks),
    breachContext: [...list(progress.breachContext)],
    checkedBreachTasks: checks(progress.checkedBreachTasks)
  };
}

export function rememberSessionProgress(notebook, state) {
  const key = state.kind === 'found' ? sessionScopeKey(state.service?.id, state.role) : null;
  const next = new Map(notebook);
  if (key) next.set(key, snapshotSessionProgress(state));
  return next;
}

export function restoreSessionProgress(notebook, serviceId, role) {
  const key = sessionScopeKey(serviceId, role);
  return snapshotSessionProgress(key ? notebook.get(key) : undefined);
}

export function resetSessionChecks(progress) {
  return { ...snapshotSessionProgress(progress), checkedTasks: new Set(), checkedBreachTasks: new Set() };
}
