import { services, sources, checkedAt } from './catalog.mjs';
import { resolveInput } from './url.mjs';
import { filterServices, categoriesForRole } from './discovery.mjs';
import { usageOptionsForService, normalizeServiceUsage, guidanceForServiceUsage, usageScopeForService } from './usage-profiles.mjs';
import { metadataForService, metadataForCatalog, historyForService, updateHistory, appReleases } from './updates.mjs';
import { createMemoText, memoFilename } from './memo.mjs';
import { breachIncidents, breachSources, breachReviews } from './incidents.mjs';
import { incidentsForService, incidentMetadata, breachContextOptions, normalizeBreachContext, breachGuidance } from './incident-model.mjs';
import { snapshotSessionProgress, rememberSessionProgress, restoreSessionProgress, resetSessionChecks } from './session.mjs';
import { parseGuideHash, buildGuideLink } from './navigation.mjs';
import { SAVED_SERVICES_KEY, readSavedServices, saveSavedService, removeSavedService, clearSavedServices, savedServiceRevision } from './saved-services.mjs';

const $ = (selector) => document.querySelector(selector);
const allSourceRecords={...sources,...breachSources};
const initialGuide = parseGuideHash(location.hash, services);
const initialTopic = initialGuide?.topic ?? 'all';
const state = { topic:initialTopic, breachContext:[], checkedBreachTasks:new Set(), role: 'user', kind: 'empty', service: null, hostname: null, query: '', category: 'all', usage: [], checkedTasks: new Set() };
let pageSessionProgress = new Map();
const publicGuideUrl = 'https://epsilon-lab-atelier.github.io/php-action-guide/';
// Lazy access lets storage-denied browsers keep using the rest of the notebook.
const serviceDeviceStorage = {
  getItem: key => window.localStorage.getItem(key),
  setItem: (key,value) => window.localStorage.setItem(key,value),
  removeItem: key => window.localStorage.removeItem(key)
};
let savedServiceState = readSavedServices(serviceDeviceStorage, services);
const contentRevisions = new Map();
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
  ids.forEach((id, i) => row.append(officialLink(allSourceRecords[id], `公式資料${ids.length > 1 ? ` ${i + 1}` : ''}を読む`)));
  return row;
}
function lineIcon(name) {
  const paths = {
    key: ['M14 4a6 6 0 1 1-4.8 9.6L3 20v-4l5.4-5.2A6 6 0 0 1 14 4Z', 'M15 8h.01'],
    book: ['M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Z', 'M12 6v14'],
    bag: ['M5 7h14l1 14H4L5 7Z', 'M8 8V6a4 4 0 0 1 8 0v2'],
    pen: ['m15 4 5 5-10 10-6 1 1-6L15 4Z', 'm12 7 5 5', 'm5 15 4 4'],
    shop: ['M3 10h18l-2-6H5l-2 6Z', 'M5 10v11h14V10', 'M9 21v-7h6v7'],
    note: ['M6 3h12v18H6z', 'M9 8h6', 'M9 12h6', 'M9 16h3']
  };
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 24 24'); svg.setAttribute('class','line-icon');
  svg.setAttribute('aria-hidden','true'); svg.setAttribute('focusable','false');
  for (const d of paths[name] ?? paths.note) {
    const path = document.createElementNS('http://www.w3.org/2000/svg','path'); path.setAttribute('d',d); svg.append(path);
  }
  return svg;
}
function includesPhp() { return state.topic !== 'breach'; }
function includesBreaches() { return state.topic !== 'php'; }
function selectedIncidents() { return incidentsForService(breachIncidents,state.service?.id); }
function displayedMetadata(service) {
  const records=includesBreaches()?selectedIncidents():[];
  const phpIds=includesPhp()?[...(service.php?.sourceIds??[]),...(service.incident?.sourceIds??[]),...(service.officialAction?.sourceIds??[]),...(service.supportSourceIds??[]),...(service.domainSourceIds??[])]:[];
  const ids=[...new Set([...phpIds,...records.flatMap(record=>record.sourceIds)])];
  const history=historyForService(service.id).filter(event=>event.type==='content' && (event.incidentId?includesBreaches():includesPhp()));
  return incidentMetadata({sourceIds:ids,history},allSourceRecords);
}
function currentBreachGuide() {
  const contexts=[...state.breachContext,...(state.usage.includes('purchase')?['payment']:[])];
  const guide=breachGuidance(contexts,state.role);
  const records=selectedIncidents();
  if(records.length)guide.groups.unshift({id:'breach.records',title:'事案ごとの公式案内',tasks:records.map(record=>({id:`breach.record.${record.id}`,text:`「${record.title}」の対象範囲と、公式に案内された手続きを確認する。`}))});
  return guide;
}
function topicHeading(title,text) {
  const section=el('div','topic-heading');section.append(el('h3','',title),el('p','hint',text));return section;
}
function breachContextChooser() {
  const panel=el('section','usage-panel breach-context');
  const field=el('fieldset','usage-fieldset');field.append(el('legend','','情報流出について、思い当たることはありますか？'),el('p','hint','過去の利用も含めて選べます。購入・支援などを選ぶと、支払いの確認事項も加わります。選択だけで被害の有無は判定しません。'));
  const options=el('div','usage-options');
  for(const option of breachContextOptions) {
    const label=el('label','usage-option');const words=el('span','usage-words');words.append(el('strong','',option.label),el('small','',option.short));
    const input=el('input');input.type='checkbox';input.value=option.id;input.dataset.breachContext=option.id;input.checked=state.breachContext.includes(option.id);label.classList.toggle('selected',input.checked);
    input.addEventListener('change',()=>{state.breachContext=normalizeBreachContext([...options.querySelectorAll('input:checked')].map(node=>node.value));label.classList.toggle('selected',input.checked);renderBreachTasks();$('#announcement').textContent='情報流出の確認メモを更新しました。';});
    label.append(words,input);options.append(label);
  }
  field.append(options);panel.append(field);return panel;
}
function breachCasesPanel() {
  const panel=el('section','breach-cases');panel.id='breach-results';
  const records=selectedIncidents();
  panel.append(topicHeading('情報流出・不正アクセス',`この手帳の掲載記録：${records.length}件。各公表時点の説明です。すべての事案を網羅するものではありません。`));
  const review=breachReviews[state.service?.id];
  panel.append(el('p','hint',review ? `調査を試みた日：${review.attemptedAt}。${review.note}` : 'この項目の情報流出について、調査記録はまだありません。公式のお知らせもご確認ください。'));
  if(!records.length)panel.append(el('p','notice','この手帳に掲載できる事案の記録はありません。「被害なし」「安全」という意味ではありません。'));
  for(const record of records) {
    const article=el('article','incident-card');article.dataset.incident=record.id;
    const meta=incidentMetadata(record,breachSources);
    article.append(el('p','incident-date',`${record.publishedAt.slice(0,4)}年公表${record.publishedAt<'2026-01-01'?'・過去の事案':''}`),el('h4','',record.title));
    const badge=el('span','badge',record.status.label);article.append(badge,el('p','',record.status.text));
    const scope=el('div','incident-scope');scope.append(el('strong','','対象となる範囲'),el('p','',record.scope));article.append(scope);
    const period=el('div','incident-period');period.append(el('strong','','利用・登録などの対象期間'),el('p','',record.affectedPeriod));article.append(period);
    const action=el('div','incident-action');action.append(el('strong','','公式に案内されていること'),el('p','',record.officialAction.text));article.append(action);
    article.append(sourceLinks(record.sourceIds));
    const detail=el('details','incident-detail');detail.append(el('summary','','情報の種類・発生時期・事業者の対応を見る'));
    const rows=el('dl','incident-fields');
    for(const [label,text] of [['発生・検知の時期',record.occurredAt],['対象となる情報',record.dataTypes.join('／')],['対象外と説明される情報',record.excludedData ?? 'この記録には掲載していません。'],['事業者の対応',`${record.providerResponse.label}：${record.providerResponse.text}`],['初公表日',record.publishedAt],['掲載した最新の公式続報・追記日',record.updatedAt ?? '別の続報・追記日は未記録'],['資料を確認した日（最も古いもの）',meta.checkedAt ?? '未確認'],['この手帳の掲載変更日',meta.lastChangedAt ?? '未記録']]) rows.append(el('dt','',label),el('dd','',text));
    detail.append(rows,el('p','hint',record.caution),el('p','hint','事業者の対策が完了したことと、既に情報が流出したかどうかは別の情報です。'));
    const list=el('ul','source-list');for(const id of record.sourceIds){const s=breachSources[id];const li=el('li');li.append(officialLink(s),el('small','',`資料公表日：${s.publishedAt ?? '記載なし・未確認'} / 追記日：${s.updatedAt ?? '未記録'} / 確認日：${s.checkedAt}`));list.append(li);}detail.append(list);article.append(detail);panel.append(article);
  }
  return panel;
}
function breachChecklistPanel() {
  const section=el('section','result-card breach-checklist');section.append(el('h3','','情報流出の確認メモ'),el('p','hint','公式の対応指示とは分けた、EpsilonLabの一般的な確認手順です。該当しない項目もあります。'));
  const area=el('div');area.id='breach-tasks';const progress=el('p','progress-note');progress.id='breach-progress';progress.setAttribute('aria-live','polite');section.append(area,progress,el('p','memo-note','チェックは被害や安全性の判定ではありません。掲載サービスのチェックは、このページを開いている間、サービスと立場ごとに保持します。'));return section;
}
function renderBreachTasks() {
  const area=$('#breach-tasks');if(!area)return;
  const guide=currentBreachGuide();const active=new Set(guide.groups.flatMap(group=>group.tasks.map(task=>task.id)));
  state.checkedBreachTasks=new Set([...state.checkedBreachTasks].filter(id=>active.has(id)));area.replaceChildren();
  const update=()=>{$('#breach-progress').textContent=`${state.checkedBreachTasks.size} / ${active.size} 項目を確認。必要な手続きは公式の案内に沿って進めましょう。`;refreshMemoPreview();};
  for(const group of guide.groups){const part=el('section','task-group');part.append(el('h4','',group.title));const list=el('ul','checklist');for(const task of group.tasks){const li=el('li');const label=el('label');const input=el('input');input.type='checkbox';input.dataset.breachTask=task.id;input.checked=state.checkedBreachTasks.has(task.id);input.addEventListener('change',()=>{if(input.checked)state.checkedBreachTasks.add(task.id);else state.checkedBreachTasks.delete(task.id);update();});label.append(input,el('span','',task.text));li.append(label);list.append(li);}part.append(list);area.append(part);}update();
}

function coverage(service) {
  if(state.topic==='breach')return {kind:'contact',label:`掲載事案 ${incidentsForService(breachIncidents,service.id).length}件（被害の判定ではありません）`};
  if (!service.incident.sourceIds.length) return { kind:'contact', label:'PHP：確認先をご案内' };
  if (/未確認|掲載情報なし/.test(service.incident.label)) return { kind:'partial', label:'PHP：関連資料を掲載' };
  return { kind:'explained', label:'PHP：公式説明を掲載' };
}
function usageChooser() {
  const panel = el('section','usage-panel'); panel.setAttribute('aria-label','使い方に合わせる');
  const fieldset = el('fieldset','usage-fieldset');
  fieldset.append(el('legend','','このサービスを、どのように使いましたか？'));
  const hint = el('p','hint','あてはまるものを、いくつでも。以前の利用も含めて選べます。');
  hint.id='usage-hint'; fieldset.setAttribute('aria-describedby','usage-hint');
  const options = el('div','usage-options');
  for (const option of usageOptionsForService(state.service)) {
    const label = el('label','usage-option');
    const icon = el('span','usage-icon'); icon.append(lineIcon(option.icon));
    const words = el('span','usage-words'); words.append(el('strong','',option.label),el('small','',option.short));
    const input = el('input'); input.type='checkbox'; input.value=option.id; input.dataset.usage=option.id;
    input.checked=state.usage.includes(option.id); label.classList.toggle('selected',input.checked);
    input.addEventListener('change',()=>{
      state.usage=normalizeServiceUsage([...options.querySelectorAll('input:checked')].map(node=>node.value),state.service);
      label.classList.toggle('selected',input.checked);$('#clear-usage').disabled=!state.usage.length;
      if($('#personal-tasks'))renderPersonalTasks();
      renderBreachTasks();refreshMemoPreview();
      $('#announcement').textContent=`${option.label}の確認事項を${input.checked?'追加':'解除'}しました。`;
    });
    label.append(icon,words,input); options.append(label);
  }
  fieldset.append(hint,options); panel.append(fieldset,el('p','hint',usageScopeForService(state.service)));
  const foot=el('div','usage-foot');
  foot.append(el('p','','選ばなくても、共通の確認事項をご覧いただけます。'));
  const reset=el('button','quiet-button','選択をクリア'); reset.type='button'; reset.id='clear-usage';reset.disabled=!state.usage.length;
  reset.addEventListener('click',()=>{
    state.usage=[];reset.disabled=true;options.querySelectorAll('input').forEach(input=>{input.checked=false;input.closest('label').classList.remove('selected');});
    if($('#personal-tasks'))renderPersonalTasks();renderBreachTasks();refreshMemoPreview();options.querySelector('input').focus();
    $('#announcement').textContent='使い方の選択をクリアしました。共通の確認事項を表示しています。';
  });
  foot.append(reset); panel.append(foot,el('p','usage-note','使い方の数は、危険度を表しません。選択内容は外部に送信しません。メモは必要なときに手元へ保存できます。'));
  return panel;
}
function renderPersonalTasks() {
  const guide=guidanceForServiceUsage(state.usage,state.service); const area=$('#personal-tasks');
  const activeIds=new Set(guide.groups.flatMap(group=>group.tasks.map(task=>task.id)));
  state.checkedTasks=new Set([...state.checkedTasks].filter(id=>activeIds.has(id)));
  area.replaceChildren();
  $('#personal-heading').textContent=guide.heading;
  $('#personal-intro').textContent=guide.intro;
  const chosen=usageOptionsForService(state.service).filter(option=>state.usage.includes(option.id));
  $('#usage-selection').textContent=chosen.length?`選んだ使い方：${chosen.map(option=>option.label).join('・')}`:'使い方は未選択です。共通の確認事項を表示しています。';
  $('#clear-usage').disabled=!chosen.length;
  for(const group of guide.groups) {
    const section=el('section','task-group'); section.dataset.group=group.id;
    section.append(el('h4','',group.title));
    const list=el('ul','checklist');
    for(const task of group.tasks) {
      const row=el('li');const label=el('label');const input=el('input');
      input.type='checkbox';input.dataset.task=task.id;input.checked=state.checkedTasks.has(task.id);
      input.addEventListener('change',()=>{
        if(input.checked)state.checkedTasks.add(task.id);else state.checkedTasks.delete(task.id);
        updatePersonalProgress(activeIds.size);
      });
      label.append(input,el('span','',task.text));row.append(label);list.append(row);
    }
    section.append(list);area.append(section);
  }
  updatePersonalProgress(activeIds.size);
}
function updatePersonalProgress(total) {
  const count=state.checkedTasks.size;
  $('#personal-progress').textContent=`${count} / ${total} 項目を確認${count===total?'。ひと区切りつきました。必要な手続きは、公式の案内に沿って進めてください。':'。確認できたものから、チェックを付けていきましょう。'}`;
  const bar=$('#personal-progress-bar');bar.max=total;bar.value=count;
  refreshMemoPreview();
}
function personalChecklist() {
  const section=el('section','personal-checklist');
  const title=el('h4','','');title.id='personal-heading';
  const intro=el('p','hint');intro.id='personal-intro';
  const selected=el('p','selection-caption');selected.id='usage-selection';
  const area=el('div');area.id='personal-tasks';
  const footer=el('div','memo-footer');
  const bar=el('progress');bar.id='personal-progress-bar';bar.setAttribute('aria-label','確認メモのチェック数');
  const progress=el('p','progress-note');progress.id='personal-progress';progress.setAttribute('aria-live','polite');
  footer.append(bar,progress,el('p','memo-note','チェックは被害の有無や修正完了の判定ではありません。掲載サービスの選択とチェックは、このページを開いている間、サービスと立場ごとに保持します。'));
  section.append(title,intro,selected,area,footer);
  const reference=el('details','guidance-reference');
  reference.append(el('summary','','この確認メモについて'));
  reference.append(el('p','','EpsilonLabが利用方法に合わせて整理した、一般的な確認手順です。今回のPHP問題の影響や、サービスごとの公式な対応指示を示すものではありません。'));
  reference.append(officialLink({url:'https://www.ipa.go.jp/security/anshin/attention/2025/mgdayori20250828.html',title:'参考：IPAのアカウント保護・不審な案内への対処'}));
  reference.append(officialLink({url:'https://www.ipa.go.jp/security/10threats/omgdg50000008fi8-att/setsumei_2026_kojin.pdf',title:'参考：IPA「情報セキュリティ10大脅威2026」個人編 (PDF)'}));
  reference.append(el('small','','参考資料の確認日：2026-10-24'));
  section.append(reference);return section;
}
function memoInput() {
  const service=state.service ?? fallback;
  const dates=displayedMetadata(service);
  const ids=[...new Set([...service.php.sourceIds,...service.incident.sourceIds,...service.officialAction.sourceIds,...(service.supportSourceIds ?? [])])];
  const groups=state.role==='user' ? guidanceForServiceUsage(state.usage,service).groups : [{title:'管理者として確認すること',tasks:service.actions.admin.map((text,index)=>({id:`admin.${index}`,text}))}];
  return {serviceName:service.name,serviceId:service.id,role:state.role,hostname:state.hostname,
    usageLabels:usageOptionsForService(service).filter(option=>state.usage.includes(option.id)).map(option=>option.label),
    groups,checkedTaskIds:state.checkedTasks,php:service.php,incident:service.incident,officialAction:service.officialAction,
    sources:[...ids.map(id=>sources[id]),{title:'PHP公式: 対象問題と追加案内',url:'https://www.php.net/archive/2026.php',checkedAt,kind:'incident'}],checkedAt:dates.checkedAt,lastChangedAt:dates.lastChangedAt,
    createdAt:new Date().toISOString(),version:'0.7.0',issueTitle:state.topic==='php'?'2026年10月のPHP問題（PHP2Shellと追加案内）':state.topic==='breach'?'情報流出・不正アクセスの公式公表':'2026年10月のPHP問題（PHP2Shellと追加案内）／情報流出・不正アクセスの公式公表',caution:includesPhp()?service.caution:'この手帳の掲載範囲だけでは被害の有無を判断できません。',
    includePhp:includesPhp(),includeBreaches:includesBreaches(),breachIncidents:selectedIncidents(),breachSources:[...new Set(selectedIncidents().flatMap(record=>record.sourceIds))].map(id=>({id,...breachSources[id]})),breachGroups:currentBreachGuide().groups,breachCheckedTaskIds:state.checkedBreachTasks,breachContextLabels:breachContextOptions.filter(option=>state.breachContext.includes(option.id)).map(option=>option.label)};
}
function refreshMemoPreview() {
  const textArea=$('#memo-text');
  if(textArea) textArea.value=createMemoText(memoInput());
}
function memoTools() {
  const panel=el('section','memo-tools'); panel.setAttribute('aria-labelledby','memo-tools-title');
  const title=el('h3','','確認メモを、手元に。');title.id='memo-tools-title';
  panel.append(title,el('p','hint','表示中のテーマの事案・使い方・チェック状態・公式資料をまとめます。保存したメモは自動更新されません。'));
  const buttons=el('div','memo-buttons');
  const status=el('p','memo-status');status.id='memo-status';status.setAttribute('role','status');
  const manual=el('details','manual-memo');manual.id='manual-memo';
  manual.append(el('summary','','内容を見る・手動でコピーする'));
  const label=el('label','','確認メモの内容');label.htmlFor='memo-text';
  const area=el('textarea');area.id='memo-text';area.readOnly=true;area.rows=10;area.spellcheck=false;
  const select=el('button','secondary-button','全文を選択');select.type='button';
  select.addEventListener('click',()=>{refreshMemoPreview();area.focus();area.select();status.textContent='全文を選択しました。端末のコピー操作でコピーしてください。';});
  manual.append(label,area,select,el('p','hint','コピー・保存が制限された画面では、この欄から手動でコピーできます。'));
  const copy=el('button','secondary-button','メモをコピー');copy.type='button';copy.id='copy-memo';
  copy.addEventListener('click',async()=>{
    refreshMemoPreview();const text=area.value;
    try {
      if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      if(panel.isConnected)status.textContent='確認メモをコピーしました。';
    } catch {
      if(!panel.isConnected)return;
      manual.open=true;area.focus();area.select();
      status.textContent='この画面では自動コピーが使えません。選択したメモを、端末のコピー操作でコピーしてください。';
    }
  });
  const save=el('button','secondary-button','テキストで保存');save.type='button';save.id='save-memo';
  save.addEventListener('click',()=>{
    const input=memoInput();const text=createMemoText(input);area.value=text;
    try {
      const url=URL.createObjectURL(new Blob(['\ufeff',text],{type:'text/plain;charset=utf-8'}));
      const anchor=el('a');anchor.href=url;anchor.download=memoFilename(input);document.body.append(anchor);anchor.click();anchor.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1500);
      status.textContent='テキストの保存を開始しました。保存されない場合は「内容を見る・手動でコピーする」をお使いください。';
    } catch {
      manual.open=true;area.focus();area.select();status.textContent='保存を開始できませんでした。表示した内容を手動でコピーしてください。';
    }
  });
  const print=el('button','secondary-button','印刷 / PDF');print.type='button';print.id='print-memo-button';
  print.addEventListener('click',()=>{
    $('#print-memo pre').textContent=createMemoText(memoInput());document.body.classList.add('printing-memo');
    status.textContent='印刷画面で、印刷またはPDF保存を選べます。画面が開かない場合はテキスト保存をお使いください。';
    try { window.print(); } catch {document.body.classList.remove('printing-memo');status.textContent='この画面では印刷できません。テキスト保存または手動コピーをお使いください。';}
  });
  buttons.append(copy,save,print);panel.append(buttons,status,manual);return panel;
}
window.addEventListener('afterprint',()=>document.body.classList.remove('printing-memo'));
window.addEventListener('beforeprint',()=>{
  if(state.kind==='found' || state.kind==='unknown') { $('#print-memo pre').textContent=createMemoText(memoInput());document.body.classList.add('printing-memo'); }
});
function historyList(events) {
  const list=el('ul','history-list');
  for(const event of events) {
    const item=el('li');const date=el('time','',event.date);date.dateTime=event.date;
    item.append(date,el('strong','',event.title),el('p','',event.summary));
    if(event.sourceIds?.length)item.append(sourceLinks(event.sourceIds));
    list.append(item);
  }
  return list;
}
function serviceHistoryPanel() {
  const panel=el('details','service-history');panel.append(el('summary','','このサービスの掲載情報の履歴'));
  const meta=metadataForService(state.service?.id);const events=historyForService(state.service?.id);
  if(!events.length) {panel.append(el('p','hint','このサービスの掲載情報・変更履歴はありません。'));return panel;}
  panel.append(el('p','hint',`記録開始: ${meta.trackedSince}。変更日は、このガイドに掲載した説明が変わった日です。サービス側の修正日ではありません。`));
  panel.append(el('p','hint','資料の確認日は出典ごとに異なる場合があります。見出しには最も古い確認日を表示し、個別の日付は公式資料一覧に記載します。'));
  panel.append(historyList(events));return panel;
}
function renderUpdates() {
  const root=$('#updates');const title=el('h2','','このガイドの更新メモ');title.id='updates-title';
  root.append(el('p','eyebrow','あとから確認するときに'),title,
    el('p','hint','公式情報の確認日と、掲載内容を変更した日は別に記録します。画面の機能追加も、サービスの対応状況とは分けてお知らせします。'));
  const meta=metadataForCatalog();
  const dates=el('dl','update-dates');
  for(const [label,value] of [['掲載資料の確認日（最も古いもの）',meta.checkedAt ?? '未確認'],['掲載内容の最終変更日',meta.lastChangedAt ?? '記録開始後の変更なし'],['履歴の記録開始日',meta.trackedSince]])dates.append(el('dt','',label),el('dd','',value));
  root.append(dates);
  const filter=el('div','history-filter');const label=el('label','','前に確認した日');label.htmlFor='history-since';
  const input=el('input');input.type='date';input.id='history-since';input.setAttribute('aria-describedby','history-filter-help');
  const clear=el('button','secondary-button','すべての履歴を見る');clear.type='button';
  const hint=el('p','hint','選んだ日より後の掲載内容の変更を表示します。日付は保存しません。');hint.id='history-filter-help';
  const count=el('p','hint');count.id='history-count';count.setAttribute('role','status');
  const area=el('div');area.id='filtered-history';
  const apply=()=>{
    const since=input.value;
    const events=updateHistory.filter(event=>!since || (event.type==='content' && event.date>since));
    count.textContent=since ? `${since}より後の掲載内容の変更: ${events.length}件` : `掲載情報の履歴: ${events.length}件（初回の記録を含む）`;
    area.replaceChildren(events.length ? historyList(events) : el('p','hint','この条件に合う変更記録はありません。各サービスの最新状況は公式情報をご確認ください。'));
  };
  input.addEventListener('change',apply);clear.addEventListener('click',()=>{input.value='';apply();input.focus();});
  filter.append(label,input,clear);root.append(filter,hint,count,area);apply();
  const releases=el('details','app-releases');releases.append(el('summary','','アプリの機能・デザインの更新'));
  for(const release of appReleases) {
    const section=el('div');section.append(el('h3','',`${release.version} / ${release.date}`),el('p','',release.title));
    const list=el('ul');release.changes.forEach(change=>list.append(el('li','',change)));section.append(list);releases.append(section);
  }
  root.append(releases);
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
function rememberCurrentProgress() {
  pageSessionProgress = rememberSessionProgress(pageSessionProgress, state);
}
function publishedServiceRevision(service, role) {
  const key=`${role}:${service.id}`;
  if(contentRevisions.has(key))return contentRevisions.get(key);
  const incidents=incidentsForService(breachIncidents,service.id);
  const ids=[...new Set([...service.php.sourceIds,...service.incident.sourceIds,...service.officialAction.sourceIds,...(service.supportSourceIds??[]),...incidents.flatMap(record=>record.sourceIds)])].sort();
  const evidence=ids.map(id=>{const {checkedAt:ignored,...content}=allSourceRecords[id];return {id,...content};});
  const content={php:service.php,incident:service.incident,officialAction:service.officialAction,actions:service.actions[role],caution:service.caution,incidents,evidence,usage:role==='user'?guidanceForServiceUsage(usageOptionsForService(service).map(option=>option.id),service):null,breachGuide:breachGuidance(breachContextOptions.map(option=>option.id),role)};
  const revision=savedServiceRevision(JSON.parse(JSON.stringify(content)));
  contentRevisions.set(key,revision);return revision;
}
function savedServiceError(status) {
  if(status==='malformed')return '保存した一覧を読み取れませんでした。「保存した内容を消す」から、この手帳の保存だけを削除してやり直せます。';
  if(status==='quota')return '端末の保存領域がいっぱいで保存できませんでした。確認メモのテキスト保存は引き続き利用できます。';
  return 'この画面では端末への保存を利用できません。確認メモのコピーやテキスト保存をご利用ください。';
}
function applySavedServiceResult(result, message, failureMessage = null) {
  if(!result.ok && ['unavailable','quota'].includes(result.status) && !result.entries.length)result={...result,entries:savedServiceState.entries};
  savedServiceState=result;renderSavedServices();render();
  $('#announcement').textContent=result.ok?message:(failureMessage??savedServiceError(result.status));
  const status=$('#guide-action-status');if(status)status.textContent=$('#announcement').textContent;
}
function openSavedService(entry) {
  const service=services.find(item=>item.id===entry.serviceId);
  if(!service || !service.roles.includes(entry.role))return;
  chooseRole(entry.role,{renderResult:false});switchMode('select');
  state.query='';state.category='all';$('#service-filter').value='';renderServiceList();
  selectService(service);
}
function renderSavedServices() {
  const root=$('#saved-services');root.replaceChildren();
  root.hidden=savedServiceState.entries.length===0 && savedServiceState.status!=='malformed';
  if(root.hidden)return;
  const title=el('h2','','いつものサービス');title.id='saved-services-title';
  root.append(title,el('p','hint','この端末で覚えているサービスです。チェックは毎回、新しく確認できます。'));
  if(!savedServiceState.ok)root.append(el('p','notice',savedServiceError(savedServiceState.status)));
  const list=el('div','saved-service-list');
  for(const entry of savedServiceState.entries){
    const service=services.find(item=>item.id===entry.serviceId);if(!service)continue;
    const changed=entry.revision!==publishedServiceRevision(service,entry.role);
    const button=el('button','saved-service-button');button.type='button';button.dataset.savedService=entry.serviceId;button.dataset.savedRole=entry.role;
    button.append(el('strong','',service.name),el('small','',entry.role==='user'?'利用者向け':'管理者向け'));
    if(changed)button.append(el('small','changed-note','保存時から掲載内容に変更があります'));
    button.addEventListener('click',()=>openSavedService(entry));list.append(button);
  }
  root.append(list);
  const clear=el('details','saved-clear');clear.append(el('summary','','保存した内容を消す'));
  clear.append(el('p','hint','この手帳に保存したサービスの一覧を、端末からすべて削除します。今開いている確認メモは残ります。'));
  const button=el('button','quiet-button','保存したサービスをすべて削除');button.type='button';button.id='clear-saved-services';
  button.addEventListener('click',()=>{applySavedServiceResult(clearSavedServices(serviceDeviceStorage),'この端末の保存一覧を削除しました。','保存一覧を削除できませんでした。ブラウザの保存設定を確認して、もう一度お試しください。');($('#remember-service')??$('#service-filter')).focus();});
  clear.append(button);root.append(clear);
}
function guideActionsPanel() {
  const panel=el('section','guide-actions');panel.id='guide-actions';panel.setAttribute('aria-label','この案内を開き直す');
  const selection={serviceId:state.service.id,role:state.role,topic:state.topic};
  const link=buildGuideLink(publicGuideUrl,selection,services);
  const status=el('p','hint');status.id='guide-action-status';status.setAttribute('role','status');
  const buttons=el('div','guide-action-buttons');
  if(link){
    const copy=el('button','secondary-button','この案内へのリンクをコピー');copy.type='button';copy.id='copy-guide-link';
    const manual=el('div','manual-share');manual.hidden=true;
    const label=el('label','','共有するリンク');label.htmlFor='guide-link';
    const input=el('input');input.id='guide-link';input.type='text';input.readOnly=true;input.value=link;
    manual.append(label,input);
    copy.addEventListener('click',async()=>{
      try {if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');await navigator.clipboard.writeText(link);if(panel.isConnected)status.textContent='サービス・立場・テーマだけのリンクをコピーしました。';}
      catch {if(!panel.isConnected)return;manual.hidden=false;input.focus();input.select();status.textContent='選択したリンクを、端末のコピー操作でコピーしてください。';}
    });buttons.append(copy);panel.append(manual);
  }
  if(state.service.roles.includes(state.role)){
    const saved=savedServiceState.entries.find(entry=>entry.serviceId===state.service.id&&entry.role===state.role);
    const revision=publishedServiceRevision(state.service,state.role);
    const changed=saved && saved.revision!==revision;
    const remember=el('button','secondary-button',saved?'この端末の保存から外す':'このサービスを端末に覚えておく');remember.type='button';remember.id='remember-service';
    remember.addEventListener('click',()=>{
      const result=saved?removeSavedService(serviceDeviceStorage,services,selection):saveSavedService(serviceDeviceStorage,services,{...selection,revision});
      applySavedServiceResult(result,saved?'このサービスを保存一覧から外しました。':'サービスと立場をこの端末に保存しました。チェックや利用状況は保存していません。');
      $('#remember-service')?.focus();
    });buttons.append(remember);
    if(changed){
      panel.append(el('p','notice','保存時から掲載内容が変わっています。対象範囲・対象期間・公式案内を読み直してください。以前のチェックは端末には保存されていません。'));
      const reviewed=el('button','quiet-button','掲載内容の変更を確認した');reviewed.type='button';reviewed.id='acknowledge-service-update';
      reviewed.addEventListener('click',()=>{applySavedServiceResult(saveSavedService(serviceDeviceStorage,services,{...selection,revision}),'現在の掲載内容を確認した目印を保存しました。安全性の判定ではありません。');$('#remember-service')?.focus();});buttons.append(reviewed);
    }
  }
  panel.prepend(buttons);
  const privacy=el('details','action-privacy');privacy.append(el('summary','','リンクと端末保存について'),el('p','hint','リンクに含まれるのはサービス・立場・テーマだけです。端末への保存はボタンを押したときだけ。サービス・立場と、掲載内容の変更を確かめる目印を保存します。チェック・利用状況・入力URLは含めません。'));
  panel.append(privacy,status);
  if(!savedServiceState.ok)status.textContent=savedServiceError(savedServiceState.status);
  return panel;
}
function resetChecksPanel() {
  const panel=el('section','session-controls');
  panel.setAttribute('aria-label','確認途中のメモ');
  panel.append(el('p','hint',state.service ? '確認途中のメモは、サービス・立場ごとにこのページ内で保持します。再読み込みでリセットします。' : '一覧にないサービスのメモは、別のサービスへ移ると消えます。'));
  const open=el('button','quiet-button','確認をやり直す');open.type='button';open.id='reset-checks';open.setAttribute('aria-expanded','false');open.setAttribute('aria-controls','reset-checks-confirmation');
  const confirmation=el('div','reset-confirmation');confirmation.id='reset-checks-confirmation';confirmation.hidden=true;confirmation.setAttribute('role','group');confirmation.setAttribute('aria-labelledby','reset-checks-description');
  const description=el('p','hint',`${state.service?.name ?? '現在の案内'}の${state.role==='user'?'利用者向け':'管理者向け'}チェックを、PHP・情報流出の両テーマで外します。選んだ使い方や条件、他のサービスのメモはそのままです。`);description.id='reset-checks-description';
  const confirm=el('button','secondary-button','この案内のチェックを外す');confirm.type='button';confirm.id='confirm-reset-checks';
  const cancel=el('button','quiet-button','戻る');cancel.type='button';cancel.id='cancel-reset-checks';
  const close=()=>{confirmation.hidden=true;open.setAttribute('aria-expanded','false');open.focus();};
  open.addEventListener('click',()=>{confirmation.hidden=!confirmation.hidden;open.setAttribute('aria-expanded',String(!confirmation.hidden));if(!confirmation.hidden)cancel.focus();});
  cancel.addEventListener('click',close);
  confirmation.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();close();}});
  confirm.addEventListener('click',()=>{
    Object.assign(state,resetSessionChecks(state));rememberCurrentProgress();render();
    $('#reset-checks').focus();$('#announcement').textContent='このサービス・立場のチェックを外しました。使い方と条件の選択は保っています。';
  });
  confirmation.append(description,confirm,cancel);panel.append(open,confirmation);return panel;
}
function render(focus = false) {
  document.body.classList.remove('printing-memo');$('#print-memo pre').textContent='';
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
  const serviceDates=displayedMetadata(service);
  if(state.kind !== 'invalid') {
    titleBlock.append(el('p','hint',`表示中のテーマの資料確認日（最も古いもの）: ${serviceDates.checkedAt ?? '掲載情報なし'}`));
    titleBlock.append(el('p','hint',`掲載内容の最終変更日: ${serviceDates.lastChangedAt ?? '変更記録なし'}`));
  }
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
  if(state.service && state.service.roles.includes(state.role))root.append(guideActionsPanel());
  root.append(resetChecksPanel());
  if(state.role==='user')root.append(usageChooser());
  if(includesBreaches())root.append(breachCasesPanel(),breachContextChooser(),breachChecklistPanel());
  if(includesPhp()){
  root.append(topicHeading('PHPの問題','2026年10月のPHP2Shellと追加案内を扱います。情報流出の事案とは分けてご覧ください。'));
  const facts = el('div','service-facts');
  facts.append(el('p','section-caption','サービスについて、わかっていること'));
  facts.append(card('01', 'PHPの利用について分かっていること', service.php));
  facts.append(card('02', '対象となる問題についての公式説明', service.incident));
  const action = el('section', 'result-card action-card');
  const heading = el('div', 'card-title');
  if (state.role === 'user') heading.append(lineIcon('note'));
  else heading.append(el('span', '', '03'));
  heading.append(el('h3', '', state.role === 'user' ? 'あなたが確認すること' : '管理者が確認すること'));
  action.append(heading, el('p', 'action-subtitle', service.officialAction.sourceIds.length ? '今回の問題について公式資料にある案内' : '今回の問題に関する対応指示は未確認'), el('p', 'official-action', service.officialAction.text));
  if (service.officialAction.sourceIds.length) action.append(sourceLinks(service.officialAction.sourceIds));
  if (state.role === 'user') {
    action.append(personalChecklist());
    root.append(action,facts);
    renderPersonalTasks();
  } else {
    action.append(el('p', 'action-subtitle', 'EpsilonLabからの確認手順。確認できた項目にチェックを付けましょう。'));
    const list = el('ul', 'checklist');
    const tasks = service.actions.admin;
    const progress = el('p', 'progress-note', `${tasks.filter((_,index)=>state.checkedTasks.has(`admin.${index}`)).length} / ${tasks.length} 項目を確認。掲載サービスのチェックは、このページを開いている間、サービスと立場ごとに保持します。`);
    progress.setAttribute('aria-live', 'polite');
    tasks.forEach((task, index) => {
      const row = el('li'); const label = el('label'); const checkbox = el('input');
      checkbox.type = 'checkbox'; checkbox.dataset.task=`admin.${index}`; checkbox.checked=state.checkedTasks.has(`admin.${index}`);
      checkbox.addEventListener('change', () => {
        if(checkbox.checked)state.checkedTasks.add(`admin.${index}`);else state.checkedTasks.delete(`admin.${index}`);
        const count = list.querySelectorAll('input:checked').length;
        refreshMemoPreview();
        progress.textContent = `${count} / ${tasks.length} 項目を確認。チェックは修正完了や安全性の判定ではありません。`;
      });
      label.append(checkbox, el('span','',task)); row.append(label); list.append(row);
    });
    action.append(list, progress);
    const link = el('a','','対象の問題とPHP公式の更新・追加案内を確認する');
    link.href = '#issue'; link.className = 'inline-sources';
    link.addEventListener('click',()=> { $('#issue details').open = true; });
    action.append(link);
    root.append(facts,action);
  }
  root.append(el('p','notice',service.caution));
  }
  root.append(memoTools(),serviceHistoryPanel());
  if(includesBreaches())renderBreachTasks();
  if (service.supportSourceIds?.length) {
    const support = el('section','support-panel');
    support.append(el('h3','','最新のお知らせ・問い合わせの確認先'), el('p','hint','公式の確認窓口です。このリンク自体はPHP対応や情報流出の有無を示す根拠ではありません。'));
    for (const id of service.supportSourceIds) support.append(officialLink(sources[id]));
    root.append(support);
  }
  if (state.service && includesPhp()) {
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
  refreshMemoPreview();
  $('#announcement').textContent = `${service.name}の情報を、${state.role === 'user' ? 'サービス利用者' : 'サイト管理者'}向けに表示しました。`;
  if (focus) {
    title.focus({ preventScroll: true });
    const titleBounds = title.getBoundingClientRect();
    if (window.matchMedia('(max-width: 800px)').matches || titleBounds.top < 0 || titleBounds.bottom > window.innerHeight) root.scrollIntoView({ behavior: 'instant', block: 'start' });
  }
}
function selectService(service, hostname = null, { focus = true } = {}) {
  rememberCurrentProgress();
  Object.assign(state, { service, hostname, kind: service ? 'found' : 'unknown', ...restoreSessionProgress(pageSessionProgress,service?.id,state.role) });
  $('#url-error').hidden = true; $('#url-input').removeAttribute('aria-invalid');
  render(focus);
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
      const info=coverage(service); text.append(el('small',`evidence-label ${info.kind}`,info.label));
      if(state.topic==='all'){const count=incidentsForService(breachIncidents,service.id).length;text.append(el('small','evidence-label contact',`情報流出等の掲載 ${count}件`));}
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
function chooseRole(role, { renderResult = true } = {}) {
  if (!['user','admin'].includes(role) || state.role === role) return;
  rememberCurrentProgress();
  state.role = role; state.category='all';state.query='';$('#service-filter').value='';
  const selectionCleared = state.service && !state.service.roles.includes(state.role);
  if (selectionCleared) Object.assign(state,{kind:'empty',service:null,hostname:null});
  Object.assign(state,restoreSessionProgress(pageSessionProgress,state.service?.id,state.role));
  document.querySelectorAll('[data-role]').forEach(other=>{
    const active = other.dataset.role === state.role; other.classList.toggle('active',active); other.setAttribute('aria-pressed',String(active));
  });
  $('#finder-title').textContent = state.role === 'user' ? '利用するサービスを探す' : '管理する環境を探す';
  $('#role-list-hint').textContent = state.role === 'user' ? '使っているサービスを、名前や用途から探せます。' : '契約中のサーバー、CMS、ショップなどを選んでください。';
  $('#service-filter').placeholder = state.role === 'user' ? '例: アマゾン、note' : '例: さくら、WordPress';
  renderServiceList(); if(renderResult)render();
  if (selectionCleared) $('#announcement').textContent='立場に合わせて一覧を切り替えました。対象を選び直してください。';
}
document.querySelectorAll('[data-role]').forEach(button => button.addEventListener('click',()=>chooseRole(button.dataset.role)));
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
    rememberCurrentProgress();
    Object.assign(state,{kind:'invalid',service:null,hostname:null,...snapshotSessionProgress()}); render();
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

renderUpdates();

function chooseTopic(topic,{renderResult=true}={}){state.topic=['all','php','breach'].includes(topic)?topic:'all';document.querySelectorAll('[data-topic]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.topic===state.topic)));renderServiceList();if(renderResult)render();$('#announcement').textContent=`${state.topic==='all'?'すべて':state.topic==='php'?'PHPの問題':'情報流出・不正アクセス'}を表示します。`; }
function applyGuideSelection(selection,{focus=false}={}) {
  if(!selection)return;
  if(!selection.serviceId){chooseTopic(selection.topic);return;}
  const service=services.find(item=>item.id===selection.serviceId);
  chooseRole(selection.role,{renderResult:false});
  state.query='';state.category='all';$('#service-filter').value='';switchMode('select');
  chooseTopic(selection.topic,{renderResult:false});selectService(service,null,{focus});
}
document.querySelectorAll('[data-topic]').forEach(button=>button.addEventListener('click',()=>chooseTopic(button.dataset.topic)));
window.addEventListener('hashchange',()=>applyGuideSelection(parseGuideHash(location.hash,services),{focus:true}));
window.addEventListener('storage',event=>{
  if(event.key!==SAVED_SERVICES_KEY && event.key!==null)return;
  savedServiceState=readSavedServices(serviceDeviceStorage,services);renderSavedServices();render();
});
chooseTopic(initialTopic);
renderSavedServices();
applyGuideSelection(initialGuide,{focus:!!initialGuide?.serviceId});
