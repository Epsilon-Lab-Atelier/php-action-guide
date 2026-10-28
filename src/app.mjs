import { sources } from './catalog.mjs';
import { directoryServices, supportsTopic, servicesForTopic } from './service-directory.mjs';
import { resolveInput } from './url.mjs';
import { categoryLabels, categoryOrder, serviceGroupsForRole, groupServicesForDisplay } from './categories.mjs';
import { filterServices, categoriesForRole, relatedTopicMatches } from './discovery.mjs';
import { historyForService, updateHistory, appReleases } from './updates.mjs';
import { breachIncidents, breachSources, breachReviews } from './incidents.mjs';
import { incidentsForService, incidentMetadata } from './incident-model.mjs';
import { parseGuideHash } from './navigation.mjs';
import { riskOptionsForService, normalizeRiskSelections, personalizedRiskGuidance } from './risk-guidance.mjs';
import { renderUpdateView } from './update-view.mjs';
import { informationStatus, formatInformationTime } from './information-status.mjs';
import { WATCHLIST_KEY, readWatchlist, writeWatchlist, toggleWatchService, markWatchServiceSeen, watchServiceRevision, watchServiceRevisions, watchlistRows, renderWatchlistView } from './watchlist.mjs';

const $ = selector => document.querySelector(selector);
const allSourceRecords = {...sources, ...breachSources};
let watchStorage = null;
try { watchStorage = window.localStorage; } catch { /* Use this page's memory when browser storage is blocked. */ }
let watchState = readWatchlist(watchStorage,directoryServices);
let watchStorageAvailable = watchState.ok || watchState.status==='malformed';
const watchData = {services:directoryServices,incidents:breachIncidents,history:updateHistory,sources:allSourceRecords};
const initialGuide = parseGuideHash(location.hash, directoryServices);
const initialTopic = initialGuide?.topic === 'php' ? 'php' : 'breach';
const state = {topic:initialTopic,role:'user',view:'check',kind:'empty',service:null,hostname:null,query:'',category:'all',selections:[]};
const emptyState = $('#result').firstElementChild.cloneNode(true);
const groupLabels = categoryLabels;
const groupOrder = categoryOrder;
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = String(text).replaceAll('この手帳','このアプリ');
  return node;
}
function serviceOperatorText(service) {
  if (!service?.operator) return '';
  const aliases = service.companyAliases?.length ? `（${service.companyAliases.join(' / ')}）` : '';
  return `運営：${service.operator}${aliases}`;
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
  ids.filter(id=>allSourceRecords[id]).forEach((id, i) => row.append(officialLink(allSourceRecords[id], `公式資料${ids.length > 1 ? ` ${i + 1}` : ''}を読む`)));
  return row;
}
function includesPhp() { return state.topic === 'php'; }
function includesBreaches() { return state.topic === 'breach'; }
function selectedIncidents() { return incidentsForService(breachIncidents,state.service?.id).sort((a,b)=>(b.updatedAt ?? b.publishedAt).localeCompare(a.updatedAt ?? a.publishedAt)); }
function displayedMetadata(service) {
  const records=includesBreaches()?selectedIncidents():[];
  const phpIds=includesPhp()?[...(service.php?.sourceIds??[]),...(service.incident?.sourceIds??[]),...(service.officialAction?.sourceIds??[]),...(service.supportSourceIds??[]),...(service.domainSourceIds??[])]:[];
  const ids=[...new Set([...phpIds,...records.flatMap(record=>record.sourceIds)])];
  const history=historyForService(service.id).filter(event=>event.type==='content' && (event.incidentId?includesBreaches():includesPhp()));
  return informationStatus({sourceIds:ids,history},allSourceRecords);
}
function currentWatchRows() { return watchlistRows(watchState,watchData); }
function updateWatchNavigation() {
  const rows=currentWatchRows();
  const button=$('#nav-watchlist');button.replaceChildren(document.createTextNode('ウォッチリスト'),el('span','watch-nav-count',String(rows.length)));
  const unread=rows.filter(row=>row.unread).length;
  if(unread){const badge=el('span','watch-nav-dot');badge.setAttribute('aria-label',`${unread}件に掲載変更`);button.append(badge);}
}
function persistWatch(next) {
  const saved=writeWatchlist(watchStorage,next);watchState=saved;watchStorageAvailable=saved.ok;updateWatchNavigation();return saved.ok;
}
function setWatchButton(button,service) {
  const selected=watchState.items.some(item=>item.serviceId===service.id);
  button.textContent=selected?'ウォッチ中':'＋ ウォッチリスト';button.setAttribute('aria-pressed',String(selected));
  button.setAttribute('aria-label',`${service.name}をウォッチリスト${selected?'から外す':'に追加'}`);
}
function openOverviewService(id,topic) {
  const service=directoryServices.find(item=>item.id===id);if(!service)return;
  chooseRole(service.roles.includes('user')?'user':'admin',{renderResult:false});
  chooseTopic(topic,{renderResult:false});state.query='';state.category='all';$('#service-filter').value='';switchMode('select');
  showView('check',{updateHash:true});selectService(service);
}
function showWatchlist({focus=true}={}) {
  renderWatchlistView($('#watchlist'),{rows:currentWatchRows(),storageAvailable:watchStorageAvailable,onOpen:openOverviewService,onRemove:id=>{
    const service=directoryServices.find(item=>item.id===id);if(!service)return;
    const saved=persistWatch(toggleWatchService(watchState,id,watchServiceRevisions(service,watchData)));
    showWatchlist({focus:false});render();$('#watchlist-title').focus({preventScroll:true});
    $('#announcement').textContent=saved?`${service.name}をウォッチリストから外しました。`:'この画面では外しましたが、ブラウザに保存できませんでした。';
  },onBrowse:()=>{switchMode('select');showView('check',{focus:true,updateHash:true});$('#service-filter').focus();}});
  showView('watchlist',{focus,updateHash:true});
}
function informationSummary(dates) {
  const box=el('div','information-summary');
  const rows=el('dl','information-dates');
  const labels=[['公式情報の確認',formatInformationTime(dates.checkedAt,dates.checkedAtTime)],['掲載内容の変更',formatInformationTime(dates.lastChangedAt,dates.lastChangedAtTime)],['対応案内の変更',dates.lastActionChangedAt?formatInformationTime(dates.lastActionChangedAt,dates.lastActionChangedAtTime):'比較記録なし']];
  for(const [label,value] of labels){const item=el('div');item.append(el('dt','',label),el('dd','',value));rows.append(item);}
  box.append(rows,el('p','information-date-note','確認日時は参照資料のうち最も古いもの。朝6時・夕18時を目安に調査し、確認できた内容を順次反映します。'));
  if(dates.checkFailures.length)box.append(el('p','information-failure','今回取得できなかった資料があります。最後に本文を確認できた日時を保持しています。詳細は出典をご確認ください。'));
  return box;
}
function disclosure(label, className, ...children) {
  const panel=el('details',`disclosure-panel ${className}`);
  const body=el('div','disclosure-content');body.append(...children);
  panel.append(el('summary','',label),body);return panel;
}
function breachCasesPanel() {
  const panel=el('section','breach-cases public-summary');panel.id='breach-results';panel.append(el('h3','result-section-title','公開されている情報'));
  const records=selectedIncidents();
  if(!records.length) {
    const empty=el('section','result-card primary-action');
    empty.append(el('span','badge unknown','掲載事案なし'),el('h3','','まずは公式のお知らせを確認'),el('p','','この手帳には、紹介できる事案の記録がありません。未掲載は「被害なし」「安全」という意味ではありません。'));
    panel.append(empty);return panel;
  }
  for(const [index,record] of records.entries()) {
    const article=el('article','incident-card');article.dataset.incident=record.id;
    const meta=informationStatus(record,breachSources);
    article.append(el('p','incident-date',`${record.publishedAt} 公表${record.publishedAt<'2026-01-01'?' · 過去の事案':''}${record.updatedAt?` / 続報 ${record.updatedAt}`:''}`),el('h4','',record.title));
    article.append(el('span',`badge status-${record.status.code}`,record.status.label));
    const scope=el('div','incident-scope');scope.append(el('strong','','対象になるのは'),el('p','',record.scope));article.append(scope);
    const period=el('div','incident-period');period.append(el('strong','','対象期間'),el('p','',record.affectedPeriod||'対象期間は掲載資料から確認できません。'));article.append(period);
    const action=el('div','incident-action');action.append(el('strong','','今確認すること'),el('p','',record.officialAction.text));article.append(action);
    article.append(sourceLinks(record.sourceIds));
    const detail=el('details','incident-detail');detail.append(el('summary','','公表内容の詳細を見る'));
    const rows=el('dl','incident-fields');
    for(const [label,text] of [['公表されている状況',record.status.text],['利用・登録などの対象期間',record.affectedPeriod],['発生・検知の時期',record.occurredAt],['対象となる情報',record.dataTypes.length?record.dataTypes.join('／'):'対象となる情報の項目は未公表'],['対象外と説明される情報',record.excludedData ?? 'この記録には掲載していません。'],['事業者の対応',`${record.providerResponse.label}：${record.providerResponse.text}`],['初公表日',record.publishedAt],['掲載した最新の公式続報・追記日',record.updatedAt ?? '別の続報・追記日は未記録'],['資料を確認した日（最も古いもの）',meta.checkedAt ?? '未確認'],['この手帳の掲載変更日',meta.lastChangedAt ?? '未記録']]) rows.append(el('dt','',label),el('dd','',text));
    detail.append(rows,el('p','hint',record.caution),el('p','hint','事業者の対策が完了したことと、既に情報が流出したかどうかは別の情報です。'));
    const list=el('ul','source-list');for(const id of record.sourceIds){const source=breachSources[id];const li=el('li');li.append(officialLink(source),el('small','',`資料公表日：${source.publishedAt ?? '記載なし・未確認'} / 追記日：${source.updatedAt ?? '未記録'} / 本文確認：${formatInformationTime(source.checkedAt,source.checkedAtTime)}`));if(source.verificationNote)li.append(el('small','',source.verificationNote));for(const failure of meta.checkFailures.filter(item=>item.sourceId===id))li.append(el('small','information-failure',failure.note));list.append(li);}detail.append(list);article.append(detail);
    if(index===0)panel.append(article);
    else {
      const archived=el('details','incident-archive');archived.append(el('summary','',`${record.publishedAt.slice(0,4)}年公表 · ${record.title} — ${record.status.label}`),article);panel.append(archived);
    }
  }
  return panel;
}
function coverage(service) {
  if(state.topic==='breach'){const records=incidentsForService(breachIncidents,service.id);return {kind:records.length?'explained':'contact',label:records.length?`掲載事案 ${records.length}件`:'事案は未掲載'};}
  if (!service.incident?.sourceIds.length) return { kind:'contact', label:'PHP：確認先をご案内' };
  if (/未確認|掲載情報なし/.test(service.incident.label)) return { kind:'partial', label:'PHP：関連資料を掲載' };
  return { kind:'explained', label:'PHP：公式説明を掲載' };
}
function referencePanel(service,dates) {
  const body=el('div','service-reference-body');
  const rows=el('dl','incident-fields');
  for(const [label,value] of [['資料確認日（表示テーマの最も古い資料）',dates.checkedAt ?? '掲載情報なし'],['この手帳の掲載変更日',dates.lastChangedAt ?? '変更記録なし']])rows.append(el('dt','',label),el('dd','',value));
  body.append(rows,el('p','hint',state.hostname?`照合したドメイン：${state.hostname}。登録情報との照合であり、サイトの検査は行っていません。`:'一覧で選んだサービスの掲載情報です。個別の利用者・サイトの検査結果ではありません。'));
  if(includesBreaches()) {
    const review=breachReviews[state.service?.id];
    body.append(el('p','hint',review?`調査を試みた日：${review.attemptedAt}。${review.note}`:'このサービスの情報流出について、調査記録はまだありません。'));
    body.append(el('p','hint','掲載している事案は各公表時点の説明です。すべての事案を網羅するものではありません。'));
  }
  if(includesPhp())body.append(el('p','hint',service.caution));
  const ids=includesPhp()?[...new Set([...(service.php?.sourceIds??[]),...(service.incident?.sourceIds??[]),...(service.officialAction?.sourceIds??[]),...(service.domainSourceIds??[]),...(service.supportSourceIds??[])])]:[...new Set([...selectedIncidents().flatMap(record=>record.sourceIds),...(service.domainSourceIds??[]),...(service.supportSourceIds??[])])];
  if(ids.length){
    const list=el('ul','source-list');
    for(const id of ids){const source=allSourceRecords[id];if(!source)continue;const li=el('li');li.append(officialLink(source),el('small','',`${source.kind==='support'?'公式窓口（個別の対応状況を示す根拠ではありません）':'公式資料'} / 公開日：${source.publishedAt??'記載なし・未確認'} / 本文確認：${formatInformationTime(source.checkedAt,source.checkedAtTime)}`));if(source.verificationNote)li.append(el('small','',source.verificationNote));for(const failure of informationStatus({sourceIds:[id]},allSourceRecords).checkFailures)li.append(el('small','information-failure',failure.note));list.append(li);}
    body.append(list);
  }
  const history=el('button','text-button','このサービスの更新履歴を見る');history.type='button';history.addEventListener('click',()=>showUpdates(service.id));body.append(history);return disclosure('出典と確認日','service-reference',body);
}

function showView(view,{focus=false,updateHash=false}={}) {
  state.view=['updates','watchlist'].includes(view)?view:'check';
  for(const name of ['check','updates','watchlist']) { $(`#${name}-view`).hidden=state.view!==name;const button=$(`#nav-${name}`);button.setAttribute('aria-pressed',String(state.view===name));button.classList.toggle('active',state.view===name);}
  if(updateHash)history.replaceState(null,'',state.view==='check'?'#main':`#${state.view}`);
  if(focus){const target=state.view==='check'?$('#page-title'):$(`#${state.view}-title`);target.tabIndex=-1;target.focus({preventScroll:true});target.scrollIntoView({block:'start',behavior:'instant'});}
}
function showUpdates(serviceId=null) {
  renderUpdateView($('#updates'),{history:updateHistory,services:directoryServices,sources:allSourceRecords,releases:appReleases,initialServiceId:serviceId,onSelectService:openOverviewService});
  showView('updates',{focus:true,updateHash:true});
}
function renderPersonalized() {
  const root=$('#personalized-results');if(!root)return;
  root.replaceChildren();root.hidden=!state.selections.length;
  if(root.hidden)return;
  const guide=personalizedRiskGuidance({service:state.service,topic:state.topic,role:state.role,selections:state.selections,incidents:selectedIncidents()});
  if(guide.firstAction){const first=el('section','first-action');first.append(el('h3','','まずすること'),el('p','',guide.firstAction.text));if(guide.firstAction.sourceIds?.length)first.append(sourceLinks(guide.firstAction.sourceIds));root.append(first);}
  root.append(el('h3','risk-answer-heading',guide.heading),el('p','risk-summary',guide.intro));
  // The official action is already visible in the public summary above.
  for(const group of guide.groups.filter(group=>group.kind!=='official')) {
    const section=el('section',`risk-answer risk-answer-${group.kind}`);section.dataset.group=group.id;
    section.append(el('h4','',group.title));const list=el('ul','risk-answer-list');
    const renderItem=item=>{
      const row=el('li');if(item.title)row.append(el('strong','',item.title));
      for(const text of item.text.split('\n').filter(Boolean)) {
        const paragraph=el('p');
        const labeled=text.match(/^(登録・提出した情報と照合する項目|対象外などの説明|利用・登録の対象期間|公表対象)：(.*)$/);
        if(labeled)paragraph.append(el('strong','',labeled[1]),el('br'),document.createTextNode(labeled[2]));
        else paragraph.textContent=text;
        row.append(paragraph);
      }
      if(item.sourceIds?.length)row.append(sourceLinks(item.sourceIds));return row;
    };
    const foldRecords=state.topic==='breach'&&['official','scope'].includes(group.kind)&&group.items.length>1;
    (foldRecords?group.items.slice(0,1):group.items).forEach(item=>list.append(renderItem(item)));
    section.append(list);
    if(foldRecords){const other=el('ul','risk-answer-list');group.items.slice(1).forEach(item=>other.append(renderItem(item)));section.append(disclosure(`ほかの公表事案の案内（${group.items.length-1}件）`,'additional-risk-records',other));}
    root.append(section);
  }
}
function personalizePanel() {
  const panel=el('section','personalize-panel');panel.setAttribute('aria-labelledby','personalize-title');
  const heading=el('h3','','あなたの利用状況に合わせる');heading.id='personalize-title';
  panel.append(heading,el('p','hint',state.topic==='php'&&state.role==='admin'?'管理している環境や対応状況を選ぶと、次に必要な対応を整理します。':'あてはまるものを選ぶと、関係する情報と必要な対応を表示します。過去の利用も含めて選べます。'));
  const options=riskOptionsForService(state.service,state.topic,state.role,selectedIncidents());
  const choices=el('div','risk-options');choices.setAttribute('role','group');choices.setAttribute('aria-label','利用状況');
  for(const option of options) {
    const label=el('label','risk-option');const input=el('input');input.type='checkbox';input.value=option.id;input.dataset.riskOption=option.id;input.checked=state.selections.includes(option.id);
    const words=el('span');words.append(el('strong','',option.label));if(option.short)words.append(el('small','',option.short));
    label.classList.toggle('selected',input.checked);
    input.addEventListener('change',()=>{state.selections=normalizeRiskSelections([...choices.querySelectorAll('input:checked')].map(item=>item.value),options);label.classList.toggle('selected',input.checked);renderPersonalized();$('#announcement').textContent=state.selections.length?'利用状況に合わせた情報と対応を更新しました。':'公開情報を表示しています。';});
    label.append(input,words);choices.append(label);
  }
  const result=el('div','personalized-results');result.id='personalized-results';result.hidden=true;
  panel.append(choices,el('p','privacy-caption','選択内容は送信・保存しません。個人の被害の有無を判定するものではありません。'),result);return panel;
}
function render(focus=false) {
  document.querySelectorAll('.service-button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.id===state.service?.id)));
  const root=$('#result');root.replaceChildren();
  if(state.kind==='empty'){root.append(emptyState.cloneNode(true));return;}
  const title=el('h2','',state.service?.name??(state.kind==='invalid'?'URLを確認してください':'掲載情報が見つかりませんでした'));title.id='result-title';title.tabIndex=-1;
  const header=el('div','result-header');const block=el('div');block.append(el('p','result-kicker',includesPhp()?'PHPの問題':'情報漏洩・不正アクセス'),title);if(state.service?.operator)block.append(el('p','service-operator',serviceOperatorText(state.service)));header.append(block,el('span','role-label',state.role==='admin'?'管理者向け':'利用者向け'));root.append(header);
  if(state.service){const button=el('button','watch-toggle');button.type='button';setWatchButton(button,state.service);button.addEventListener('click',()=>{
    const service=state.service;const saved=persistWatch(toggleWatchService(watchState,service.id,watchServiceRevisions(service,watchData)));setWatchButton(button,service);
    $('#announcement').textContent=saved?`${service.name}のウォッチリストを更新しました。`:'ブラウザに保存できないため、このページを開いている間だけ保持します。';
    const prior=$('#watch-save-note');if(prior)prior.remove();if(!saved){const note=el('p','notice','ブラウザに保存できません。このページを開いている間だけウォッチできます。');note.id='watch-save-note';header.after(note);}
  });header.append(button);}
  const back=el('button','back-to-finder','← サービスを選び直す');back.type='button';back.addEventListener('click',()=>{$('#finder').focus();$('#finder').scrollIntoView({block:'start',behavior:'instant'});});root.prepend(back);
  if(!state.service) {
    root.append(el('p','notice',state.kind==='invalid'?'入力の形式を確認してください。サービス名からも探せます。':'登録済みの公開情報はありません。未掲載は「被害なし」を意味しません。公式アプリや、いつも使うブックマークから運営元のお知らせを確認してください。'));
    if(state.hostname)root.append(el('p','hint',`照合したドメイン：${state.hostname}`));
  } else {
    const service=state.service;
    if(includesBreaches())root.append(breachCasesPanel());
    else {
      const action=el('section','result-card public-summary');action.append(el('h3','result-section-title','公開されている情報'),el('span',`badge${service.incident?.sourceIds.length?'':' unknown'}`,service.incident?.label??'未確認'),el('p','',service.incident?.text??'掲載資料から判断できません。'));
      const next=el('div','incident-action');next.append(el('strong','','公式に案内されている対応'),el('p','',service.officialAction?.text??'公式の案内を確認してください。'));action.append(next,sourceLinks(service.officialAction?.sourceIds??[]));
      const facts=el('div','service-facts');facts.append(el('h4','','PHPの利用について'),el('p','',service.php?.text??'未確認'),sourceLinks(service.php?.sourceIds??[]));
      action.append(disclosure('PHPの利用・公式説明の詳細','php-facts',facts));root.append(action);
    }
    root.append(informationSummary(displayedMetadata(service)),personalizePanel());renderPersonalized();root.append(referencePanel(service,displayedMetadata(service)));
  }
  if(focus){title.focus({preventScroll:true});if(window.matchMedia('(max-width: 800px)').matches||title.getBoundingClientRect().top<0)root.scrollIntoView({block:'start',behavior:'instant'});}
  $('#announcement').textContent=state.service?`${state.service.name}の公開情報を表示しました。利用状況を選ぶと必要な対応を絞り込めます。`:title.textContent;
}
function selectService(service,hostname=null,{focus=true}={}) {
  if(service&&!service.roles.includes(state.role))chooseRole(service.roles.includes('user')?'user':'admin',{renderResult:false});
  Object.assign(state,{service,hostname,kind:service?'found':'unknown',selections:[]});$('#url-error').hidden=true;$('#url-input').removeAttribute('aria-invalid');render(focus);
  if(service&&watchState.items.some(item=>item.serviceId===service.id))persistWatch(markWatchServiceSeen(watchState,service.id,watchServiceRevision(service,watchData,state.topic),state.topic));
}
function updateFinderLabels() {
  $('#finder-title').textContent=state.role==='admin'?'管理する環境を探す':'サービスを探す';
  $('#role-list-hint').textContent=state.role==='admin'?'契約先のサーバーやCMSを選んでください。':'サービス名・企業名と、サービスの種類を組み合わせて探せます。';
  $('#service-filter').placeholder=state.role==='admin'?'例：さくら、WordPress':includesPhp()?'例：note、WordPress.com':'例：GMO、お名前.com';
}
function chooseRole(role,{renderResult=true,preserveQuery=false}={}) {
  if(!['user','admin'].includes(role))return;
  state.role=role;if(!preserveQuery)state.query='';state.category='all';state.selections=[];$('#service-filter').value=state.query;
  if(state.service&&!state.service.roles.includes(role))Object.assign(state,{service:null,hostname:null,kind:'empty'});
  document.querySelectorAll('[data-role]').forEach(button=>{button.classList.toggle('active',button.dataset.role===role);button.setAttribute('aria-pressed',String(button.dataset.role===role));});
  updateFinderLabels();
  renderServiceList();if(renderResult)render();
}
function switchMode(mode) {
  const list=mode==='select';$('#list-panel').hidden=!list;$('#url-panel').hidden=list;
  for(const [id,active] of [['#select-mode',list],['#url-mode',!list]]){$(id).setAttribute('aria-pressed',String(active));$(id).classList.toggle('active',active);}
  if(!list)$('#url-input').focus();
}
function searchUrl() {
  const result=resolveInput($('#url-input').value,servicesForTopic(state.topic));
  if(!result.ok){Object.assign(state,{kind:'invalid',service:null,hostname:null,selections:[]});render();$('#url-error').textContent=result.error;$('#url-error').hidden=false;$('#url-input').setAttribute('aria-invalid','true');$('#url-input').focus();return;}
  $('#url-input').value=result.hostname;selectService(result.service,result.hostname);
}
function updateTopicDates() {
  const records=includesPhp()?Object.values(sources):Object.values(breachSources);
  const oldest=records.map(source=>source.checkedAt).filter(Boolean).sort()[0];
  const stale=oldest&&Date.now()-Date.parse(`${oldest}T00:00:00+09:00`)>=7*86400000;
  $('#stale-notice').hidden=!stale;
  if(stale)$('#stale-notice').textContent=`確認から7日以上経過した資料があります。最新状況は各公式ページでご確認ください。`;
  const note=$('.update-note');if(note)note.textContent=`掲載内容の最終更新 ${updateHistory.filter(event=>event.type==='content').map(event=>event.date).sort().at(-1)??'未記録'}`;
}
function chooseTopic(topic,{renderResult=true,preserveQuery=false}={}) {
  state.topic=topic==='php'?'php':'breach';state.selections=[];if(!preserveQuery)state.query='';state.category='all';$('#service-filter').value=state.query;document.body.dataset.topic=state.topic;
  if(state.service&&!supportsTopic(state.service,state.topic))Object.assign(state,{kind:'empty',service:null,hostname:null});
  document.querySelectorAll('button[data-topic]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.topic===state.topic)));
  $('#issue').hidden=!includesPhp();
  updateFinderLabels();
  renderServiceList();updateTopicDates();if(renderResult){render();if(state.view==='check'&&state.service&&watchState.items.some(item=>item.serviceId===state.service.id))persistWatch(markWatchServiceSeen(watchState,state.service.id,watchServiceRevision(state.service,watchData,state.topic),state.topic));}
}
function applyGuideSelection(selection,{focus=false}={}) {
  if(!selection)return;
  showView('check');
  if(!selection.serviceId){chooseTopic(selection.topic);return;}
  const service=directoryServices.find(item=>item.id===selection.serviceId);if(!service)return;
  chooseRole(selection.role,{renderResult:false});switchMode('select');
  const requestedTopic=selection.topic==='php'?'php':'breach';chooseTopic(supportsTopic(service,requestedTopic)?requestedTopic:service.topics[0],{renderResult:false});selectService(service,null,{focus});
}
$('#service-filter').addEventListener('input',()=>{state.query=$('#service-filter').value;renderServiceList();});
$('#clear-filter').addEventListener('click',()=>{state.query='';$('#service-filter').value='';renderServiceList();$('#service-filter').focus();});
$('#service-category').addEventListener('change',()=>{state.category=$('#service-category').value;renderServiceList();});
$('#reset-filters').addEventListener('click',()=>{state.query='';state.category='all';$('#service-filter').value='';renderServiceList();$('#service-filter').focus();});
document.querySelectorAll('[data-role]').forEach(button=>button.addEventListener('click',()=>chooseRole(button.dataset.role,{preserveQuery:true})));
document.querySelectorAll('button[data-topic]').forEach(button=>button.addEventListener('click',()=>chooseTopic(button.dataset.topic,{preserveQuery:true})));
$('#select-mode').addEventListener('click',()=>switchMode('select'));$('#url-mode').addEventListener('click',()=>switchMode('url'));
$('#unknown-button').addEventListener('click',()=>selectService(null));$('#url-search-button').addEventListener('click',searchUrl);
$('#url-input').addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.isComposing){event.preventDefault();searchUrl();}});
$('#nav-check').addEventListener('click',()=>showView('check',{focus:true,updateHash:true}));$('#nav-updates').addEventListener('click',()=>showUpdates());
$('#nav-watchlist').addEventListener('click',()=>showWatchlist());
window.addEventListener('storage',event=>{if(event.key!==WATCHLIST_KEY&&event.key!==null)return;watchState=readWatchlist(watchStorage,directoryServices);watchStorageAvailable=watchState.ok||watchState.status==='malformed';updateWatchNavigation();if(state.view==='watchlist')showWatchlist({focus:false});else if(state.service)render();});
window.addEventListener('hashchange',()=>{if(location.hash==='#updates')showUpdates();else if(location.hash==='#watchlist')showWatchlist();else {showView('check');applyGuideSelection(parseGuideHash(location.hash,directoryServices),{focus:true});if(['#about','#main','#finder'].includes(location.hash))$(location.hash)?.scrollIntoView({block:'start',behavior:'instant'});}});
chooseTopic(initialTopic);applyGuideSelection(initialGuide,{focus:!!initialGuide?.serviceId});
updateWatchNavigation();
if(location.hash==='#updates')showUpdates();
else if(location.hash==='#watchlist')showWatchlist();
function renderServiceList() {
  const topicServices=servicesForTopic(state.topic);
  const available = topicServices.filter(service => service.roles.includes(state.role));
  const knownGroups = categoriesForRole(topicServices, state.role);
  const groups = groupOrder[state.role].filter(id => knownGroups.includes(id));
  if(state.category!=='all'&&!groups.includes(state.category))state.category='all';
  const visible = filterServices(topicServices, state);
  const queryMatches = filterServices(topicServices, {...state,category:'all'});
  const select = $('#service-category');
  const categoryIds = ['all',...groups];
  if([...select.options].map(option=>option.value).join('|')!==categoryIds.join('|')) {
    select.replaceChildren(...categoryIds.map(group=>{const option=el('option');option.value=group;return option;}));
  }
  for (const option of select.options) {
    const group=option.value;
    const count=group==='all'?queryMatches.length:queryMatches.filter(service=>serviceGroupsForRole(service,state.role).includes(group)).length;
    option.textContent=`${group==='all'?'すべて':(groupLabels[group]??group)}（${count}件）`;
  }
  select.value=state.category;
  const related=relatedTopicMatches(directoryServices,state);
  const relatedCount=related.reduce((count,match)=>count+match.services.length,0);
  $('#list-count').textContent = `${state.role === 'user' ? '利用者向け' : '管理者向け'} ${available.length}件のうち ${visible.length}件を表示${relatedCount?` · 別のテーマに${relatedCount}件`:''}`;
  $('#clear-filter').hidden = !state.query;
  $('#reset-filters').hidden = !state.query&&state.category==='all';
  renderRelatedTopics(related);
  const list = $('#service-list'); list.replaceChildren();
  for (const {id:group,services:matches} of groupServicesForDisplay(visible,state)) {
    const section = el('section', 'service-group');
    section.append(el('h3','service-group-title',`${groupLabels[group]??group} (${matches.length})`));
    const grid = el('div','service-grid');
    for (const service of matches) {
      const button = el('button','service-button'); button.type = 'button';
      button.dataset.id = service.id; button.setAttribute('aria-pressed',String(service.id === state.service?.id));
      const initial = el('span','service-initial',service.id === 'wordpress-selfhost' ? 'W' : service.name.charAt(0)); initial.setAttribute('aria-hidden','true');
      const text = el('span'); text.append(el('strong','',service.name));
      if(service.operator)text.append(el('small','service-operator',serviceOperatorText(service)));
      text.append(el('small','',service.short));
      const info=coverage(service); text.append(el('small',`evidence-label ${info.kind}`,info.label));
      const chevron = el('span','chevron','›'); chevron.setAttribute('aria-hidden','true');
      button.append(initial,text,chevron); button.addEventListener('click',()=>selectService(service));
      grid.append(button);
    }
    section.append(grid); list.append(section);
  }
  if (!visible.length) {
    const empty = el('div','filter-empty');
    empty.append(el('p','','この条件に一致する項目はありません。サービス名・企業名の一部で探すか、サービスの種類を「すべて」に戻してください。'),el('p','filter-empty-note','未掲載は「被害なし」を意味しません。'));
    list.append(empty);
  }
}
function renderRelatedTopics(matches) {
  const panel=$('#related-topics');panel.replaceChildren();panel.hidden=!matches.length;
  if(!matches.length)return;
  panel.append(el('p','related-topics-title','別のテーマに掲載があります'));
  for(const match of matches) {
    const topicLabel=match.topic==='php'?'PHPの問題':'情報漏洩・不正アクセス';
    const roleLabel=match.role==='user'?'利用者向け':'管理者向け';
    const button=el('button','related-topic-button',`${topicLabel} · ${roleLabel}（${match.services.length}件）を見る`);
    button.type='button';
    button.addEventListener('click',()=>{
      Object.assign(state,{kind:'empty',service:null,hostname:null,selections:[]});
      chooseRole(match.role,{renderResult:false,preserveQuery:true});
      chooseTopic(match.topic,{renderResult:false,preserveQuery:true});
      switchMode('select');render();
      $('#service-list .service-button')?.focus();
      $('#announcement').textContent=`検索語を保ったまま、${topicLabel}の${roleLabel}に切り替えました。サービスの種類は「すべて」です。`;
    });
    panel.append(button);
  }
}
