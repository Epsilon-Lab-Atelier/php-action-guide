/** Pure text export. No browser state, storage or network access. */
function memoLine(value, fallback = '') {
  if (typeof value !== 'string') return fallback;
  // Keep user-provided values on one line, including bidi and other controls.
  return value.replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029\u202a-\u202e\u2066-\u2069]/g, ' ').replace(/\s+/g, ' ').trim() || fallback;
}

function memoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === value ? value : null;
}

function memoCreation(value) {
  const day = memoDate(value);
  if (day) return { day, label: day };
  if (!(value instanceof Date) && (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/.test(value))) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.valueOf())) return null;
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date).map(part => [part.type, part.value]));
  const localDay = `${parts.year}-${parts.month}-${parts.day}`;
  return { day: localDay, label: `${localDay} ${parts.hour}:${parts.minute} (日本時間)` };
}

function memoHostname(value) {
  if (typeof value !== 'string' || /[@\s\u0000-\u001f\u007f]/.test(value)) return null;
  try {
    const url = new URL(value.includes('://') ? value : `https://${value}`);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null;
    const host = url.hostname.toLowerCase().replace(/\.$/, '');
    return host.includes('.') && /^[a-z0-9.-]+$/.test(host) ? host : null;
  } catch { return null; }
}

function memoSourceUrl(value) {
  if (typeof value !== 'string' || /[\s\u0000-\u001f\u007f]/.test(value)) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

function memoGroups(value) {
  return (Array.isArray(value) ? value : []).filter(group => group && typeof group === 'object').map(group => ({
    title: memoLine(group.title, '確認事項'),
    tasks: (Array.isArray(group.tasks) ? group.tasks : []).filter(task => task && memoLine(task.text)).map(task => ({ id: task.id, text: memoLine(task.text) })),
  })).filter(group => group.tasks.length);
}

function memoChecks(value) {
  return new Set(Array.isArray(value) || value instanceof Set ? value : []);
}

function memoLabels(value) {
  return [...new Set((Array.isArray(value) ? value : []).map(label => memoLine(label)).filter(Boolean))];
}

function memoAppendChecklist(lines, groups, checked) {
  const tasks = groups.flatMap(group => group.tasks);
  const completed = tasks.filter(task => typeof task.id === 'string' && checked.has(task.id)).length;
  lines.push(`確認済み: ${completed} / ${tasks.length} 項目`);
  if (!groups.length) lines.push('確認項目はまだ選ばれていません。');
  for (const group of groups) {
    lines.push('', group.title);
    for (const task of group.tasks) lines.push(`[${typeof task.id === 'string' && checked.has(task.id) ? 'x' : ' '}] ${task.text}`);
  }
}

function memoBreachDates(record, sourceById) {
  const ids = [...new Set(Array.isArray(record.sourceIds) ? record.sourceIds : [])];
  const dates = ids.map(id => memoDate(sourceById.get(id)?.checkedAt));
  const historyDates = (Array.isArray(record.history) ? record.history : []).map(event => memoDate(event?.date)).filter(Boolean).sort();
  return {
    checkedAt: dates.length && dates.every(Boolean) ? dates.sort()[0] : null,
    lastChangedAt: historyDates.at(-1) ?? null,
  };
}

/**
 * Pure export of the current selection. PHP fields remain backwards-compatible.
 * includePhp defaults to true; includeBreaches defaults to false.
 * breachSources include an id that matches breachIncidents[].sourceIds.
 * groups / breachGroups: [{title,tasks:[{id,text}]}]. Their checkedTaskIds are
 * independent Array or Set values. All dates are YYYY-MM-DD; createdAt also
 * accepts an ISO timestamp with an offset or a Date.
 */
export function createMemoText(input = {}) {
  const data = input && typeof input === 'object' ? input : {};
  const includePhp = data.includePhp !== false;
  const includeBreaches = data.includeBreaches === true;
  const role = data.role === 'admin' ? 'サイトを管理する人' : data.role === 'user' ? 'サービスを利用する人' : '未選択';
  const created = memoCreation(data.createdAt);
  const hostname = memoHostname(data.hostname);
  const usage = memoLabels(data.usageLabels);
  const context = memoLabels(data.breachContextLabels);
  const version = memoLine(data.version);
  const breachSourcesForMemo = (Array.isArray(data.breachSources) ? data.breachSources : []).filter(source => source && typeof source === 'object');
  const breachSourceById = new Map(breachSourcesForMemo.filter(source => typeof source.id === 'string').map(source => [source.id, source]));
  const allSources = [
    ...(includePhp && Array.isArray(data.sources) ? data.sources : []),
    ...(includeBreaches ? breachSourcesForMemo : []),
  ];
  const exportSources = [];
  const sourceNumbers = new Map();
  const sourceNumberById = new Map();
  for (const source of allSources) {
    if (!source || typeof source !== 'object') continue;
    const url = memoSourceUrl(source.url);
    if (!url) continue;
    if (!sourceNumbers.has(url)) {
      exportSources.push({ ...source, url });
      sourceNumbers.set(url, exportSources.length);
    }
    if (typeof source.id === 'string') sourceNumberById.set(source.id, sourceNumbers.get(url));
  }
  const defaultTitle = includePhp && includeBreaches ? 'PHPの問題・情報流出の掲載情報' : includePhp ? '2026年10月のPHP問題（PHP2Shellと追加案内）' : '情報流出の掲載情報';
  const lines = [
    'EpsilonLab | ネットサービスの確認メモ',
    `対象の問題: ${memoLine(data.issueTitle, defaultTitle)}`,
    ...(version ? [`アプリの版: ${version}`] : []),
    `メモ作成日時: ${created?.label ?? '未記録'}`,
    `サービス・環境: ${memoLine(data.serviceName, '掲載情報なし')}`,
    `立場: ${role}`,
    ...(hostname ? [`照合したドメイン: ${hostname}`] : []),
    `掲載資料の確認日: ${memoDate(data.checkedAt) ?? '未確認'}`,
    `掲載内容の変更日: ${memoDate(data.lastChangedAt) ?? '未記録'}`,
    '確認日と変更日は異なります。未記録は、過去に変更がなかったという意味ではありません。',
    ...(data.role !== 'admin' ? [`選んだ使い方: ${usage.length ? usage.join(' / ') : '未選択 (共通の確認事項)'}`] : []),
  ];
  if (includePhp) {
    lines.push('', '【PHPの利用について分かっていること】',
      `状態: ${memoLine(data.php?.label, '未確認')}`,
      memoLine(data.php?.text, 'このメモに掲載情報はありません。'),
      '', '【対象となる問題についての公式説明】',
      `状態: ${memoLine(data.incident?.label, '未確認')}`,
      memoLine(data.incident?.text, 'このメモに掲載情報はありません。'),
      '', '【今回の問題に関する公式の対応案内】',
      memoLine(data.officialAction?.text, '利用者に必要な手続きは未確認です。公式の案内を確認してください。'),
      '', '【EpsilonLabの確認メモ】',
      'PHPの問題について、利用方法や立場に合わせた一般的な確認手順です。上記の公式な対応案内とは区別してご覧ください。');
    memoAppendChecklist(lines, memoGroups(data.groups), memoChecks(data.checkedTaskIds));
    const caution = memoLine(data.caution);
    if (caution) lines.push('', `補足: ${caution}`);
  }
  if (includeBreaches) {
    lines.push('', '【情報流出・不正アクセスの掲載事案】',
      '事案ごとに、対象となるサービス・期間・情報を確認してください。事業者の対応状況と、情報流出の有無は別に記録します。');
    const records = (Array.isArray(data.breachIncidents) ? data.breachIncidents : []).filter(record => record && typeof record === 'object');
    if (!records.length) lines.push('このサービスに結び付く事案は、このメモには掲載されていません。被害がないことや安全であることを示すものではありません。公式のお知らせも確認してください。');
    for (const [index, record] of records.entries()) {
      const dates = memoBreachDates(record, breachSourceById);
      const refs = [...new Set((Array.isArray(record.sourceIds) ? record.sourceIds : []).map(id => sourceNumberById.get(id)).filter(Boolean))];
      lines.push('', `事案 ${index + 1}: ${memoLine(record.title, '名称未記録')}`,
        `公表日: ${memoDate(record.publishedAt) ?? '未確認'}`,
        `公式発表の更新日: ${memoDate(record.updatedAt) ?? '記載なし・未確認'}`,
        `発生時期: ${memoLine(record.occurredAt, '未確認')}`,
        `対象期間: ${memoLine(record.affectedPeriod, '未確認')}`,
        `対象範囲: ${memoLine(record.scope, '未確認')}`,
        `対象となる情報: ${memoLabels(record.dataTypes).join(' / ') || '未確認'}`,
        `対象外とする公式説明: ${memoLine(record.excludedData, 'このメモの掲載資料からは未確認')}`,
        `情報流出の状態: ${memoLine(record.status?.label, '未確認')}`,
        memoLine(record.status?.text, '流出の有無・範囲は未確認です。'),
        `事業者の対応状況: ${memoLine(record.providerResponse?.label, '未確認')}`,
        memoLine(record.providerResponse?.text, '対応状況は未確認です。'),
        'この事案についての公式の対応案内:',
        memoLine(record.officialAction?.text, '利用者に必要な手続きは未確認です。公式の案内を確認してください。'),
        `事案の掲載資料の確認日: ${dates.checkedAt ?? '未確認'}`,
        `事案の掲載内容の変更日: ${dates.lastChangedAt ?? '未記録'}`,
        `根拠資料: ${refs.length ? refs.map(number => `[${number}]`).join(' ') : 'このメモに掲載なし'}`);
      const caution = memoLine(record.caution);
      if (caution) lines.push(`補足: ${caution}`);
    }
    lines.push('', '【情報流出について、自分で確かめること】',
      `選んだ利用状況: ${context.length ? context.join(' / ') : '未選択 (共通の確認事項)'}`,
      'EpsilonLabが整理した一般的な確認手順です。個別事案の公式な対応指示とは区別してご覧ください。');
    memoAppendChecklist(lines, memoGroups(data.breachGroups), memoChecks(data.breachCheckedTaskIds));
  }
  lines.push('', 'チェックは、被害の有無や安全性、修正完了を判定するものではありません。', '', '【根拠となる公式資料・確認窓口】');
  const sourceKinds = { support: '公式窓口 (個別の対応状況を示す根拠ではありません)', domain: '公式のドメイン案内', technical: '公式の技術資料', incident: '公式資料' };
  for (const [index, source] of exportSources.entries()) {
    lines.push(`- [${index + 1}] ${memoLine(source.title, '公式資料・確認先')}`, `  ${source.url}`, `  ${sourceKinds[source.kind] ?? '掲載資料'} / 確認日: ${memoDate(source.checkedAt) ?? '未確認'}`);
    if (source.verificationNote) lines.push(`  確認方法: ${memoLine(source.verificationNote)}`);
  }
  if (!exportSources.length) lines.push('このメモに掲載された公式リンクはありません。');
  lines.push('', '保存したメモは作成時点の内容です。最新状況と必要な手続きは、公式サイト・公式アプリで確かめてください。', '入力URLのパス・クエリ・フラグメントは、このメモには含めていません。');
  return `${lines.join('\n')}\n`;
}

export function memoFilename(input = {}) {
  const data = input && typeof input === 'object' ? input : {};
  const day = memoCreation(data.createdAt)?.day ?? 'undated';
  const service = typeof data.serviceId === 'string' && /^[a-z][a-z0-9-]{0,63}$/.test(data.serviceId) ? data.serviceId : 'unknown';
  const role = data.role === 'user' || data.role === 'admin' ? data.role : 'unknown';
  return `epsilon-service-memo-${day}-${service}-${role}.txt`;
}
