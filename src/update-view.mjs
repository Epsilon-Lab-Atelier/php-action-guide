const updateViewTopics = Object.freeze({ breach: '情報漏洩・不正アクセス', php: 'PHPの問題' });
const updateViewKinds = Object.freeze({ new: '新規掲載', followup: '続報を反映', correction: '訂正を反映', update: '掲載内容を更新' });

function updateViewValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** The history's date-only values are Japanese publication dates, not source dates. */
export function japanDate(now = new Date()) {
  const date = now instanceof Date ? now : new Date(now);
  if (!Number.isFinite(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const part = (type) => parts.find(item => item.type === type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

/** A company appears once per day even when several incidents or themes changed. */
export function groupUpdatesByDate(history = [], services = [], { topic = 'all', query = '', serviceId: selectedServiceId = null } = {}) {
  const known = new Map(services.map(service => [service.id, service]));
  const nameQuery = String(query).normalize('NFKC').trim().toLocaleLowerCase('ja');
  const priorPhp = new Set(history.filter(event => event.type === 'baseline').flatMap(event => event.serviceIds ?? []));
  const seenRecords = new Set();
  const seenEvents = new Set();
  const days = new Map();
  const ordered = history.map((event, index) => ({ event, index }))
    .filter(({ event }) => event.type === 'content' && updateViewValidDate(event.date))
    .sort((a, b) => a.event.date.localeCompare(b.event.date) || a.index - b.index);

  for (const { event, index } of ordered) {
    const eventId = event.id ?? `history-${index}`;
    if (seenEvents.has(eventId)) continue;
    seenEvents.add(eventId);
    const eventTopic = event.incidentId ? 'breach' : 'php';
    for (const serviceId of new Set(event.serviceIds ?? [])) {
      const service = known.get(serviceId);
      if (!service) continue;
      const recordKey = `${serviceId}:${eventTopic}:${event.incidentId ?? 'php'}`;
      const previouslyListed = seenRecords.has(recordKey) || (eventTopic === 'php' && priorPhp.has(serviceId));
      let kind = previouslyListed ? 'update' : 'new';
      // Explicit classification is preferred. Do not call an initial entry a follow-up
      // merely because its source happens to be the provider's fifth report.
      if (Object.hasOwn(updateViewKinds, event.changeKind)) kind = event.changeKind;
      else if (previouslyListed && /訂正/.test(event.title ?? '')) kind = 'correction';
      else if (previouslyListed && /続報/.test(event.title ?? '')) kind = 'followup';
      seenRecords.add(recordKey);
      if (topic !== 'all' && topic !== eventTopic) continue;
      if (selectedServiceId && serviceId !== selectedServiceId) continue;
      if (!selectedServiceId && nameQuery && !service.name.normalize('NFKC').toLocaleLowerCase('ja').includes(nameQuery)) continue;
      if (!days.has(event.date)) days.set(event.date, { date: event.date, services: new Map(), eventIds: new Set() });
      const day = days.get(event.date);
      day.eventIds.add(eventId);
      if (!day.services.has(serviceId)) day.services.set(serviceId, { serviceId, name: service.name, topics: [], kinds: [], events: [] });
      const row = day.services.get(serviceId);
      if (!row.topics.includes(eventTopic)) row.topics.push(eventTopic);
      if (!row.kinds.includes(kind)) row.kinds.push(kind);
      row.events.push({ ...event, id: eventId, topic: eventTopic, kind, serviceIds: [...(event.serviceIds ?? [])], sourceIds: [...new Set(event.sourceIds ?? [])] });
    }
  }
  return [...days.values()].sort((a, b) => b.date.localeCompare(a.date)).map(day => ({
    date: day.date,
    serviceCount: day.services.size,
    eventCount: day.eventIds.size,
    services: [...day.services.values()].sort((a, b) => a.name.localeCompare(b.name, 'ja')),
  }));
}

function updateViewNode(document, tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** Render once when entering the updates view. Filters remain local to this view. */
export function renderUpdateView(container, { history = [], services = [], sources = {}, releases = [], onSelectService, initialServiceId = null, now = new Date() } = {}) {
  const document = container.ownerDocument;
  const node = (tag, className, text) => updateViewNode(document, tag, className, text);
  const today = japanDate(now);
  const allDays = groupUpdatesByDate(history, services);
  let selectedTopic = 'all';
  let selectedServiceId = services.some(service => service.id === initialServiceId) ? initialServiceId : null;
  let query = services.find(service => service.id === selectedServiceId)?.name ?? '';
  let selectedDate = groupUpdatesByDate(history, services, { serviceId: selectedServiceId })[0]?.date ?? allDays[0]?.date ?? today;
  container.replaceChildren();

  const heading = node('div', 'update-view-heading');
  const title = node('h1', '', '更新履歴'); title.id = 'updates-title'; title.tabIndex = -1;
  heading.append(title, node('p', '', '更新された企業・サービスを、日付ごとに確認できます。'));
  const todayCount = allDays.find(day => day.date === today)?.serviceCount ?? 0;
  heading.append(node('p', 'update-today', `今日（${today ?? '日付を取得できません'}・日本時間）の掲載変更：${todayCount}企業・サービス`));
  container.append(heading);

  const controls = node('div', 'update-controls');
  const dateLabel = node('label', '', '掲載を変更した日'); dateLabel.htmlFor = 'update-date';
  const dateSelect = node('select'); dateSelect.id = 'update-date';
  const topicLabel = node('label', '', 'テーマ'); topicLabel.htmlFor = 'update-topic';
  const topicSelect = node('select'); topicSelect.id = 'update-topic';
  const searchLabel = node('label', '', '企業・サービス名'); searchLabel.htmlFor = 'update-search';
  const searchInput = node('input'); searchInput.id = 'update-search'; searchInput.type = 'search'; searchInput.placeholder = '名前で絞り込む'; searchInput.value = query;
  searchInput.autocomplete = 'off'; searchInput.spellcheck = false;
  for (const [value, label] of [['all', 'すべてのテーマ'], ...Object.entries(updateViewTopics)]) {
    const option = node('option', '', label); option.value = value; topicSelect.append(option);
  }
  const dateControl = node('div'); dateControl.append(dateLabel, dateSelect);
  const topicControl = node('div'); topicControl.append(topicLabel, topicSelect);
  const searchControl = node('div', 'update-search-control'); searchControl.append(searchLabel, searchInput);
  controls.append(dateControl, topicControl, searchControl);
  const summary = node('p', 'update-summary'); summary.setAttribute('role', 'status'); summary.setAttribute('aria-live', 'polite');
  const results = node('section', 'update-date-group'); results.setAttribute('aria-label', '選んだ日の掲載変更');
  container.append(controls, summary, results, node('p', 'hint', '日付はこのアプリの掲載内容を変更した日です。事案の発生日・企業の公表日・資料を確認した日とは異なります。新規掲載には過去の事案も含みます。'));

  function populateDates() {
    const dates = [...new Set([...allDays.map(day => day.date), ...(today ? [today] : [])])].sort().reverse();
    dateSelect.replaceChildren();
    for (const date of dates) {
      const option = node('option', '', `${date}${date === today ? '（今日）' : ''}${!allDays.some(day => day.date === date) ? ' · 掲載変更なし' : ''}`);
      option.value = date; dateSelect.append(option);
    }
    dateSelect.value = selectedDate ?? '';
    dateSelect.disabled = !dates.length;
  }

  function renderDay() {
    const day = groupUpdatesByDate(history, services, { topic: selectedTopic, query, serviceId: selectedServiceId }).find(item => item.date === selectedDate);
    summary.textContent = `${selectedDate ?? '記録なし'}${selectedDate === today ? '（今日）' : ''}：${day?.serviceCount ?? 0}企業・サービス、${day?.eventCount ?? 0}件の掲載変更`;
    results.replaceChildren();
    if (!day) {
      results.append(node('p', 'update-empty', 'この条件の掲載変更はありません。日付・テーマ・名前の絞り込みを変更して確認できます。'));
      return;
    }
    const list = node('div', 'update-service-list');
    for (const service of day.services) {
      const row = node('details', 'update-service-row'); row.dataset.updateService = service.serviceId;
      const rowHeading = node('summary', 'update-service-heading');
      rowHeading.append(node('strong', 'update-service-name', service.name));
      const badges = node('span', 'update-row-badges');
      for (const topic of service.topics) badges.append(node('span', 'update-theme', updateViewTopics[topic]));
      badges.append(node('span', 'update-kind', service.kinds.map(kind => updateViewKinds[kind]).join('・')));
      if (service.events.length > 1) badges.append(node('span', 'update-change-count', `${service.events.length}件`));
      rowHeading.append(badges);
      const detail = node('div', 'update-service-detail');
      const eventList = node('ul', 'update-event-list');
      for (const event of service.events) {
        const item = node('li', 'update-event');
        item.append(node('span', 'update-kind', updateViewKinds[event.kind]), node('h3', '', event.title), node('p', '', String(event.summary ?? '').replaceAll('この手帳', 'このアプリ')));
        const sourceList = node('ul', 'source-list');
        for (const id of event.sourceIds) {
          const source = sources[id];
          if (!source?.url || !/^https:\/\//.test(source.url)) continue;
          const sourceItem = node('li');
          const link = node('a', '', source.title ?? '公式資料');
          link.href = source.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.referrerPolicy = 'no-referrer';
          sourceItem.append(link);
          if (source.verificationNote) sourceItem.append(node('small', '', source.verificationNote));
          sourceList.append(sourceItem);
        }
        if (sourceList.childElementCount) item.append(sourceList);
        eventList.append(item);
      }
      detail.append(eventList);
      if (typeof onSelectService === 'function') {
        const openLinks = node('div', 'update-service-links');
        for (const topic of service.topics) {
          const open = node('button', 'update-service-open', `${service.name}の${topic === 'php' ? 'PHP' : '情報漏洩'}の案内を見る`);
          open.type = 'button'; open.addEventListener('click', () => onSelectService(service.serviceId, topic)); openLinks.append(open);
        }
        detail.append(openLinks);
      }
      row.append(rowHeading, detail); list.append(row);
    }
    results.append(list);
  }
  dateSelect.addEventListener('change', () => { selectedDate = dateSelect.value; renderDay(); });
  topicSelect.addEventListener('change', () => { selectedTopic = topicSelect.value; renderDay(); });
  searchInput.addEventListener('input', () => { selectedServiceId = null; query = searchInput.value; renderDay(); });
  populateDates(); renderDay();

  const appHistory = node('details', 'update-app-history');
  appHistory.append(node('summary', '', 'アプリの機能・デザインの更新'));
  appHistory.append(node('p', 'hint', '企業・サービスの掲載情報の変更とは別の記録です。'));
  const releaseList = node('ul', 'release-list');
  for (const release of [...releases].sort((a, b) => b.date.localeCompare(a.date))) {
    const item = node('li');
    const time = node('time', '', release.date); time.dateTime = release.date;
    item.append(time, node('h3', '', `v${release.version} · ${release.title}`), node('p', '', release.summary));
    if (release.changes?.length) {
      const changes = node('ul'); for (const change of release.changes) changes.append(node('li', '', change)); item.append(changes);
    }
    releaseList.append(item);
  }
  appHistory.append(releaseList); container.append(appHistory);
  const baselines = history.filter(event => event.type === 'baseline' && updateViewValidDate(event.date));
  if (baselines.length) {
    const note = node('details', 'update-baseline'); note.append(node('summary', '', '履歴の記録開始について'));
    for (const baseline of baselines) note.append(node('p', '', `${baseline.date}：${baseline.summary}`));
    container.append(note);
  }
  return { selectedDate, latestDate: allDays[0]?.date ?? null, today, todayServiceCount: todayCount };
}
