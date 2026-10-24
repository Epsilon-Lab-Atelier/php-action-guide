import { services, sources, checkedAt } from './catalog.mjs';
import { resolveInput } from './url.mjs';
import { filterServices, categoriesForRole } from './discovery.mjs';

const $ = (selector) => document.querySelector(selector);
const state = { role: 'user', kind: 'empty', service: null, hostname: null, query: '', category: 'all' };
const emptyState = $('#result').firstElementChild.cloneNode(true);
const groupLabels = { shopping:'買い物・フリマ', social:'SNS・動画・作品', publishing:'ブログ・投稿サービス', cms:'自分で設置するCMS', hosting:'レンタルサーバー', server:'VPS・自分で管理するサーバー', commerce:'ショップ運営サービス' };
const groupOrder = { user:['shopping','publishing','social'], admin:['cms','hosting','server','commerce','publishing'] };
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function officialLink(source, text = source.title) {
  const link = el('a', '', text);
  link.href = source.url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.referrerPolicy = 'no-referrer';
  return link;
}
function sourceLinks(ids) {
  const row = el('div', 'inline-sources');
  ids.forEach((id, i) => row.append(officialLink(sources[id], `公式資料${ids.length > 1 ? ` ${i + 1}` : ''}を読む`)));
  return row;
}
function card(number, title, info) {
  const section = el('section', 'result-card');
  const heading = el('div', 'card-title');
  heading.append(el('span', '', number), el('h3', '', title));
  section.append(heading, el('span', `badge${info.label.includes('未確認') || info.label.includes('掲載情報なし') ? ' unknown' : ''}`, info.label), el('p', '', info.text));
  if (info.sourceIds.length) section.append(sourceLinks(info.sourceIds));
  return section;
}
const fallback = {
  name: '掲載情報なし',
  php: { label: '未確認', text: 'PHPを使っているかどうかは確認できません。このアプリに登録がないことから、PHP不使用とは判断できません。', sourceIds: [] },
  incident: { label: '未確認', text: '今回の問題について、紹介できる公式情報が登録されていません。未登録でも、運営元がお知らせを出している場合があります。', sourceIds: [] },
  officialAction: { text: 'このアプリの掲載情報だけでは、利用者に必要な手続きは未確認です。運営元の公式案内で確認してください。', sourceIds: [] },
  actions: {
    user: ['ブックマークや公式アプリから、運営元のお知らせを確認する。', '対象となるサービス・利用者と、求められている手続きを確認する。', '説明が見つからない場合は、公式の問い合わせ窓口で確認する。'],
    admin: ['PHPを使っているかと、誰が管理しているかを契約先や保守担当者に確認する。', 'PHPを使う場合は、今回の修正と10月23日の追加案内について、対応状況を確認する。', '自分で管理している環境は、PHP・OS提供元の案内に沿って修正し、適用状況とサイトの動作を確認する。']
  },
  caution: '掲載情報なしは「安全」「対応不要」という意味ではありません。独自ドメインなど、実際には掲載サービスを利用していても一致しない場合があります。'
};
function render(focus = false) {
  document.querySelectorAll('.service-button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.id === state.service?.id)));
  const root = $('#result');
  if (state.kind === 'empty') {
    root.replaceChildren(emptyState.cloneNode(true));
    $('#result-title').textContent = state.role === 'user' ? 'まずは、サービスを選びましょう。' : '管理する環境を選びましょう。';
    return;
  }
  root.replaceChildren();
  const service = state.service ?? fallback;
  const header = el('div', 'result-header');
  const titleBlock = el('div');
  titleBlock.append(el('p', 'result-kicker', '3  確認結果と、次の一歩'));
  const title = el('h2', '', state.kind === 'invalid' ? 'URLを確認してください' : service.name);
  title.id = 'result-title'; title.tabIndex = -1;
  titleBlock.append(title);
  if (state.hostname) titleBlock.append(el('p', 'hint', `照合したドメイン: ${state.hostname}`));
  else if (state.kind !== 'invalid') titleBlock.append(el('p', 'hint', state.service ? '一覧で選んだ項目の情報です。個別サイトの検査結果ではありません。' : '登録情報からは判断できません。'));
  titleBlock.append(el('p', 'hint', `情報確認日: ${checkedAt} / 最新状況は公式ページへ`));
  header.append(titleBlock, el('span', 'role-label', state.role === 'user' ? 'サービス利用者向け' : 'サイト管理者向け'));
  root.append(header);
  const back = el('a', 'back-to-finder', '← 条件を選び直す');
  back.href = '#finder'; root.prepend(back);
  if (state.service && !state.service.roles.includes(state.role)) {
    root.append(el('p','notice',`この登録は主に${state.service.roles.includes('admin') ? '管理者' : 'サービス利用者'}向けです。ここでは、現在選んでいる立場の確認手順を表示します。`));
  }
  if (state.kind === 'invalid') {
    root.append(el('p','notice','入力の形式を確認して、もう一度検索してください。直前のサービスの情報は表示していません。URLがわからない場合は、一覧から選べます。'));
    $('#announcement').textContent = 'URLの形式を確認してください。';
    return;
  }
  root.append(card('01', 'PHPの利用について分かっていること', service.php));
  root.append(card('02', '対象となる問題についての公式説明', service.incident));
  const action = el('section', 'result-card action-card');
  const heading = el('div', 'card-title');
  heading.append(el('span', '', '03'), el('h3', '', state.role === 'user' ? 'あなたが確認すること' : '管理者が確認すること'));
  action.append(heading, el('p', 'action-subtitle', service.officialAction.sourceIds.length ? '今回の問題について公式資料にある案内' : '今回の問題に関する対応指示は未確認'), el('p', 'official-action', service.officialAction.text));
  if (service.officialAction.sourceIds.length) action.append(sourceLinks(service.officialAction.sourceIds));
  action.append(el('p', 'action-subtitle', 'EpsilonLabからの確認手順。確認できた項目にチェックを付けましょう。'));
  const list = el('ul', 'checklist');
  const tasks = service.actions[state.role];
  const progress = el('p', 'progress-note', `0 / ${tasks.length} 項目を確認。サービスや立場を選び直すとチェックはリセットされます。`);
  progress.setAttribute('aria-live', 'polite');
  tasks.forEach((task) => {
    const row = el('li'); const label = el('label'); const checkbox = el('input');
    checkbox.type = 'checkbox';
    checkbox.addEventListener('change', () => {
      const count = list.querySelectorAll('input:checked').length;
      progress.textContent = `${count} / ${tasks.length} 項目を確認。チェックは修正完了や安全性の判定ではありません。`;
    });
    label.append(checkbox, el('span','',task)); row.append(label); list.append(row);
  });
  action.append(list, progress);
  if (state.role === 'admin') {
    const link = el('a','','対象の問題とPHP公式の更新・追加案内を確認する');
    link.href = '#issue'; link.className = 'inline-sources';
    link.addEventListener('click',()=> { $('#issue details').open = true; });
    action.append(link);
  }
  root.append(action, el('p','notice',service.caution));
  if (service.supportSourceIds?.length) {
    const support = el('section','support-panel');
    support.append(el('h3','','最新のお知らせ・問い合わせの確認先'), el('p','hint','公式の確認窓口です。このリンク自体はPHPの利用や修正済みを示す根拠ではありません。'));
    for (const id of service.supportSourceIds) support.append(officialLink(sources[id]));
    root.append(support);
  }
  if (state.service) {
    const ids = [...new Set([...service.php.sourceIds, ...service.incident.sourceIds, ...service.officialAction.sourceIds, ...(service.domainSourceIds ?? []), ...(service.supportSourceIds ?? [])])];
    const details = el('details','source-details');
    details.append(el('summary','',`公式資料・確認窓口と確認日 (${ids.length}件)`));
    const sourceList = el('ul','source-list');
    ids.forEach(id => {
      const source = sources[id]; const li = el('li');
      li.append(officialLink(source), el('small','',`${source.kind === 'support' ? '公式窓口 (PHP対応の根拠ではありません)' : '公式資料'} / 公開日: ${source.publishedAt ?? '記載なし・未確認'} / 確認日: ${source.checkedAt}`));
      sourceList.append(li);
    });
    details.append(sourceList); root.append(details);
  }
  $('#announcement').textContent = `${service.name}の情報を、${state.role === 'user' ? 'サービス利用者' : 'サイト管理者'}向けに表示しました。`;
  if (focus) {
    title.focus({ preventScroll: true });
    const titleBounds = title.getBoundingClientRect();
    if (window.matchMedia('(max-width: 800px)').matches || titleBounds.top < 0 || titleBounds.bottom > window.innerHeight) root.scrollIntoView({ behavior: 'instant', block: 'start' });
  }
}
function selectService(service, hostname = null) {
  Object.assign(state, { service, hostname, kind: service ? 'found' : 'unknown' });
  $('#url-error').hidden = true; $('#url-input').removeAttribute('aria-invalid');
  render(true);
}
function renderServiceList() {
  const available = services.filter(service => service.roles.includes(state.role));
  const visible = filterServices(services, state);
  const knownGroups = categoriesForRole(services, state.role);
  const groups = groupOrder[state.role].filter(id => knownGroups.includes(id));
  $('#category-filters').replaceChildren();
  for (const group of ['all', ...groups]) {
    const count = group === 'all' ? available.length : available.filter(service => service.groupByRole[state.role] === group).length;
    const button = el('button', 'category-button', `${group === 'all' ? 'すべて' : groupLabels[group]} ${count}`);
    button.type = 'button'; button.dataset.category = group;
    button.setAttribute('aria-pressed', String(state.category === group));
    button.addEventListener('click',()=>{ state.category = group; renderServiceList(); document.querySelector(`[data-category="${group}"]`).focus(); });
    $('#category-filters').append(button);
  }
  $('#list-count').textContent = `${state.role === 'user' ? '利用者向け' : '管理者向け'} ${available.length}件のうち ${visible.length}件を表示`;
  $('#clear-filter').hidden = !state.query;
  const list = $('#service-list'); list.replaceChildren();
  for (const group of groups) {
    const matches = visible.filter(service => service.groupByRole[state.role] === group);
    if (!matches.length) continue;
    const section = el('section', 'service-group');
    section.append(el('h3','service-group-title',`${groupLabels[group]} (${matches.length})`));
    const grid = el('div','service-grid');
    for (const service of matches) {
      const button = el('button','service-button'); button.type = 'button';
      button.dataset.id = service.id; button.setAttribute('aria-pressed',String(service.id === state.service?.id));
      const initial = el('span','service-initial',service.id === 'wordpress-selfhost' ? 'W' : service.name.charAt(0)); initial.setAttribute('aria-hidden','true');
      const text = el('span'); text.append(el('strong','',service.name),el('small','',service.short));
      const chevron = el('span','chevron','›'); chevron.setAttribute('aria-hidden','true');
      button.append(initial,text,chevron); button.addEventListener('click',()=>selectService(service));
      grid.append(button);
    }
    section.append(grid); list.append(section);
  }
  if (!visible.length) {
    const empty = el('div','filter-empty');
    empty.append(el('p','','一致する項目はありません。名前の一部で探すか、用途の絞り込みを変更してください。'));
    const reset = el('button','text-button','絞り込みを解除する'); reset.type='button';
    reset.addEventListener('click',()=>{ state.query='';state.category='all';$('#service-filter').value='';renderServiceList();$('#service-filter').focus(); });
    empty.append(reset);list.append(empty);
  }
}
$('#service-filter').addEventListener('input',()=>{state.query=$('#service-filter').value;renderServiceList();});
$('#clear-filter').addEventListener('click',()=>{state.query='';$('#service-filter').value='';renderServiceList();$('#service-filter').focus();});
document.querySelectorAll('[data-role]').forEach(button => button.addEventListener('click',()=>{
  if (state.role === button.dataset.role) return;
  state.role = button.dataset.role; state.category='all';state.query='';$('#service-filter').value='';
  const selectionCleared = state.service && !state.service.roles.includes(state.role);
  if (selectionCleared) Object.assign(state,{kind:'empty',service:null,hostname:null});
  document.querySelectorAll('[data-role]').forEach(other=>{
    const active = other === button; other.classList.toggle('active',active); other.setAttribute('aria-pressed',String(active));
  });
  $('#finder-title').textContent = state.role === 'user' ? '利用するサービスを探す' : '管理する環境を探す';
  $('#role-list-hint').textContent = state.role === 'user' ? '使っているサービスを、名前や用途から探せます。' : '契約中のサーバー、CMS、ショップなどを選んでください。';
  $('#service-filter').placeholder = state.role === 'user' ? '例: アマゾン、note' : '例: さくら、WordPress';
  renderServiceList(); render();
  if (selectionCleared) $('#announcement').textContent='立場に合わせて一覧を切り替えました。対象を選び直してください。';
}));
renderServiceList();
function switchMode(mode) {
  const showList = mode === 'select';
  $('#list-panel').hidden = !showList; $('#url-panel').hidden = showList;
  for (const [id, active] of [['#select-mode',showList],['#url-mode',!showList]]) { $(id).classList.toggle('active',active); $(id).setAttribute('aria-pressed',String(active)); }
  if (!showList) $('#url-input').focus();
}
$('#select-mode').addEventListener('click',()=>switchMode('select'));
$('#url-mode').addEventListener('click',()=>switchMode('url'));
$('#unknown-button').addEventListener('click',()=>selectService(null));
function searchUrl() {
  const result = resolveInput($('#url-input').value,services);
  if (!result.ok) {
    Object.assign(state,{kind:'invalid',service:null,hostname:null}); render();
    $('#url-error').textContent = result.error; $('#url-error').hidden = false;
    $('#url-input').setAttribute('aria-invalid','true'); $('#url-input').focus();
    return;
  }
  $('#url-input').value = result.hostname; // Drop path, queries and fragments immediately.
  selectService(result.service,result.hostname);
}
// Search is local UI work, not a form submission. Preview frames can forbid forms.
$('#url-search-button').addEventListener('click', searchUrl);
$('#url-input').addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.isComposing) {
    event.preventDefault();
    searchUrl();
  }
});
// The catalog is a dated snapshot. Do not silently present it as live information.
const catalogAge = Date.now() - Date.parse(`${checkedAt}T00:00:00+09:00`);
if (catalogAge >= 7 * 86400000) {
  $('#stale-notice').textContent = `掲載情報の確認から7日以上経過しています (${checkedAt}確認)。その後に状況が変わっている可能性があります。必ず公式ページの最新情報を確認してください。`;
  $('#stale-notice').hidden = false;
}
