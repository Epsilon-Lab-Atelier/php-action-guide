import { informationStatus, formatInformationTime } from './information-status.mjs';

// Only an explicitly chosen service and its viewed content marker are persisted.
// The injected storage keeps failures testable and avoids browser globals here.
export const WATCHLIST_KEY = 'epsilon-risk-check.watchlist.v1';
const watchlistMaxItems = 500;
const watchlistMaxBytes = 131072;
const watchlistRevisionPattern = /^[a-f0-9]{16}$/;
const watchlistIdPattern = /^[a-z0-9][a-z0-9-]{0,79}$/;

function watchlistPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}
function watchlistIdentity(value) {
  return typeof value === 'string' && watchlistIdPattern.test(value)
    && !['constructor', 'prototype'].includes(value);
}
function watchlistRevisions(value) {
  if (!watchlistPlainObject(value) || !Object.keys(value).length || Object.keys(value).length > 2
    || Object.keys(value).some(topic => !['breach', 'php'].includes(topic) || typeof value[topic] !== 'string' || !watchlistRevisionPattern.test(value[topic]))) return null;
  return Object.fromEntries(['breach', 'php'].filter(topic => Object.hasOwn(value, topic)).map(topic => [topic, value[topic]]));
}
function watchlistEntry(value, strict = false) {
  if (!watchlistPlainObject(value) || !Object.hasOwn(value, 'serviceId') || !Object.hasOwn(value, 'seenRevisions') || !watchlistIdentity(value.serviceId)) return null;
  const revisions = watchlistRevisions(value.seenRevisions);
  if (!revisions) return null;
  if (strict && (Object.keys(value).length !== 2 || Object.keys(value).some(key => !['serviceId', 'seenRevisions'].includes(key)))) return null;
  return { serviceId: value.serviceId, seenRevisions: revisions };
}
function watchlistItems(state) {
  const seen = new Set();
  return (Array.isArray(state?.items) ? state.items : []).flatMap(item => {
    const entry = watchlistEntry(item);
    if (!entry || seen.has(entry.serviceId) || seen.size >= watchlistMaxItems) return [];
    seen.add(entry.serviceId);
    return [entry];
  });
}
function watchlistResult(ok, status, items = []) {
  return { ok, status, items: items.map(item => ({ serviceId: item.serviceId, seenRevisions: { ...item.seenRevisions } })) };
}
function watchlistStorageError(error, items = []) {
  return watchlistResult(false, error?.name === 'QuotaExceededError' || error?.code === 22 || error?.code === 1014 ? 'quota' : 'unavailable', items);
}

/** Reading never writes, repairs, marks viewed, or migrates old saved-service data. */
export function readWatchlist(storage, services = []) {
  let raw;
  try {
    if (!storage || typeof storage.getItem !== 'function') return watchlistResult(false, 'unavailable');
    raw = storage.getItem(WATCHLIST_KEY);
  } catch (error) { return watchlistStorageError(error); }
  if (raw === null || raw === undefined) return watchlistResult(true, 'empty');
  if (typeof raw !== 'string' || raw.length > watchlistMaxBytes) return watchlistResult(false, 'malformed');
  try {
    const value = JSON.parse(raw);
    if (!watchlistPlainObject(value) || Object.keys(value).length !== 2 || value.version !== 1 || !Array.isArray(value.items)
      || Object.keys(value).some(key => !['version', 'items'].includes(key)) || value.items.length > watchlistMaxItems) return watchlistResult(false, 'malformed');
    const entries = value.items.map(item => watchlistEntry(item, true));
    if (entries.some(item => !item)) return watchlistResult(false, 'malformed');
    const known = new Set(services.map(service => service?.id));
    const items = watchlistItems({ items: entries }).filter(item => known.has(item.serviceId));
    return watchlistResult(true, items.length !== entries.length ? 'filtered' : items.length ? 'loaded' : 'empty', items);
  } catch { return watchlistResult(false, 'malformed'); }
}

/** Call only after the reader adds/removes a service or opens its current information. */
export function writeWatchlist(storage, state) {
  const items = watchlistItems(state);
  try {
    if (!storage || typeof storage.setItem !== 'function') return watchlistResult(false, 'unavailable', items);
    // Construct the payload afresh; usage selections, URLs and other caller fields never persist.
    storage.setItem(WATCHLIST_KEY, JSON.stringify({ version: 1, items }));
    return watchlistResult(true, 'saved', items);
  } catch (error) { return watchlistStorageError(error, items); }
}

/** New watches start at the current content; past entries are not unread notifications. */
export function toggleWatchService(state, serviceId, revisions) {
  const items = watchlistItems(state);
  if (!watchlistIdentity(serviceId)) return { items, status: 'invalid' };
  if (items.some(item => item.serviceId === serviceId)) return { items: items.filter(item => item.serviceId !== serviceId), status: 'removed' };
  const clean = watchlistRevisions(revisions);
  if (!clean) return { items, status: 'invalid' };
  if (items.length >= watchlistMaxItems) return { items, status: 'limit' };
  return { items: [...items, { serviceId, seenRevisions: clean }], status: 'added' };
}

/** Opening the list does not call this; opening a company's information does. */
export function markWatchServiceSeen(state, serviceId, revision, topic = 'breach') {
  const items = watchlistItems(state);
  if (!watchlistIdentity(serviceId) || !['breach', 'php'].includes(topic) || typeof revision !== 'string' || !watchlistRevisionPattern.test(revision)) return { items, status: 'invalid' };
  return { items: items.map(item => item.serviceId === serviceId ? { serviceId, seenRevisions: { ...item.seenRevisions, [topic]: revision } } : item), status: 'seen' };
}

const watchlistVerificationKeys = new Set(['checkedAt', 'checkedAtTime', 'attemptedAt', 'attemptedAtTime', 'lastAttempt', 'lastAttemptAt', 'lastAttemptStatus', 'verifiedAt', 'verificationAttempts']);
function watchlistContent(value) {
  if (value === null || ['string', 'boolean', 'number'].includes(typeof value)) return value;
  if (Array.isArray(value)) return value.map(watchlistContent);
  if (!watchlistPlainObject(value)) return null;
  return Object.fromEntries(Object.keys(value).sort().filter(key => !watchlistVerificationKeys.has(key) && value[key] !== undefined)
    .map(key => [key, watchlistContent(value[key])]));
}
function watchlistContentEvents(history, serviceId) {
  return (Array.isArray(history) ? history : []).filter(event => event?.type === 'content' && event.serviceIds?.includes(serviceId));
}
function watchlistRecords(incidents, serviceId) {
  return (Array.isArray(incidents) ? incidents : []).filter(record => record?.serviceIds?.includes(serviceId));
}
function watchlistRefs(service, records, events, topic) {
  return [...new Set([
    ...(topic !== 'breach' ? [...(service?.php?.sourceIds ?? []), ...(service?.incident?.sourceIds ?? []), ...(service?.officialAction?.sourceIds ?? [])] : []),
    ...(service?.domainSourceIds ?? []), ...(service?.supportSourceIds ?? []),
    ...records.flatMap(record => record.sourceIds ?? []), ...events.flatMap(event => event.sourceIds ?? []),
  ].filter(id => typeof id === 'string'))].sort();
}

/** Opaque change marker, not a security hash or a reader risk score. */
export function watchServiceRevision(service, { incidents = [], history = [], sources = {} } = {}, topic = null) {
  if (!service?.id) return null;
  const records = (topic === 'php' ? [] : watchlistRecords(incidents, service.id)).slice().sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const events = watchlistContentEvents(history, service.id).filter(event => !topic || (event.incidentId ? 'breach' : 'php') === topic)
    .slice().sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const refs = watchlistRefs(service, records, events, topic).map(id => [id, Object.hasOwn(sources, id) ? sources[id] : null]);
  const { php, incident, officialAction, actions, caution, topics, ...sharedService } = service;
  const contentService = topic === 'breach' ? { ...sharedService, topics: ['breach'] } : topic === 'php' ? { ...service, topics: ['php'] } : service;
  const text = JSON.stringify(watchlistContent({ service: contentService, records, events, sources: refs }));
  let digest = 14695981039346656037n;
  for (let index = 0; index < text.length; index += 1) {
    digest ^= BigInt(text.charCodeAt(index));
    digest = BigInt.asUintN(64, digest * 1099511628211n);
  }
  return digest.toString(16).padStart(16, '0');
}

export function watchServiceRevisions(service, data = {}) {
  if (!service?.id) return {};
  const topics = service.topics ?? (service.php ? ['breach', 'php'] : ['breach']);
  return Object.fromEntries(['breach', 'php'].filter(topic => topics.includes(topic)).map(topic => [topic, watchServiceRevision(service, data, topic)]));
}

function watchlistLatestEvent(events) {
  const date = events.map(event => String(event.date ?? '')).sort().at(-1);
  const sameDay = events.filter(event => event.date === date);
  // Clock times may mix Z and +09:00. Compare instants only if the whole
  // day's order is known; otherwise retain a representative recorded entry.
  if (sameDay.every(event => Number.isFinite(Date.parse(event.changedAtTime ?? '')))) {
    sameDay.sort((a, b) => Date.parse(b.changedAtTime) - Date.parse(a.changedAtTime));
  }
  return sameDay[0] ?? null;
}

/** Reading this view model never changes the saved viewed markers. */
export function watchlistRows(state, { services = [], incidents = [], history = [], sources = {} } = {}) {
  return watchlistItems(state).flatMap(item => {
    const service = services.find(candidate => candidate.id === item.serviceId);
    if (!service) return [];
    const records = watchlistRecords(incidents, service.id).slice().sort((a, b) => String(b.updatedAt ?? b.publishedAt ?? '').localeCompare(String(a.updatedAt ?? a.publishedAt ?? '')));
    const latest = records[0];
    const events = watchlistContentEvents(history, service.id);
    const event = watchlistLatestEvent(events);
    const revision = watchServiceRevision(service, { incidents, history, sources });
    const topics = [...(service.topics ?? (service.php ? ['breach', 'php'] : ['breach']))];
    const revisions = watchServiceRevisions(service, { incidents, history, sources });
    const unreadTopics = topics.filter(topic => revisions[topic] !== item.seenRevisions[topic]);
    const evidenceSourceIds = [...new Set([
      ...records.flatMap(record => record.sourceIds ?? []),
      ...(topics.includes('php') ? [...(service.php?.sourceIds ?? []), ...(service.incident?.sourceIds ?? []), ...(service.officialAction?.sourceIds ?? [])] : []),
    ])];
    const metadata = informationStatus({ sourceIds: evidenceSourceIds, history: events }, sources);
    const actionImpactSummary = metadata.actionImpact;
    return [{
      serviceId: service.id, name: service.name, revision, revisions, unreadTopics, unread: unreadTopics.length > 0, topics,
      breach: {
        count: records.length, label: latest?.status?.label ?? '掲載事案なし',
        action: latest?.officialAction?.text ?? '', publishedAt: latest?.publishedAt ?? null,
        updatedAt: latest?.updatedAt ?? null, title: latest?.title ?? '',
      },
      php: topics.includes('php') ? { label: service.incident?.label ?? '未確認', action: service.officialAction?.text ?? '' } : null,
      latestChangedAt: metadata.lastChangedAt, latestChangedAtTime: metadata.lastChangedAtTime,
      latestSummary: String(event?.summary ?? '').replaceAll('この手帳', 'このアプリ'),
      latestTitle: event?.title ?? '', actionImpact: event?.actionImpact ?? 'unknown', actionSummary: event?.actionSummary ?? '',
      metadata, actionImpactSummary,
    }];
  }).sort((a, b) => Number(b.unread) - Number(a.unread)
    || String(b.latestChangedAt ?? '').localeCompare(String(a.latestChangedAt ?? ''))
    || a.name.localeCompare(b.name, 'ja'));
}

function watchlistNode(document, tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function renderWatchlistView(container, { rows = [], onOpen, onRemove, onBrowse, storageAvailable = true } = {}) {
  const node = (tag, className, text) => watchlistNode(container.ownerDocument, tag, className, text);
  container.replaceChildren();
  const heading = node('div', 'watchlist-heading');
  const title = node('h1', '', 'ウォッチリスト'); title.id = 'watchlist-title'; title.tabIndex = -1;
  heading.append(title, node('p', '', '気になる企業の状況と、前回見た後の掲載変更をまとめて確認。'));
  const unread = rows.filter(row => row.unread).length;
  heading.append(node('p', 'watchlist-count', `${rows.length}企業・サービス${rows.length ? ` · 前回見た後に掲載変更 ${unread}件` : ''}`));
  container.append(heading);
  const privacy = node('p', storageAvailable ? 'watchlist-privacy' : 'watchlist-storage-warning', storageAvailable
    ? 'このブラウザだけに保存します。他の端末とは共有されません。利用状況の選択や入力URLは保存しません。'
    : 'このブラウザでは保存できません。ウォッチリストは、このページを開いている間だけ利用できます。');
  if (!storageAvailable) privacy.setAttribute('role', 'status');
  container.append(privacy);
  if (!rows.length) {
    const empty = node('section', 'watchlist-empty');
    empty.append(node('h2', '', '気になる企業を追加しましょう'), node('p', '', '企業・サービスの案内で「＋ ウォッチリスト」を選ぶと、ここにまとめられます。'));
    if (typeof onBrowse === 'function') {
      const browse = node('button', 'primary-button', '企業・サービスを探す'); browse.type = 'button'; browse.addEventListener('click', onBrowse); empty.append(browse);
    }
    container.append(empty);
    return { count: 0, unreadCount: 0 };
  }
  const list = node('div', 'watchlist-grid');
  for (const row of rows) {
    const card = node('article', `watchlist-card${row.unread ? ' has-update' : ''}`); card.dataset.watchService = row.serviceId;
    const header = node('div', 'watchlist-card-heading'); header.append(node('h2', '', row.name));
    if (typeof onRemove === 'function') {
      const remove = node('button', 'watchlist-remove', '解除'); remove.type = 'button'; remove.setAttribute('aria-label', `${row.name}をウォッチリストから外す`);
      remove.addEventListener('click', () => onRemove(row.serviceId)); header.append(remove);
    }
    card.append(header);
    if (row.unread) card.append(node('span', 'watchlist-unread', '前回見た後に掲載変更'));
    const statuses = node('dl', 'watchlist-statuses');
    if (row.topics.includes('breach')) {
      statuses.append(node('dt', '', '情報漏洩・不正アクセス'));
      const status = node('dd');
      status.append(node('strong', '', row.breach.count ? `${row.breach.count}件を掲載 · 直近の公表・続報：${row.breach.label}` : '掲載事案なし'));
      if (row.breach.publishedAt) status.append(node('small', '', `${row.breach.publishedAt} 公表${row.breach.updatedAt ? ` / ${row.breach.updatedAt} 続報` : ''}`));
      if (!row.breach.count) status.append(node('small', '', '未掲載は「被害なし」を意味しません。'));
      statuses.append(status);
    }
    if (row.php) statuses.append(node('dt', '', 'PHPの問題'), node('dd', '', row.php.label));
    card.append(statuses);
    const dates = node('div', 'watchlist-dates');
    dates.append(node('p', '', `公式情報の確認：${formatInformationTime(row.metadata.checkedAt, row.metadata.checkedAtTime)}`));
    dates.append(node('small', '', '引用資料のうち、確認日時が最も古いものを表示'));
    dates.append(node('p', '', `対応案内の変更：${formatInformationTime(row.metadata.lastActionChangedAt, row.metadata.lastActionChangedAtTime)}`));
    if (row.metadata.checkFailures.length) dates.append(node('small', 'watchlist-source-warning', `取得できなかった資料：${row.metadata.checkFailures.length}件。最後に確認できた日時を保持しています。`));
    card.append(dates);
    const changes = node('div', 'watchlist-latest');
    changes.append(node('p', 'watchlist-changed-at', row.latestChangedAt ? `掲載情報の変更：${formatInformationTime(row.latestChangedAt, row.latestChangedAtTime)}` : '掲載情報の変更記録はありません'));
    if (row.latestTitle) changes.append(node('p', 'watchlist-latest-title', row.latestTitle));
    if (row.actionImpactSummary.code !== 'unknown') changes.append(node('p', 'watchlist-action-summary', row.actionImpactSummary.text));
    else if (row.unread) changes.append(node('p', 'watchlist-action-summary', '掲載内容の変更です。必要な対応も変わったか、案内を開いて確認してください。'));
    card.append(changes);
    if (typeof onOpen === 'function') {
      const actions = node('div', 'watchlist-card-actions');
      for (const topic of ['breach', 'php'].filter(topic => row.topics.includes(topic))) {
        const open = node('button', 'watchlist-open', `${topic === 'breach' ? '情報漏洩の案内' : 'PHPの案内'}${row.unreadTopics.includes(topic) ? ' · 更新あり' : ''}`); open.type = 'button';
        open.setAttribute('aria-label', `${row.name}の${topic === 'breach' ? '情報漏洩' : 'PHP'}の案内を見る`);
        open.addEventListener('click', () => onOpen(row.serviceId, topic)); actions.append(open);
      }
      card.append(actions);
    }
    list.append(card);
  }
  container.append(list, node('p', 'hint', '掲載情報の変更は、新しい事故の発生や、必要な対応の変更を意味するとは限りません。詳しい対象範囲と公式案内を確認してください。'));
  return { count: rows.length, unreadCount: unread };
}
