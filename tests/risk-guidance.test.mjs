import test from 'node:test';
import assert from 'node:assert/strict';
import { riskOptionsForService, normalizeRiskSelections, personalizedRiskGuidance } from '../src/risk-guidance.mjs';
import { directoryServices } from '../src/service-directory.mjs';
import { breachIncidents } from '../src/incidents.mjs';
import { breachSources } from '../src/incidents.mjs';
import { sources } from '../src/catalog.mjs';

const riskService = id => directoryServices.find(service=>service.id===id);
const riskRecords = id => breachIncidents.filter(record=>record.serviceIds.includes(id));
const riskText = result => result.groups.flatMap(group=>group.items.map(item=>item.text)).join('\n');
const riskScopeText = result => result.groups.find(group=>group.kind==='scope')?.items.map(item=>item.text).join('\n') ?? '';
const riskFixtureService={id:'fixture-mail',name:'メール配信サービス',roles:['user'],groupByRole:{user:'shopping'},supportSourceIds:['support']};
const riskFixtureRecord={id:'fixture-mail-incident',serviceIds:['fixture-mail'],publishedAt:'2026-10-20',status:{code:'possible',label:'漏えいの可能性',text:'メールアドレスが流出した可能性を調査中。'},scope:'メール配信登録者',affectedPeriod:'2026年9月までの登録者',dataTypes:['メールアドレス'],excludedData:'住所・カード番号・パスワードは委託先に保管していない。',officialAction:{text:'不審なメールのリンクを開かず、公式の案内を確認してください。'},sourceIds:['mail-source','mail-source']};
const riskFixtureInput={service:riskFixtureService,topic:'breach',incidents:[riskFixtureRecord]};

test('unselected services show an invitation, without a personalized verdict or generated actions',()=>{
  const result=personalizedRiskGuidance({...riskFixtureInput});
  assert.deepEqual(result.groups,[]);
  assert.deepEqual(result.selectionLabels,[]);
  assert.match(result.intro,/利用状況を選ぶ/);
  assert.deepEqual(personalizedRiskGuidance().groups,[]);
});

test('email-only disclosures offer neither address nor identity choices and do not invent payment exposure',()=>{
  const options=riskOptionsForService(riskFixtureService,'breach','user',[riskFixtureRecord]);
  assert.ok(options.some(option=>option.id==='purchase'));
  assert.ok(!options.some(option=>['address','identity'].includes(option.id)));
  const result=personalizedRiskGuidance({...riskFixtureInput,selections:['purchase','address','identity']});
  assert.equal(result.selectionLabels.length,1);
  assert.match(riskScopeText(result),/住所・カード番号・パスワードは委託先に保管していない/);
  assert.doesNotMatch(riskText(result),/カードを停止|再発行してください|住所が流出|本人確認書類が流出/);
  assert.match(riskText(result),/カード番号などの流出対象とは判断できません/);
  for(const item of result.groups.flatMap(group=>group.items))assert.equal(new Set(item.sourceIds).size,item.sourceIds.length);
});

test('browsing alone does not surface identity data as a personalized information category',()=>{
  const service=riskService('times-car');
  const result=personalizedRiskGuidance({service,selections:['browse'],incidents:riskRecords(service.id)});
  assert.doesNotMatch(riskScopeText(result),/本人確認書類|1,464,800|免許情報|ハッシュ化パスワード/);
  assert.match(riskText(result),/閲覧したという選択だけでは/);
  const combined=personalizedRiskGuidance({service,selections:['browse','account'],incidents:riskRecords(service.id)});
  assert.ok(!combined.groups.flatMap(group=>group.items).some(item=>item.id==='browse'));
});

test('identity selection retains the exact encrypted-image distinctions and source references',()=>{
  const service=riskService('times-car');
  const records=riskRecords(service.id);
  const result=personalizedRiskGuidance({service,selections:['identity'],incidents:records});
  assert.match(riskScopeText(result),/暗号化された本人確認書類画像/);
  assert.match(riskScopeText(result),/1,464,800件.*アクセスのみ確認891,602件/);
  assert.match(riskScopeText(result),/画像の内容が閲覧できたかは別/);
  assert.deepEqual(result.groups.find(group=>group.kind==='official').items[0].sourceIds,[...new Set(records[0].sourceIds)]);
});

test('no-leak and no-confirmation statuses remain distinct and do not trigger extra damage-response advice',()=>{
  for(const id of ['jr-east','view-card','jr-kyushu']) {
    const service=riskService(id);
    const records=riskRecords(id);
    const result=personalizedRiskGuidance({service,selections:['account','purchase','former'],incidents:records});
    assert.ok(result.groups.every(group=>group.kind!=='action'),id);
    assert.ok(riskScopeText(result).includes(records[0].status.label),id);
    assert.ok(riskScopeText(result).includes(records[0].status.text),id);
    assert.doesNotMatch(riskText(result),/安全です|必ず対象外|カードを停止してください|漏えいが確定しました/);
  }
});

test('confirmed and possible records keep their actual status rather than finding individual harm',()=>{
  const possible=personalizedRiskGuidance({...riskFixtureInput,selections:['account']});
  assert.match(riskScopeText(possible),/漏えいの可能性/);
  assert.doesNotMatch(riskScopeText(possible),/あなたの.*流出しました|漏えいを確認/);
  const records=[{...riskFixtureRecord,status:{code:'confirmed',label:'メールアドレスの流出を確認',text:'調査で確認。'}}];
  const confirmed=personalizedRiskGuidance({...riskFixtureInput,incidents:records,selections:['account']});
  assert.match(riskScopeText(confirmed),/メールアドレスの流出を確認/);
  assert.match(confirmed.intro,/あなた個人の被害の有無を判定するものではありません/);
});

test('former usage includes the published period and the official former-member route',()=>{
  const service=riskService('times-car');
  const records=riskRecords(service.id);
  const result=personalizedRiskGuidance({service,selections:['former'],incidents:records});
  assert.ok(riskScopeText(result).includes(records[0].affectedPeriod));
  assert.match(riskText(result),/退会済み・未入会の人は公式FAQの専用窓口/);
  assert.match(riskText(result),/元利用者向けの公式窓口/);
});

test('service-specific choices distinguish deliveries and app membership from a store visit',()=>{
  const sagawa=riskService('sagawa');
  const sagawaOptions=riskOptionsForService(sagawa,'breach','user',riskRecords(sagawa.id));
  assert.match(sagawaOptions.find(option=>option.id==='purchase').label,/荷物を送った・受け取った/);
  const result=personalizedRiskGuidance({service:sagawa,selections:['purchase'],incidents:riskRecords(sagawa.id)});
  assert.match(riskText(result),/会員であるかに加え/);
  const burger=riskService('burger-king');
  const burgerResult=personalizedRiskGuidance({service:burger,selections:['purchase'],incidents:riskRecords(burger.id)});
  assert.match(riskText(burgerResult),/店舗で注文したこととアプリへの会員登録は分けて/);
});

test('PHP and breach guidance do not transfer facts or options between topics',()=>{
  const service=riskService('sakura-rental');
  const options=riskOptionsForService(service,'php','admin');
  assert.deepEqual(options.map(option=>option.id),['manage','delegated','unsure','notice']);
  const result=personalizedRiskGuidance({service,topic:'php',role:'admin',selections:['manage'],incidents:[riskFixtureRecord]});
  assert.match(riskText(result),/緊急対応は不要/);
  assert.match(riskText(result),/10月23日の追加CVEへの個別対応/);
  assert.doesNotMatch(riskText(result),/メール配信登録者|メールアドレスが流出/);
  const breachOnly=riskService('sagawa');
  assert.deepEqual(riskOptionsForService(breachOnly,'php','user',riskRecords('sagawa')),[]);
  assert.deepEqual(personalizedRiskGuidance({service:breachOnly,topic:'php',selections:['account'],incidents:riskRecords('sagawa')}).groups,[]);
});

test('PHP usage follows user role without instructing ordinary visitors to update a server',()=>{
  const service=riskService('note');
  const result=personalizedRiskGuidance({service,topic:'php',role:'user',selections:['browse']});
  assert.match(result.intro,/PHP更新は運営・管理担当者/);
  assert.ok(result.groups.some(group=>group.kind==='action'));
  assert.doesNotMatch(result.groups.find(group=>group.kind==='action').items.map(item=>item.text).join(''),/PHPを更新|ワーカーを再起動/);
});

test('unknown and duplicate selection IDs are removed in visible order; invalid containers are ignored',()=>{
  const options=riskOptionsForService(riskFixtureService,'breach','user',[riskFixtureRecord]);
  assert.deepEqual(normalizeRiskSelections(new Set(['notice','__proto__','account','address']),options),['account','notice']);
  assert.deepEqual(normalizeRiskSelections(['notice','account','account'],options),['account','notice']);
  assert.deepEqual(normalizeRiskSelections('account',options),[]);
  assert.deepEqual(normalizeRiskSelections(['account'],null),[]);
});

test('unlisted records and absent evidence never become a clean bill of health',()=>{
  const result=personalizedRiskGuidance({...riskFixtureInput,incidents:[{...riskFixtureRecord,serviceIds:['different-service']}],selections:['account']});
  assert.match(riskText(result),/まだ掲載されていません/);
  assert.match(riskText(result),/被害の有無は判断できない/);
  assert.doesNotMatch(riskText(result),/メール配信登録者/);
});

test('return values and selections never mutate source records or subsequent results',()=>{
  const input={...riskFixtureInput,selections:['account','former']};
  const expected=personalizedRiskGuidance(input);
  const mutated=personalizedRiskGuidance(input);
  mutated.groups[0].items[0].text='changed';
  mutated.groups[0].items[0].sourceIds.push('changed');
  mutated.selectionLabels.length=0;
  assert.deepEqual(personalizedRiskGuidance(input),expected);
  assert.deepEqual(riskFixtureRecord.sourceIds,['mail-source','mail-source']);
  const options=riskOptionsForService(riskFixtureService,'breach','user',[riskFixtureRecord]);
  options[0].label='changed';
  assert.notEqual(riskOptionsForService(riskFixtureService,'breach','user',[riskFixtureRecord])[0].label,'changed');
});

test('employee-only incidents do not offer insurance purchases or pretend an employment record is an account',()=>{
  for(const id of ['daiichi-life','mitsubishi-gas-chemical','astemo','transcosmos']) {
    const service=riskService(id),records=riskRecords(id);
    const options=riskOptionsForService(service,'breach','user',records);
    assert.ok(options.some(option=>option.id==='relationship'),id);
    assert.ok(!options.some(option=>['account','purchase'].includes(option.id)),id);
    const result=personalizedRiskGuidance({service,selections:['relationship','former'],incidents:records});
    assert.match(riskText(result),/在籍・勤務・採用応募/);
    assert.doesNotMatch(riskText(result),/元利用者向け|退会済みでログイン/);
    assert.ok(riskScopeText(result).includes(records[0].dataTypes[0]),id);
  }
});

test('patient guidance includes people who never registered in the medical app',()=>{
  const service=riskService('medley-atlink'),records=riskRecords(service.id);
  const options=riskOptionsForService(service,'breach','user',records);
  assert.match(options.find(option=>option.id==='account').label,/医療機関を受診/);
  const browse=personalizedRiskGuidance({service,selections:['browse'],incidents:records});
  assert.match(riskText(browse),/アプリ・Web予約を利用していない患者/);
  const former=personalizedRiskGuidance({service,selections:['former'],incidents:records});
  assert.match(riskText(former),/現在は通院していない場合/);
  assert.doesNotMatch(riskText(former),/退会済みでログイン/);
});

test('all catalog roles and topics return coherent groups with resolvable evidence IDs',()=>{
  const allSources={...sources,...breachSources};
  for(const service of directoryServices)for(const topic of service.topics)for(const role of service.roles) {
    const incidents=riskRecords(service.id);
    const options=riskOptionsForService(service,topic,role,incidents);
    for(const selections of [options.map(option=>option.id),...options.map(option=>[option.id])]) {
      const result=personalizedRiskGuidance({service,topic,role,selections,incidents});
      assert.ok(result.groups.length<=3,`${service.id}:${topic}:${role}`);
      const ids=result.groups.flatMap(group=>group.items.map(item=>item.id));
      assert.equal(new Set(ids).size,ids.length,`${service.id}:${topic}:${role}`);
      for(const item of result.groups.flatMap(group=>group.items)) {
        assert.equal(typeof item.text,'string');
        assert.ok(item.text.trim());
        assert.doesNotMatch(item.text,/undefined|null/);
        assert.equal(new Set(item.sourceIds).size,item.sourceIds.length);
        for(const id of item.sourceIds)assert.ok(allSources[id],`${service.id}:${id}`);
      }
    }
  }
});
