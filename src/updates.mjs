import { services, sources } from './catalog.mjs';
import { breachIncidents, breachSources } from './incidents.mjs';

// These dates record this guide's history, not the date a provider fixed a problem.
export const updateTrackedSince = '2026-10-24';
const breachUpdateHistory = breachIncidents.flatMap(incident => (incident.history ?? []).map((event, index) => Object.freeze({
  id: `incident-${incident.id}-${event.id ?? `${event.date}-${index}`}`,
  type: 'content',
  incidentId: incident.id,
  date: event.date,
  serviceIds: Object.freeze([...incident.serviceIds]),
  sourceIds: Object.freeze([...(event.sourceIds ?? incident.sourceIds)]),
  title: `${incident.title}：${event.title}`,
  summary: event.summary.includes('発生日・公表日とは異なります') ? event.summary : `${event.summary} 日付はこの手帳の掲載内容を変えた日です。事案の発生日・公表日とは異なります。`,
})));
export const updateHistory = Object.freeze([
  Object.freeze({
    id: 'catalog-baseline-2026-10-24',
    type: 'baseline',
    date: updateTrackedSince,
    serviceIds: Object.freeze(services.map(service => service.id)),
    sourceIds: Object.freeze([]),
    title: '掲載情報の変更履歴を記録し始めました',
    summary: 'この日を記録の起点としています。サービスの対応状況がこの日に変わった、という意味ではありません。過去の変更日は記録していません。',
  }),
  ...breachUpdateHistory,
]);

export const appReleases = Object.freeze([
  Object.freeze({
    version: '0.6.0', date: '2026-10-24', title: 'ネットサービスの確認手帳になりました。',
    summary: 'PHPの問題と情報流出を、同じサービスの中でも事案ごとに分けて確認できます。掲載開始の日付と、事案の発生日・公表日は区別しています。',
    changes: Object.freeze(['見出しと案内を「ネットサービスの確認手帳」へ変更', 'PHPの問題・情報流出・すべての表示切替', '一つのサービスに複数の情報流出事案を掲載', '以前の利用・登録情報に合わせた確認メモと事案別の更新履歴']),
  }),
  Object.freeze({
    version: '0.5.0', date: '2026-10-24', title: '自分に合う確認メモを、手元にも。',
    summary: '使い方に合わせた案内、掲載情報の更新履歴、確認メモのコピー・保存に対応しました。サービスの対応状況を更新したという意味ではありません。',
    changes: Object.freeze(['サービスに合わせた使い方の選択', '情報の確認日と掲載内容の変更日の区別', '更新履歴と確認メモのコピー・保存']),
  }),
]);

function sourceIdsForUpdate(service, extraSourceIds = []) {
  return [...new Set([
    ...(service.php?.sourceIds ?? []), ...(service.incident?.sourceIds ?? []),
    ...(service.officialAction?.sourceIds ?? []), ...(service.domainSourceIds ?? []),
    ...(service.supportSourceIds ?? []),
    ...extraSourceIds,
  ])];
}

function validUpdateDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

const updatesSourceMap = { ...sources, ...breachSources };

/** Fresh copies prevent UI filters from changing the recorded history. */
export function historyForService(serviceId) {
  if (!services.some(service => service.id === serviceId)) return [];
  return updateHistory.filter(event => event.serviceIds.includes(serviceId))
    .map(event => ({ ...event, serviceIds: [...event.serviceIds], sourceIds: [...event.sourceIds] }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Pure summary used by the UI and fixture-based maintenance tests. */
export function summarizeUpdateMetadata(service, sourceMap, events, trackedSince, extraSourceIds = []) {
  if (!service) return { checkedAt: null, lastChangedAt: null, trackedSince: null, latestSourceCheckedAt: null };
  const refs = sourceIdsForUpdate(service, extraSourceIds);
  const dates = refs.map(id => sourceMap[id]?.checkedAt).filter(validUpdateDate).sort();
  const allDated = refs.length > 0 && dates.length === refs.length;
  const changes = events.filter(event => event.type === 'content' && event.serviceIds.includes(service.id))
    .map(event => event.date).filter(validUpdateDate).sort();
  return {
    checkedAt: allDated ? dates[0] : null,
    latestSourceCheckedAt: dates.at(-1) ?? null,
    lastChangedAt: changes.at(-1) ?? null,
    trackedSince,
  };
}

/** Oldest cited date is conservative: partial rereads do not make all facts fresh. */
export function metadataForService(serviceId) {
  const extraSourceIds = breachIncidents.filter(incident => incident.serviceIds.includes(serviceId)).flatMap(incident => incident.sourceIds);
  return summarizeUpdateMetadata(services.find(item => item.id === serviceId), updatesSourceMap, updateHistory, updateTrackedSince, extraSourceIds);
}

export function metadataForCatalog() {
  const meta = services.map(service => metadataForService(service.id));
  const allDated = meta.every(item => item.checkedAt);
  return {
    checkedAt: allDated ? meta.map(item => item.checkedAt).sort()[0] ?? null : null,
    lastChangedAt: updateHistory.filter(event => event.type === 'content').map(event => event.date).filter(validUpdateDate).sort().at(-1) ?? null,
    trackedSince: updateTrackedSince,
  };
}
