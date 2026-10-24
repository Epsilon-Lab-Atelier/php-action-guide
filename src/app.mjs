import { services, sources, checkedAt } from './catalog.mjs';
import { resolveInput } from './url.mjs';

const $ = (selector) => document.querySelector(selector);
const state = { role: 'user', kind: 'empty', service: null, hostname: null };
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
  if (state.kind === 'empty') return;
  const root = $('#result');
  root.replaceChildren();
  const service = state.service ?? fallback;
  const header = el('div', 'result-header');
  const titleBlock = el('div');
  titleBlock.append(el('p', 'result-kicker', '3  確認結果と、あなたの次の一歩'));
  const title = el('h2', '', state.kind === 'invalid' ? 'URLを確認してください' : service.name);
  title.id = 'result-title'; title.tabIndex = -1;
  titleBlock.append(title);
  if (state.hostname) titleBlock.append(el('p', 'hint', `照合したドメイン: ${state.hostname}`));
  else if (state.kind !== 'invalid') titleBlock.append(el('p', 'hint', state.service ? '一覧で選んだ項目の情報です。個別サイトの検査結果ではありません。' : '登録情報からは判断できません。'));
  titleBlock.append(el('p', 'hint', `情報確認日: ${checkedAt} / 最新状況は公式ページへ`));
  header.append(titleBlock, el('span', 'role-label', state.role === 'user' ? 'サービス利用者向け' : 'サイト管理者向け'));
  root.append(header);
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
  action.append(heading, el('p', 'action-subtitle', '掲載した公式資料にある利用者向けの案内'), el('p', 'official-action', service.officialAction.text));
  if (service.officialAction.sourceIds.length) action.append(sourceLinks(service.officialAction.sourceIds));
  action.append(el('p', 'action-subtitle', 'EpsilonLabからの確認の手順 / チェックして整理できます'));
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
  if (state.service) {
    const ids = [...new Set([...service.php.sourceIds, ...service.incident.sourceIds, ...service.officialAction.sourceIds])];
    // Include separate domain-registration evidence where available.
    if (service.id === 'wordpress-com') ids.push('wordpressComDomains');
    if (service.id === 'booth') ids.push('boothDomains');
    const details = el('details','source-details');
    details.append(el('summary','',`根拠となる公式資料と確認日 (${ids.length}件)`));
    const sourceList = el('ul','source-list');
    ids.forEach(id => {
      const source = sources[id]; const li = el('li');
      li.append(officialLink(source), el('small','',`公開日: ${source.publishedAt ?? '記載なし・未確認'} / 情報確認日: ${source.checkedAt}`));
      sourceList.append(li);
    });
    details.append(sourceList); root.append(details);
  }
  $('#announcement').textContent = `${service.name}の情報を、${state.role === 'user' ? 'サービス利用者' : 'サイト管理者'}向けに表示しました。`;
  if (focus) {
    title.focus({ preventScroll: true });
    const titleBounds = title.getBoundingClientRect();
    if (window.matchMedia('(max-width: 680px)').matches || titleBounds.top < 0 || titleBounds.bottom > window.innerHeight) root.scrollIntoView({ behavior: 'instant', block: 'start' });
  }
}
function selectService(service, hostname = null) {
  Object.assign(state, { service, hostname, kind: service ? 'found' : 'unknown' });
  $('#url-error').hidden = true; $('#url-input').removeAttribute('aria-invalid');
  render(true);
}
services.forEach(service => {
  const button = el('button','service-button'); button.type = 'button';
  button.dataset.id = service.id; button.setAttribute('aria-pressed','false');
  const initial = el('span','service-initial',service.id === 'wordpress-selfhost' ? 'W' : service.name.charAt(0)); initial.setAttribute('aria-hidden','true');
  const text = el('span'); text.append(el('strong','',service.name),el('small','',service.short));
  const chevron = el('span','chevron','›'); chevron.setAttribute('aria-hidden','true');
  button.append(initial,text,chevron); button.addEventListener('click',()=>selectService(service));
  $('#service-list').append(button);
});
document.querySelectorAll('[data-role]').forEach(button => button.addEventListener('click',()=>{
  state.role = button.dataset.role;
  document.querySelectorAll('[data-role]').forEach(other=>{
    const active = other === button; other.classList.toggle('active',active); other.setAttribute('aria-pressed',String(active));
  });
  render();
}));
function switchMode(mode) {
  const showList = mode === 'select';
  $('#list-panel').hidden = !showList; $('#url-panel').hidden = showList;
  for (const [id, active] of [['#select-mode',showList],['#url-mode',!showList]]) { $(id).classList.toggle('active',active); $(id).setAttribute('aria-pressed',String(active)); }
  if (!showList) $('#url-input').focus();
}
$('#select-mode').addEventListener('click',()=>switchMode('select'));
$('#url-mode').addEventListener('click',()=>switchMode('url'));
$('#unknown-button').addEventListener('click',()=>selectService(null));
$('#url-form').addEventListener('submit', event => {
  event.preventDefault();
  const result = resolveInput($('#url-input').value,services);
  if (!result.ok) {
    Object.assign(state,{kind:'invalid',service:null,hostname:null}); render();
    $('#url-error').textContent = result.error; $('#url-error').hidden = false;
    $('#url-input').setAttribute('aria-invalid','true'); $('#url-input').focus();
    return;
  }
  $('#url-input').value = result.hostname; // Drop path, queries and fragments immediately.
  selectService(result.service,result.hostname);
});
// The catalog is a dated snapshot. Do not silently present it as live information.
const catalogAge = Date.now() - Date.parse(`${checkedAt}T00:00:00+09:00`);
if (catalogAge >= 7 * 86400000) {
  $('#stale-notice').textContent = `掲載情報の確認から7日以上経過しています (${checkedAt}確認)。その後に状況が変わっている可能性があります。必ず公式ページの最新情報を確認してください。`;
  $('#stale-notice').hidden = false;
}
