import { services, sources } from './catalog.mjs';
import { directoryServices } from './service-directory.mjs';
import { breachIncidents, breachSources } from './incidents.mjs';

// These dates record this guide's history, not the date a provider fixed a problem.
export const updateTrackedSince = '2026-10-24';
const breachUpdateHistory = breachIncidents.flatMap(incident => (incident.history ?? []).map((event, index) => Object.freeze({
  id: `incident-${incident.id}-${event.id ?? `${event.date}-${index}`}`,
  type: 'content',
  incidentId: incident.id,
  date: event.date,
  ...(event.changedAtTime ? {changedAtTime:event.changedAtTime} : {}),
  ...(event.actionImpact ? {actionImpact:event.actionImpact} : {}),
  ...(event.actionSummary ? {actionSummary:event.actionSummary} : {}),
  ...(event.changeKind ? {changeKind:event.changeKind} : {}),
  serviceIds: Object.freeze([...incident.serviceIds]),
  sourceIds: Object.freeze([...(event.sourceIds ?? incident.sourceIds)]),
  title: `${incident.title}：${event.title}`,
  summary: event.summary.includes('発生日・公表日とは異なります') ? event.summary : `${event.summary} 日付はこの手帳の掲載内容を変えた日です。事案の発生日・公表日とは異なります。`,
})));
export const updateHistory = Object.freeze([
  Object.freeze({
    id: 'sakura-rental-custom-php-2026-10-26', type: 'content', date: '2026-10-26', changedAtTime: '2026-10-26T17:50:12+09:00',
    serviceIds: Object.freeze(['sakura-rental']), sourceIds: Object.freeze(['sakuraRentalPhpHelp']),
    title: 'さくらのレンタルサーバで独自導入したPHPの注意事項を追記しました',
    summary: '10月26日の公式追記に基づき、独自インストールPHPは利用者自身の対応が必要でサポート対象外と明記しました。提供PHPの対応済みという説明と区別しています。日付はこの手帳の変更日です。',
    actionImpact: 'changed', actionSummary: '独自にPHPを導入している場合は自分で修正対応が必要です。提供PHPへの移行と、旧版からサポート中のPHP 8.3への移行をご確認ください。',
  }),
  Object.freeze({
    id: 'xserver-php-all-versions-2026-10-26', type: 'content', date: '2026-10-26', changedAtTime: '2026-10-26T17:50:12+09:00',
    serviceIds: Object.freeze(['xserver']), sourceIds: Object.freeze(['xserverServerPhpNotice', 'xserverPhpNotice']),
    title: 'エックスサーバーのPHP 5.1〜8.5全対象サーバーへの対応完了を反映しました',
    summary: '公式告知にある10月26日6:20までの対応完了を反映し、従来のPHP 5.1〜5.5は過半数という掲載を更新しました。10月21日の2件に限る説明で、VPSや追加CVEへの対応完了を示すものではありません。日付はこの手帳の変更日です。',
    actionImpact: 'changed', actionSummary: 'PHP 5.1〜5.5も全対象サーバーが対応済みとなり、この2件への対策として急いで版を変える必要はないと案内されています。追加案内と契約種別は引き続き確認してください。',
  }),
  Object.freeze({
    id: 'sakura-rental-action-2026-10-25', type: 'content', date: '2026-10-25',
    serviceIds: Object.freeze(['sakura-rental']), sourceIds: Object.freeze(['sakuraRentalPhpHelp','sakuraPhpNotice']),
    title: 'さくらのレンタルサーバの利用者向け案内を明確にしました',
    summary: '10月21日の2件に関する提供PHPの対応と、利用者の緊急対応は不要という公式案内を追記しました。VPSの自己管理PHPや追加CVEへの対応完了を示すものではありません。',
  }),
  Object.freeze({
    id: 'wordpress-php-guidance-2026-10-25', type: 'content', date: '2026-10-25',
    serviceIds: Object.freeze(['wordpress-selfhost']), sourceIds: Object.freeze(['wordpressSecurityNotice']),
    title: '自己管理WordPressの公式PHP更新案内を追加しました',
    summary: '10月21日のWordPress.org公式告知を根拠に、ホスティング事業者への確認とPHPバージョンの確認場所を追記しました。日付はこの手帳の変更日です。',
  }),
  Object.freeze({
    id: 'drupal-audit-guidance-2026-10-25', type: 'content', date: '2026-10-25',
    serviceIds: Object.freeze(['drupal']), sourceIds: Object.freeze(['drupalAudit']),
    title: 'DrupalのPHP更新後の点検案内を追加しました',
    summary: '10月22日の公式案内に基づき、ログの保全と10月17日以降の点検、管理事業者への確認を追加しました。個別サイトの侵害確認ではありません。日付はこの手帳の変更日です。',
  }),
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
    version: '0.10.0', date: '2026-10-25', title: 'ウォッチリストで気になる企業をまとめて確認',
    summary: '保存した企業の状況と前回開いた後の掲載変更をまとめ、利用状況に応じた最初の行動と対象期間を見やすくしました。',
    changes: Object.freeze(['このブラウザに保存するウォッチリスト', '対象期間と、利用状況に応じた「まずすること」を表示', '公式資料の確認日時と掲載・対応案内の変更日時を区別', '更新履歴に対応変化の比較記録を表示']),
  }),
  Object.freeze({
    version: '0.9.0', date: '2026-10-25', title: 'ネットサービスのリスクチェックへ',
    summary: '公開情報を見て、利用状況を選び、自分に関係する情報と対応を確認する構成へ変更しました。事業者の対応状況や資料確認日の更新を意味しません。',
    changes: Object.freeze(['確認メモ・保存・印刷・確認済みチェックを画面から削除', '利用状況に応じて公表範囲と必要な対応を表示', '白・ネイビー・ブルーを基調とするデザイン', '日付・企業ごとにまとめた独立した更新履歴画面']),
  }),
  Object.freeze({
    version: '0.8.0', date: '2026-10-25', title: '必要な情報を、ひと目で。',
    summary: '情報漏洩とPHPの入口・掲載対象を分け、対象範囲と公式の対応案内を先に表示する構成へ変えました。事案の追加や続報は掲載情報の履歴に記録します。',
    changes: Object.freeze(['文字・余白・配色を整えた新しいデザイン', '情報漏洩とPHPの独立したサービス一覧', '対象者と今確認することを優先した表示', '詳細・確認メモ・保存操作を折りたたみへ整理']),
  }),
  Object.freeze({
    version: '0.7.0', date: '2026-10-25', title: '確認の続きへ、迷わず戻れるように。',
    summary: 'ページ内の確認途中のメモを保ち、サービス別リンクと希望した場合だけの端末保存を追加しました。公式資料の再調査や、事業者の対応状況の更新を示すものではありません。',
    changes: Object.freeze(['サービス・立場ごとにページ内の選択とチェックを保持', '確認をやり直す操作と情報流出の対象期間の常時表示', 'サービス・立場・テーマだけの案内リンク', '希望したサービスだけの端末保存と掲載内容の変更のお知らせ', '関連記事への案内とPagesのビルド・テスト・公開設定']),
  }),
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
  if (!directoryServices.some(service => service.id === serviceId)) return [];
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
  const trackedSince = updateHistory.filter(event => event.serviceIds.includes(serviceId)).map(event => event.date).filter(validUpdateDate).sort()[0] ?? null;
  return summarizeUpdateMetadata(directoryServices.find(item => item.id === serviceId), updatesSourceMap, updateHistory, trackedSince, extraSourceIds);
}

export function metadataForCatalog() {
  const meta = directoryServices.map(service => metadataForService(service.id));
  const allDated = meta.every(item => item.checkedAt);
  return {
    checkedAt: allDated ? meta.map(item => item.checkedAt).sort()[0] ?? null : null,
    lastChangedAt: updateHistory.filter(event => event.type === 'content').map(event => event.date).filter(validUpdateDate).sort().at(-1) ?? null,
    trackedSince: updateTrackedSince,
  };
}
