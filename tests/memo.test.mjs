import test from 'node:test';
import assert from 'node:assert/strict';
import { createMemoText, memoFilename } from '../src/memo.mjs';

function sampleMemo() {
  return {
    serviceName: 'note', serviceId: 'note', role: 'user', hostname: 'note.com',
    createdAt: '2026-10-24T16:30:00Z', checkedAt: '2026-10-24', lastChangedAt: null, version: '0.5.0',
    usageLabels: ['登録・ログインした'],
    groups: [{ title: 'アカウントの確認', tasks: [{ id: 'account.profile', text: '登録情報を確認する。' }, { id: 'account.history', text: '履歴を確認する。' }] }],
    checkedTaskIds: ['account.profile', 'hidden-task'],
    php: { label: '未確認', text: 'PHP利用は未確認です。' },
    incident: { label: '掲載情報なし', text: '公式説明はまだ掲載していません。' },
    officialAction: { text: '今回の手続きは未確認です。' },
    sources: [{ title: '公式窓口', url: 'https://example.com/help', checkedAt: '2026-10-24', kind: 'support' }],
    caution: '独自ドメインは一致しない場合があります。',
  };
}

test('memo separates facts, official instructions and general selected checklist', () => {
  const text = createMemoText(sampleMemo());
  for (const heading of ['PHPの利用について分かっていること', '対象となる問題についての公式説明', '今回の問題に関する公式の対応案内', 'EpsilonLabの確認メモ']) assert.ok(text.includes(`【${heading}】`));
  assert.match(text, /確認済み: 1 \/ 2 項目/);
  assert.match(text, /\[x\] 登録情報を確認する。/);
  assert.match(text, /\[ \] 履歴を確認する。/);
  assert.doesNotMatch(text, /hidden-task|注文履歴|投稿内容/);
  assert.match(text, /補足: 独自ドメイン/);
});

test('inspection and change dates stay distinct; creation date uses Japan time', () => {
  const text = createMemoText(sampleMemo());
  assert.match(text, /メモ作成日時: 2026-10-25 01:30 \(日本時間\)/);
  assert.match(text, /掲載資料の確認日: 2026-10-24/);
  assert.match(text, /掲載内容の変更日: 未記録/);
  const dated = createMemoText({ ...sampleMemo(), lastChangedAt: '2026-10-23' });
  assert.match(dated, /掲載内容の変更日: 2026-10-23/);
});

test('source links include dates and support is not represented as PHP evidence', () => {
  const input = sampleMemo();
  input.sources.push({ ...input.sources[0] }, { title: '案内', url: 'https://example.com/notice', kind: 'incident', checkedAt: '2026-10-23' });
  const text = createMemoText(input);
  assert.equal(text.match(/https:\/\/example.com\/help/g).length, 1);
  assert.match(text, /公式窓口 \(個別の対応状況を示す根拠ではありません\) \/ 確認日: 2026-10-24/);
  assert.match(text, /公式資料 \/ 確認日: 2026-10-23/);
});

test('administrator memo uses supplied administrator tasks without visitor usage', () => {
  const text = createMemoText({ ...sampleMemo(), role: 'admin', groups: [{ title: '管理する環境', tasks: [{ id: 'admin.0', text: 'PHPの管理担当を確認する。' }] }], checkedTaskIds: new Set(['admin.0']) });
  assert.match(text, /立場: サイトを管理する人/);
  assert.match(text, /確認済み: 1 \/ 1 項目/);
  assert.match(text, /\[x\] PHPの管理担当を確認する。/);
  assert.doesNotMatch(text, /選んだ使い方:|登録情報を確認する。/);
});

test('unknown inputs and invalid dates remain unknown without invented dates', () => {
  for (const value of [undefined, null, {}]) {
    const text = createMemoText(value);
    assert.match(text, /サービス・環境: 掲載情報なし/);
    assert.match(text, /掲載資料の確認日: 未確認/);
    assert.match(text, /確認済み: 0 \/ 0 項目/);
  }
  const text = createMemoText({ checkedAt: '2026-02-30', lastChangedAt: 'today', createdAt: 'today' });
  assert.match(text, /メモ作成日時: 未記録/);
  assert.match(text, /掲載資料の確認日: 未確認/);
});

test('a standalone unknown-service memo retains the explicit target incident', () => {
  const text = createMemoText({ serviceName: '掲載情報なし', role: 'user' });
  assert.match(text, /対象の問題: 2026年10月のPHP問題（PHP2Shellと追加案内）/);
  assert.match(text, /サービス・環境: 掲載情報なし/);
  assert.match(createMemoText({ issueTitle: '別の対象問題\n追加説明' }), /対象の問題: 別の対象問題 追加説明\n/);
});

test('input URL exports hostname only, never path, query or fragment', () => {
  const text = createMemoText({ ...sampleMemo(), hostname: 'https://note.com/private-user/purchase?token=secret#private-fragment' });
  assert.match(text, /照合したドメイン: note.com\n/);
  assert.doesNotMatch(text, /private-user|purchase\?|token=|secret|private-fragment/);
  for (const hostname of ['https://user:secret@note.com/a', 'javascript:alert(1)', 'note.com\nsecret', '@note.com']) {
    assert.doesNotMatch(createMemoText({ ...sampleMemo(), hostname }), /照合したドメイン:/);
  }
});

test('unsafe source schemes, credentials and control characters are omitted', () => {
  const sources = ['javascript:alert(1)', 'http://example.com/', 'https://user:secret@example.com', 'https://example.com/\nspoof'].map(url => ({ title: 'Bad', url }));
  const text = createMemoText({ ...sampleMemo(), sources });
  assert.match(text, /掲載された公式リンクはありません/);
  assert.doesNotMatch(text, /secret|javascript:|spoof/);
});

test('multiline metadata remains one plain text line and cannot inject headings', () => {
  const text = createMemoText({ ...sampleMemo(), serviceName: 'note\n【偽の案内】\r\n<img src=x>', usageLabels: ['閲覧\u2028偽', '閲覧\u2028偽'] });
  assert.match(text, /サービス・環境: note 【偽の案内】 <img src=x>\n/);
  assert.doesNotMatch(text, /\n【偽の案内】/);
  assert.match(text, /選んだ使い方: 閲覧 偽\n/);
});

test('Array and Set checks behave alike and input is not mutated', () => {
  const input = sampleMemo();
  const original = structuredClone(input);
  assert.equal(createMemoText({ ...input, checkedTaskIds: new Set(input.checkedTaskIds) }), createMemoText(input));
  assert.deepEqual(input, original);
});

test('memo filenames are ASCII, use Japan date and do not accept path or hostname input', () => {
  assert.equal(memoFilename(sampleMemo()), 'epsilon-service-memo-2026-10-25-note-user.txt');
  assert.equal(memoFilename({ createdAt: '2026-10-24', serviceId: 'wordpress-com', role: 'admin' }), 'epsilon-service-memo-2026-10-24-wordpress-com-admin.txt');
  assert.equal(memoFilename({ serviceId: '../../secret?token=abc', role: '../user', hostname: 'private.example' }), 'epsilon-service-memo-undated-unknown-unknown.txt');
  assert.equal(memoFilename(null), 'epsilon-service-memo-undated-unknown-unknown.txt');
  assert.match(memoFilename({ ...sampleMemo(), serviceId: '日本語' }), /^[\x20-\x7e]+$/);
});


function breachSample() {
  return {
    ...sampleMemo(), includeBreaches: true,
    breachIncidents: [
      { id: 'case-one', title: '一つ目の事案', publishedAt: '2026-10-03', updatedAt: '2026-10-08', occurredAt: '2026年9月', affectedPeriod: '2026年9月の登録者', scope: '特定機能の利用者', dataTypes: ['メールアドレス'], excludedData: '住所は含まれないと説明', status: { label: '流出を確認', text: '一部利用者が対象。' }, providerResponse: { label: '対策を実施', text: 'アクセス経路を遮断。' }, officialAction: { text: '個別の通知を確認する。' }, sourceIds: ['first', 'followup'], history: [{ date: '2026-10-09', title: '初回掲載' }], caution: '全利用者の情報ではありません。' },
      { id: 'case-two', title: '二つ目の事案', publishedAt: '2026-10-15', status: { label: '可能性あり', text: '調査中。' }, providerResponse: { label: '調査中', text: '範囲を確認中。' }, sourceIds: ['second'], dataTypes: ['氏名'] },
    ],
    breachSources: [
      { id: 'first', title: '初報', url: 'https://example.com/first', checkedAt: '2026-10-20', kind: 'incident' },
      { id: 'followup', title: '続報', url: 'https://example.com/followup', checkedAt: '2026-10-24', kind: 'incident' },
      { id: 'second', title: '第二の事案の公式説明', url: 'https://example.com/second', checkedAt: '2026-10-23', kind: 'incident' },
    ],
    breachContextLabels: ['以前使っていた'],
    breachGroups: [{ title: '対象範囲の確認', tasks: [{ id: 'breach.scope', text: '自分の利用時期を確認する。' }, { id: 'breach.notice', text: '公式通知を確認する。' }] }],
    breachCheckedTaskIds: new Set(['breach.notice', 'account.history']),
  };
}

test('combined memo keeps each incident scope, status, provider response and sources separate', () => {
  const text = createMemoText(breachSample());
  assert.match(text, /^EpsilonLab \| ネットサービスの確認メモ/);
  assert.match(text, /対象の問題: PHPの問題・情報流出の掲載情報/);
  const first = text.slice(text.indexOf('事案 1:'), text.indexOf('事案 2:'));
  const second = text.slice(text.indexOf('事案 2:'), text.indexOf('【情報流出について、自分で確かめること】'));
  assert.match(first, /情報流出の状態: 流出を確認/);
  assert.match(first, /事業者の対応状況: 対策を実施/);
  assert.match(first, /事案の掲載資料の確認日: 2026-10-20/);
  assert.match(first, /事案の掲載内容の変更日: 2026-10-09/);
  assert.match(first, /根拠資料: \[2\] \[3\]/);
  assert.match(second, /情報流出の状態: 可能性あり/);
  assert.match(second, /事案の掲載資料の確認日: 2026-10-23/);
  assert.match(second, /事案の掲載内容の変更日: 未記録/);
  assert.doesNotMatch(second, /アクセス経路を遮断|メールアドレス|特定機能/);
});

test('PHP and breach checklist state is independent and only active tasks are counted', () => {
  const input = breachSample();
  const original = structuredClone(input);
  const text = createMemoText(input);
  assert.match(text, /\[x\] 登録情報を確認する。/);
  assert.match(text, /\[ \] 履歴を確認する。/);
  assert.match(text, /\[ \] 自分の利用時期を確認する。/);
  assert.match(text, /\[x\] 公式通知を確認する。/);
  assert.equal(text.match(/確認済み: 1 \/ 2 項目/g).length, 2);
  assert.deepEqual(input, original);
});

test('breach-only memo excludes PHP facts, tasks, cautions and sources', () => {
  const text = createMemoText({ ...breachSample(), includePhp: false });
  assert.match(text, /対象の問題: 情報流出の掲載情報/);
  assert.match(text, /事案 1: 一つ目の事案/);
  assert.match(text, /選んだ利用状況: 以前使っていた/);
  assert.doesNotMatch(text, /PHP|登録情報を確認する|独自ドメイン|https:\/\/example.com\/help/);
  assert.equal(text.match(/確認済み:/g).length, 1);
});

test('no recorded breach means limited coverage, not no harm or safe', () => {
  const text = createMemoText({ includePhp: false, includeBreaches: true, breachIncidents: [] });
  assert.match(text, /このメモには掲載されていません/);
  assert.match(text, /被害がないことや安全であることを示すものではありません/);
  assert.match(text, /公式のお知らせも確認してください/);
  assert.doesNotMatch(text, /PHP/);
});

test('unread or missing incident sources never acquire a fresh date from other sources', () => {
  const input = breachSample();
  input.breachIncidents[0].sourceIds.push('missing');
  input.breachIncidents[1].history = [{ date: '2026-02-30' }];
  const text = createMemoText(input);
  const first = text.slice(text.indexOf('事案 1:'), text.indexOf('事案 2:'));
  assert.match(first, /事案の掲載資料の確認日: 未確認/);
  assert.match(text, /事案の掲載内容の変更日: 未記録/);
});

test('breach strings stay on one line and shared source URLs are listed once', () => {
  const input = breachSample();
  input.breachIncidents[0].title = '事案\n【偽の案内】';
  input.breachIncidents[0].dataTypes = ['メール\u2028アドレス'];
  input.breachSources.push({ ...input.sources[0], id: 'shared' });
  input.breachIncidents[0].sourceIds.push('shared');
  const text = createMemoText(input);
  assert.match(text, /事案 1: 事案 【偽の案内】\n/);
  assert.match(text, /対象となる情報: メール アドレス\n/);
  assert.doesNotMatch(text, /\n【偽の案内】/);
  assert.equal(text.match(/https:\/\/example.com\/help/g).length, 1);
});

test('export retains evidence limitations when an official document was read through a reproduction', () => {
  const text = createMemoText({ includePhp: false, includeBreaches: true, breachSources: [{
    id: 'reproduced', title: '公式告知', url: 'https://example.com/notice.pdf', checkedAt: '2026-10-25', kind: 'incident',
    verificationNote: '公式PDFの直接取得は未完了。公式文書の転載画像を確認。',
  }] });
  assert.match(text, /公式PDFの直接取得は未完了/);
  assert.match(text, /公式文書の転載画像を確認/);
});
