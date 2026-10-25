// A verification time is a successful source-body read, never a scheduled run time.
function informationDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value ? value : null;
}

function informationInstant(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(value)) return null;
  if (!informationDate(value.slice(0, 10))) return null;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
}

function informationJapanParts(value) {
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(value));
  const part = type => parts.find(item => item.type === type).value;
  return { date: `${part('year')}-${part('month')}-${part('day')}`, time: `${part('hour')}:${part('minute')}` };
}

function informationTimeForDate(date, value) {
  const instant = informationInstant(value);
  return informationDate(date) && instant && informationJapanParts(instant).date === date ? instant : null;
}

/** Old records keep their known date; a missing clock time is never invented. */
export function formatInformationTime(date, time) {
  if (!informationDate(date)) return '未記録';
  const instant = informationTimeForDate(date, time);
  return instant ? `${date} ${informationJapanParts(instant).time}（日本時間）` : `${date}（時刻未記録）`;
}

const informationImpactLabels = Object.freeze({
  'scope-expanded': '対象範囲が拡大',
  changed: '必要な対応が変更',
  unchanged: '必要な対応の変更なし',
  unknown: '対応の変更は未分類',
});
const informationImpactText = Object.freeze({
  'scope-expanded': '対象範囲が広がりました。以前は対象外だった方も、公式案内を再確認してください。',
  changed: '利用者向けの対応案内が変わりました。必要な手続きや期限を確認してください。',
  unchanged: 'この更新による必要な対応の変更はありません。',
  unknown: '過去の案内との比較記録はありません。最新の公式案内を確認してください。',
});

/** Only explicit editorial comparison can establish an unchanged action. */
export function actionImpactForEvent(event) {
  const code = Object.hasOwn(informationImpactLabels, event?.actionImpact) ? event.actionImpact : 'unknown';
  const summary = typeof event?.actionSummary === 'string' ? event.actionSummary.trim() : '';
  return { code, label: informationImpactLabels[code], text: code !== 'unknown' && summary ? summary : informationImpactText[code] };
}

/** Aggregate a visible batch: one unknown event prevents a blanket 'unchanged'. */
export function summarizeActionImpact(events = []) {
  const impacts = (Array.isArray(events) ? events : []).map(actionImpactForEvent);
  const code = ['scope-expanded', 'changed', 'unknown', 'unchanged'].find(candidate => impacts.some(impact => impact.code === candidate)) ?? 'unknown';
  const match = impacts.filter(impact => impact.code === code);
  return { code, label: informationImpactLabels[code], text: match.length === 1 ? match[0].text : informationImpactText[code] };
}

function informationHistory(records) {
  return (Array.isArray(records) ? records : []).filter(event => event && (!event.type || event.type === 'content') && informationDate(event.date))
    .map(event => ({ ...event, changedAtTime: informationTimeForDate(event.date, event.changedAtTime) }));
}

function informationLatest(events) {
  const date = events.map(event => event.date).sort().at(-1) ?? null;
  const sameDay = events.filter(event => event.date === date);
  // If any entry on that day lacks a time, the final clock time is unknown.
  const time = sameDay.length && sameDay.every(event => event.changedAtTime) ? sameDay.map(event => event.changedAtTime).sort().at(-1) : null;
  return { date, time, events: time ? sameDay.filter(event => event.changedAtTime === time) : sameDay };
}

/**
 * Source dates describe the oldest referenced successful check. Content and
 * action-change timestamps remain separate; later unclassified history cannot
 * assert that the previous instructions are still unchanged.
 */
export function informationStatus(record = {}, sourceMap = {}) {
  const ids = [...new Set((Array.isArray(record?.sourceIds) ? record.sourceIds : []).filter(id => typeof id === 'string' && id))];
  const entries = ids.map(id => ({ id, source: sourceMap && Object.hasOwn(sourceMap, id) ? sourceMap[id] : null }));
  const missingSourceIds = entries.filter(({ source }) => !informationDate(source?.checkedAt)).map(({ id }) => id);
  const checkedAt = entries.length && !missingSourceIds.length ? entries.map(({ source }) => source.checkedAt).sort()[0] : null;
  const sourceTimes = entries.map(({ source }) => informationTimeForDate(source?.checkedAt, source?.checkedAtTime));
  const checkedAtTime = entries.length && sourceTimes.every(Boolean) ? sourceTimes.sort()[0] : null;
  const history = informationHistory(record?.history);
  const latest = informationLatest(history);
  const actions = informationLatest(history.filter(event => ['changed', 'scope-expanded'].includes(event.actionImpact)));
  const unknownAfterAction = history.some(event => actionImpactForEvent(event).code === 'unknown' && (!actions.date || event.date > actions.date || (event.date === actions.date && (!event.changedAtTime || !actions.time || event.changedAtTime >= actions.time))));
  const checkFailures = entries.flatMap(({ id, source }) => {
    const attempt = source?.lastAttempt;
    const at = informationInstant(attempt?.at);
    if (attempt?.outcome !== 'unavailable' || !at) return [];
    const successful = informationTimeForDate(source?.checkedAt, source?.checkedAtTime);
    if (successful && at <= successful) return [];
    if (!successful && informationDate(source?.checkedAt) && informationJapanParts(at).date < source.checkedAt) return [];
    return [{ sourceId: id, at, note: typeof attempt.note === 'string' && attempt.note.trim() ? attempt.note.trim() : '今回の確認では資料を取得できませんでした。最後に本文を確認できた日時を表示しています。' }];
  });
  return {
    checkedAt, checkedAtTime,
    lastChangedAt: latest.date, lastChangedAtTime: latest.time,
    lastActionChangedAt: unknownAfterAction ? null : actions.date,
    lastActionChangedAtTime: unknownAfterAction ? null : actions.time,
    actionComparisonUnknown: unknownAfterAction || !history.length,
    actionImpact: summarizeActionImpact(latest.events),
    checkFailures, missingSourceIds,
  };
}
