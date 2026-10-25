import { usageOptionsForService, guidanceForServiceUsage } from './usage-profiles.mjs';

// These choices select relevant reading, never an individual exposure finding.
// Only a record's explicit dataTypes can make an information-specific choice appear.
const riskDataPatterns = {
  address: /住所|配送先|送り先|届け先|所在地/,
  identity: /本人確認|運転免許|免許証|パスポート|旅券|身分証/,
  purchase: /購入|注文|決済|支払|請求|カード|口座|取引|契約|残高|寄附|寄付/,
};
const riskBreachChoices = [
  { id:'account', label:'登録・申込み・問い合わせをした', short:'会員登録やフォームへの入力など' },
  { id:'browse', label:'閲覧・検索をした', short:'Webサイトやアプリの閲覧' },
  { id:'purchase', label:'購入・契約・支払いをした', short:'注文・予約・有料サービスなど' },
  { id:'address', label:'住所・配送先を伝えた', short:'申込みや配送での登録も含む' },
  { id:'identity', label:'本人確認書類を提出した', short:'免許証・本人確認画像など' },
  { id:'relationship', label:'従業員・取引先等として関係がある', short:'一般のサービス利用とは分けて確認' },
  { id:'former', label:'以前使っていた・退会済み', short:'過去の登録や利用について確認' },
  { id:'notice', label:'個別のお知らせが届いた', short:'対象者へのメールや郵送など' },
];
const riskServiceWords = {
  sagawa: {
    account:['スマートクラブに登録した','以前の会員登録も含む'],
    purchase:['荷物を送った・受け取った','会員登録せず利用した場合も含む'],
    address:['送り状・配送先に住所を使った','送り主・届け先のどちらも含む'],
  },
  'times-car': {
    account:['現在の会員として利用している','タイムズカーなどの登録'],
    purchase:['カーシェアなどの料金を支払った','関連サービスの契約も確認'],
    former:['以前登録した・退会済み','入会に至らなかった場合も確認'],
  },
  'burger-king': {
    account:['公式アプリに会員登録した','過去の登録も含む'],
    purchase:['店舗やアプリで注文した','店舗利用とアプリ登録を区別'],
  },
  'jr-east': {
    account:['えきねっと等に会員登録した','大人の休日倶楽部も含む'],
    purchase:['乗車券を買った・鉄道を利用した','会員登録とは分けて確認'],
  },
  honto: {
    account:['会員登録・メール配信登録をした','メールマガジンの許諾状況も確認'],
    purchase:['本などを購入した','購入とメール配信への許諾を区別'],
  },
  'daiichi-life': {
    relationship:['従業員・退職者として在籍した','公表された出向者の範囲も確認'],
    address:['勤務先に住所を伝えた','人事情報として登録した住所'],
    former:['以前在籍していた・退職済み','退職者の公表範囲を確認'],
  },
  'mitsubishi-gas-chemical': {
    relationship:['従業員・退職者として在籍した','公表対象の在籍者・退職者を確認'],
    former:['以前在籍していた・退職済み','退職した時期も確認'],
  },
  astemo: {
    relationship:['従業員・取引先・協力会社として関係がある','対象となる業務関係者の範囲を確認'],
    former:['以前、業務上の関係があった','当時の連絡先情報も確認'],
  },
  transcosmos: {
    relationship:['コールセンターの採用に応募した','ApplyNowで動画面接を利用'],
    former:['以前、採用に応募した','応募した時期と公表対象を照合'],
  },
  'medley-atlink': {
    account:['対象の医療機関を受診した','アプリ・Web予約の未利用者も確認'],
    purchase:['オンライン決済を利用した','決済日・金額の情報を確認'],
    former:['以前、医療機関を受診した','過去の受診歴も含む'],
  },
  'pharma-digital': {
    account:['医療従事者向けに登録・利用した','所属する施設の情報も確認'],
    address:['勤務先・施設の住所を登録した','自宅住所とは分けて確認'],
  },
};
const riskRelationshipServiceIds=new Set(['digital-agency','mitsubishi-gas-chemical','transcosmos','treasure-factory','and-st','newspicks','daiichi-kosho','astemo','daiichi-life','mazda','pharma-digital']);
const riskWorkforceOnlyServiceIds=new Set(['mitsubishi-gas-chemical','transcosmos','astemo','daiichi-life']);
const riskAdminChoices = [
  {id:'manage',label:'自分でサイト・設定を管理している',short:'管理画面やサーバーの保守など'},
  {id:'delegated',label:'事業者・担当者に管理を任せている',short:'保守委託や管理されたサービス'},
  {id:'unsure',label:'管理方法がわからない',short:'まず契約や作業担当を確認'},
  {id:'notice',label:'個別の対応依頼が届いた',short:'事業者からの通知・作業依頼'},
];

function riskRecordsForService(service, records) {
  if (!service?.id || !Array.isArray(records)) return [];
  return records.filter(record => Array.isArray(record?.serviceIds) && record.serviceIds.includes(service.id))
    .slice().sort((a,b)=>(b.updatedAt ?? b.publishedAt ?? '').localeCompare(a.updatedAt ?? a.publishedAt ?? ''));
}
function riskEvidenceFor(record, id) {
  const values=Array.isArray(record?.dataTypes)?record.dataTypes:[];
  return riskDataPatterns[id] ? values.filter(value=>typeof value==='string' && riskDataPatterns[id].test(value)) : values.filter(value=>typeof value==='string');
}
function riskSourceIds(record) {
  return [...new Set((Array.isArray(record?.sourceIds)?record.sourceIds:[]).filter(id=>typeof id==='string'))];
}
function riskItem(id, title, text, sourceIds=[]) { return {id,title,text,sourceIds:[...sourceIds]}; }
function riskGroup(id,title,kind,items) { return {id,title,kind,items}; }

/** Pass the service's incident records to offer only relevant information choices. */
export function riskOptionsForService(service, topic='breach', role='user', incidents=[]) {
  if (!service) return [];
  if (topic==='php') {
    if (!service.php || !service.officialAction) return [];
    return role==='admin' ? riskAdminChoices.map(option=>({...option})) : usageOptionsForService(service).map(({id,label,short})=>({id,label,short}));
  }
  if (topic!=='breach') return [];
  const records=riskRecordsForService(service,incidents);
  const words=Object.hasOwn(riskServiceWords,service.id)?riskServiceWords[service.id]:{};
  const commerceGroups=['transport','shopping','media','finance','daily','commerce'];
  return riskBreachChoices.filter(option=>{
    if (option.id==='relationship') return riskRelationshipServiceIds.has(service.id);
    if ((option.id==='account'||option.id==='purchase') && riskWorkforceOnlyServiceIds.has(service.id)) return false;
    if (option.id==='purchase') return Boolean(words.purchase) || commerceGroups.includes(service.groupByRole?.[role]) || records.some(record=>riskEvidenceFor(record,'purchase').length);
    if (option.id==='address' || option.id==='identity') return records.some(record=>riskEvidenceFor(record,option.id).length);
    return true;
  }).map(option=>({...option,...(words[option.id]?{label:words[option.id][0],short:words[option.id][1]}:{})}));
}

/** Ignore stale/unknown selections and preserve the visible choice order. */
export function normalizeRiskSelections(selections, options=[]) {
  const selected=new Set(Array.isArray(selections)||selections instanceof Set?selections:[]);
  return (Array.isArray(options)?options:[]).filter(option=>selected.has(option.id)).map(option=>option.id);
}

function riskBreachScope(record, selected) {
  const refs=riskSourceIds(record);
  const status=[record.status?.label,record.status?.text].filter(Boolean).join('。');
  // "not-confirmed" covers both no-leak findings and absence of confirmation.
  // Preserve that exact wording rather than treating either as a safety finding.
  if (record.status?.code==='not-confirmed') return riskItem(`scope.${record.id}`,record.title,`${status}\n公表対象：${record.scope}`,refs);
  const specific=selected.filter(id=>['address','identity','purchase'].includes(id));
  const evidence=[...new Set(specific.flatMap(id=>riskEvidenceFor(record,id)))];
  const fullData=selected.includes('account')||selected.includes('former')||selected.includes('relationship');
  const displayed=evidence.length?evidence:(fullData?riskEvidenceFor(record,'account'):[]);
  const paragraphs=[`${record.status?.label ?? '状況を確認中'}。公表対象：${record.scope}`];
  if (displayed.length) paragraphs.push(`登録・提出した情報と照合する項目：${displayed.join('／')}`);
  if (selected.includes('identity') && riskEvidenceFor(record,'identity').length && record.status?.text) paragraphs.push(record.status.text);
  if ((selected.includes('purchase')||selected.includes('address')||selected.includes('identity')) && record.excludedData) paragraphs.push(`対象外などの説明：${record.excludedData}`);
  if (selected.includes('former') && record.affectedPeriod) paragraphs.push(`利用・登録の対象期間：${record.affectedPeriod}`);
  return riskItem(`scope.${record.id}`,record.title,paragraphs.join('\n'),refs);
}

function riskBreachExtra(service, records, selected) {
  const items=[];
  const active=records.filter(record=>record.status?.code!=='not-confirmed');
  if (selected.includes('notice')) items.push(riskItem('notice','届いた通知の対象と手続き','公式サイト・公式アプリから通知の真偽を確かめ、対象となる情報・必要な手続き・期限を確認してください。通知内のリンクだけを頼りに個人情報を入力しないでください。'));
  if (!active.length) return items;
  if (selected.includes('former')) {
    if(riskWorkforceOnlyServiceIds.has(service.id)||selected.includes('relationship'))items.push(riskItem('former','以前の関係も公表範囲と照合','在籍・勤務・採用応募などの時期を公表範囲と照らし合わせてください。会社の公式窓口や個別通知で、対象となる在籍者・退職者・業務関係者等の範囲を確認してください。'));
    else if(service.id==='medley-atlink')items.push(riskItem('former','過去の受診歴も確認','受診した医療機関と時期を公表対象と照らし合わせてください。現在は通院していない場合も、対象医療機関の案内を確認してください。'));
    else items.push(riskItem('former','過去の利用も対象範囲と照合','利用・登録していた時期を公表範囲と照らし合わせてください。退会済みでログインできない場合は、元利用者向けの公式窓口を確認してください。'));
  }
  if (selected.includes('browse') && !selected.some(id=>['account','purchase','address','identity','relationship','former'].includes(id))) {
    if(service.id==='medley-atlink')items.push(riskItem('browse','アプリ未利用でも受診歴を確認','公式は、アプリ・Web予約を利用していない患者の初期ログイン情報等も公表対象に含めています。対象の医療機関を受診したことがあるか、医療機関の案内で確認してください。',riskSourceIds(records[0])));
    else items.push(riskItem('browse','閲覧と情報の登録を区別','閲覧したという選択だけでは、公表された被害対象とは判定できません。上に示す対象サービス・機能を利用したか、登録や問い合わせで情報を入力したことがないかを確認してください。'));
  }
  if (selected.includes('purchase') && !active.some(record=>riskEvidenceFor(record,'purchase').length)) items.push(riskItem('purchase','支払いをした場合の読み方','掲載資料の対象情報からは、購入・支払いをしたことだけでカード番号などの流出対象とは判断できません。上の「対象外などの説明」と公式案内で、今回対象となる情報を確認してください。'));
  if (service.id==='burger-king' && selected.includes('purchase') && !selected.includes('account')) items.push(riskItem('burger-king.app','店舗利用とアプリ登録を区別','今回の公表対象は公式アプリの会員情報です。店舗で注文したこととアプリへの会員登録は分けて確認してください。',riskSourceIds(records[0])));
  if (service.id==='sagawa' && selected.includes('purchase') && !selected.includes('account')) items.push(riskItem('sagawa.delivery','会員登録以外の利用も確認','公表対象には荷物の送り主・届け先の情報も含まれます。スマートクラブの会員であるかに加え、荷物を送った・受け取った時期も公式発表と照合してください。',riskSourceIds(records[0])));
  return items;
}

function riskPhpGuidance(service,role,selected) {
  const official=service.officialAction;
  const groups=[riskGroup('official','公式が案内する対応','official',[riskItem('php.official','',official.text,official.sourceIds??[])])];
  const scopeText=[service.incident?.text,service.caution].filter(Boolean).join('\n');
  if (scopeText) groups.push(riskGroup('scope','この案内が当てはまる範囲','scope',[riskItem('php.scope','',scopeText,service.incident?.sourceIds??[])]));
  const actions=[];
  if (role==='admin') {
    if(selected.includes('manage')) for (const [index,text] of (service.actions?.admin??[]).entries()) actions.push(riskItem(`php.manage.${index}`,'',text));
    if(selected.includes('delegated')) actions.push(riskItem('php.delegated','管理を任せている場合','上の公式案内を管理担当者と共有し、契約・環境が告知の対象に含まれるか、必要な作業と担当者を確認してください。事業者の対応と、個別サイトの被害の有無は分けて確認します。'));
    if(selected.includes('unsure')) actions.push(riskItem('php.unsure','管理方法がわからない場合','契約先やサイトの管理担当者に、PHPの更新を誰が担当するか確認してください。自分が管理していないサーバーの設定を変更する必要はありません。'));
    if(selected.includes('notice')) actions.push(riskItem('php.notice','個別の対応依頼がある場合','事業者の公式窓口から依頼の真偽を確かめ、対象となる契約・PHP環境・作業期限を確認してください。'));
  } else {
    for(const group of guidanceForServiceUsage(selected,service).groups.filter(group=>selected.includes(group.id))) {
      const task=group.tasks[0];if(task)actions.push(riskItem(`php.${task.id}`,group.title,task.text));
    }
  }
  if(actions.length)groups.push(riskGroup('actions',role==='admin'?'管理方法に合わせた対応':'利用状況に合わせた確認','action',actions));
  return groups;
}

/**
 * Pure presentation model. It quotes current record scope/status and official action.
 * Selection count never yields a score, an exposure finding, or a safety finding.
 */
export function personalizedRiskGuidance({service,topic='breach',role='user',selections=[],incidents=[]}={}) {
  const records=riskRecordsForService(service,incidents);
  const options=riskOptionsForService(service,topic,role,records);
  const selected=normalizeRiskSelections(selections,options);
  const result={heading:'あなたに関係する情報と対応',intro:'利用状況を選ぶと、公表された対象範囲と必要な確認を絞って表示します。',selectionLabels:options.filter(option=>selected.includes(option.id)).map(option=>option.label),groups:[]};
  if(!service || !selected.length)return result;
  if(topic==='php') {
    if(!service.php||!service.officialAction)return result;
    result.intro=role==='admin'?'管理方法に合わせた案内です。公式発表の対象環境・問題を確認してください。':'サービスの利用方法に合わせた案内です。サーバーのPHP更新は運営・管理担当者が行います。';
    result.groups=riskPhpGuidance(service,role,selected);return result;
  }
  if(topic!=='breach')return result;
  result.intro='選択した利用状況と公式発表を照合するための案内です。あなた個人の被害の有無を判定するものではありません。';
  if(!records.length) {
    result.groups=[riskGroup('scope','このサービスの掲載状況','scope',[riskItem('no-record','','このアプリには紹介できる事案がまだ掲載されていません。利用状況から被害の有無は判断できないため、サービスの公式お知らせを確認してください。',service.supportSourceIds??[])])];
    return result;
  }
  result.groups=[
    riskGroup('official','公式が案内する対応','official',records.map(record=>riskItem(`official.${record.id}`,record.title,record.officialAction?.text??'公式資料で利用者向けの対応を確認してください。',riskSourceIds(record)))),
    riskGroup('scope','利用状況と照らし合わせる情報','scope',records.map(record=>riskBreachScope(record,selected))),
  ];
  const extra=riskBreachExtra(service,records,selected);
  if(extra.length)result.groups.push(riskGroup('actions','選んだ利用状況で確認すること','action',extra));
  return result;
}
