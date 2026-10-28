// Reader-facing service types. Incident mechanisms do not determine a service's type.
export const categoryLabels = Object.freeze({
  transport: '交通・配送',
  travel: '旅行・宿泊・レジャー',
  shopping: '買い物・食事',
  finance: '金融・決済・保険',
  communication: '通信・ネット・クラウド',
  daily: '暮らし・会員サービス',
  education: '教育・研究',
  health: '医療・介護・福祉',
  public: '行政・公共サービス',
  media: '出版・ニュース・放送',
  social: 'SNS・動画・ゲーム',
  publishing: 'ブログ・サイト制作',
  business: '仕事・採用・法人向け',
  cms: '自分で設置するCMS',
  hosting: 'レンタルサーバー',
  server: 'VPS・自分で管理するサーバー',
  commerce: 'ショップ運営サービス',
});

export const categoryOrder = Object.freeze({
  user: Object.freeze(['transport', 'travel', 'shopping', 'finance', 'communication', 'daily', 'education', 'health', 'public', 'media', 'social', 'publishing', 'business']),
  admin: Object.freeze(['cms', 'hosting', 'server', 'commerce', 'publishing']),
});

function categoryRoleIsValid(role) {
  return role === 'user' || role === 'admin';
}

function categoryIsAllowed(category, role) {
  return typeof category === 'string' && categoryRoleIsValid(role)
    && categoryOrder[role].includes(category) && Object.hasOwn(categoryLabels, category);
}

/** Keep primary grouping stable while allowing a service to be found by other uses. */
export function serviceGroupsForRole(service, role) {
  if (!categoryRoleIsValid(role) || !Array.isArray(service?.roles) || !service.roles.includes(role)) return [];
  if (!service.groupByRole || !Object.hasOwn(service.groupByRole, role)) return [];
  const primary = service.groupByRole?.[role];
  if (!categoryIsAllowed(primary, role)) return [];
  const additional = service.additionalGroupsByRole?.[role];
  return [...new Set([primary, ...(Array.isArray(additional) ? additional : [])]
    .filter(category => categoryIsAllowed(category, role)))];
}

/** An all-types list shows each service once; a selected type includes secondary matches. */
export function groupServicesForDisplay(services, { role, category = 'all' } = {}) {
  if (!categoryRoleIsValid(role)) return [];
  if (category !== 'all') {
    if (!categoryIsAllowed(category, role)) return [];
    const matches = services.filter(service => serviceGroupsForRole(service, role).includes(category));
    return matches.length ? [{ id: category, services: matches }] : [];
  }
  return categoryOrder[role].flatMap(id => {
    const matches = services.filter(service => serviceGroupsForRole(service, role)[0] === id);
    return matches.length ? [{ id, services: matches }] : [];
  });
}

/** Strict validation for published data: never substitute an unspecified business category. */
export function categoryAssignmentIssues(services) {
  const issues = [];
  for (const service of services) {
    const id = service?.id ?? '(missing service id)';
    const roles = service?.roles;
    if (!Array.isArray(roles) || !roles.length || roles.some(role => !categoryRoleIsValid(role)) || new Set(roles).size !== roles.length) {
      issues.push(`${id}: roles must contain distinct supported roles`);
      continue;
    }
    const primary = service.groupByRole;
    if (!primary || typeof primary !== 'object' || Array.isArray(primary)) {
      issues.push(`${id}: groupByRole must specify a primary category for each role`);
      continue;
    }
    for (const role of Object.keys(primary)) {
      if (!roles.includes(role)) issues.push(`${id}: primary category assigned to unlisted role ${role}`);
    }
    for (const role of roles) {
      if (!Object.hasOwn(primary, role) || !categoryIsAllowed(primary[role], role)) issues.push(`${id}: missing or unsupported primary category for ${role}`);
    }
    const additional = service.additionalGroupsByRole;
    if (additional === undefined) continue;
    if (!additional || typeof additional !== 'object' || Array.isArray(additional)) {
      issues.push(`${id}: additionalGroupsByRole must be a role-to-array mapping`);
      continue;
    }
    if (!Object.keys(additional).length) issues.push(`${id}: omit additionalGroupsByRole when there are no additional categories`);
    for (const [role, groups] of Object.entries(additional)) {
      if (!roles.includes(role)) issues.push(`${id}: additional categories assigned to unlisted role ${role}`);
      if (!Array.isArray(groups) || !groups.length) {
        issues.push(`${id}: additional categories for ${role} must be a nonempty array`);
        continue;
      }
      if (new Set(groups).size !== groups.length || groups.includes(primary[role])) issues.push(`${id}: repeated category for ${role}`);
      for (const group of groups) {
        if (!categoryIsAllowed(group, role)) issues.push(`${id}: unsupported additional category for ${role}: ${String(group)}`);
      }
    }
  }
  return issues;
}
