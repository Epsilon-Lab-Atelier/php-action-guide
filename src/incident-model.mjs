// Presentation helpers only. These checks never decide whether a person was affected.
function incidentModelCopy(value) {
  if (Array.isArray(value)) return value.map(incidentModelCopy);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, incidentModelCopy(item)]));
  return value;
}

function incidentModelDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : null;
}

/** Match only explicit service IDs; related companies and products are not inferred. */
export function incidentsForService(records, serviceId) {
  if (!Array.isArray(records) || typeof serviceId !== 'string' || !serviceId) return [];
  return records.filter(record => record && Array.isArray(record.serviceIds) && record.serviceIds.includes(serviceId))
    .map(incidentModelCopy)
    .sort((left, right) => (incidentModelDate(right.publishedAt) ?? '').localeCompare(incidentModelDate(left.publishedAt) ?? ''));
}

/** A partial reread must not refresh the whole incident; publication is not a check date. */
export function incidentMetadata(record, sourceMap = {}) {
  if (!record || typeof record !== 'object') return { checkedAt: null, lastChangedAt: null };
  const ids = [...new Set((Array.isArray(record.sourceIds) ? record.sourceIds : []).filter(id => typeof id === 'string' && id))];
  const dates = ids.map(id => incidentModelDate(sourceMap && Object.hasOwn(sourceMap, id) ? sourceMap[id]?.checkedAt : null));
  const changes = (Array.isArray(record.history) ? record.history : []).map(event => incidentModelDate(event?.date)).filter(Boolean).sort();
  return {
    checkedAt: dates.length && dates.every(Boolean) ? dates.sort()[0] : null,
    lastChangedAt: changes.at(-1) ?? null,
  };
}

export const breachContextOptions = Object.freeze([
  Object.freeze({ id: 'former', label: '以前使っていた・退会済み', short: '過去の登録や利用も含める' }),
  Object.freeze({ id: 'address', label: '住所・配送先を登録した', short: '氏名・電話番号なども確認' }),
  Object.freeze({ id: 'payment', label: '支払いに使った', short: '購入・契約・有料プランなど' }),
  Object.freeze({ id: 'notice', label: '個別のお知らせが届いた', short: '通知の対象と手続きを確認' }),
]);

export function normalizeBreachContext(ids) {
  const selected = new Set(Array.isArray(ids) || ids instanceof Set ? ids : []);
  return breachContextOptions.filter(option => selected.has(option.id)).map(option => option.id);
}

const incidentModelCommon = {
  id: 'breach.common', title: 'まず、公式の説明を確かめる', tasks: [
    { id: 'breach.common.notice', text: '公式アプリやいつものブックマークからお知らせを開き、サービス名・公表日・続報を確認する。' },
    { id: 'breach.common.scope', text: '対象となる利用者・利用期間・情報の種類を確認する。自分が対象か判断できない場合は、公式窓口の案内を確かめる。' },
    { id: 'breach.common.phishing', text: '流出の確認や補償を名目に届いたメール・SMSのリンクから、パスワードや決済情報を入力しない。手続きは公式サイト・公式アプリから確かめる。' },
  ],
};

const incidentModelAdmin = {
  id: 'breach.admin', title: '管理する環境との関係を確かめる', tasks: [
    { id: 'breach.admin.scope', text: '公式告知で対象のサービス・契約・ホスト・期間を確認し、自分が管理する環境との関係を整理する。同じ事業者を利用していることだけで、対象とは判断しない。' },
    { id: 'breach.admin.response', text: '事業者からの個別通知と管理者向け手順を確認し、必要な確認や作業を保守担当者と進める。作業の完了と、情報流出の有無は別に記録する。' },
    { id: 'breach.admin.users', text: '自分のサイトの利用者に影響する可能性がある場合は、確認できた範囲と不明点を分け、運営元・保守担当者の案内に沿って対応を整理する。' },
  ],
};

const incidentModelContexts = {
  former: { id: 'breach.former', title: '以前の利用や退会について', tasks: [
    { id: 'breach.former.period', text: '過去の登録・購入・利用の時期を、公式発表の対象期間と照らし合わせる。退会したことだけで対象外とは判断しない。' },
    { id: 'breach.former.contact', text: 'ログインできない場合は、元利用者向けの案内や問い合わせ窓口を確認する。確認のために新しく登録する必要があるかは、公式の案内に従う。' },
  ] },
  address: { id: 'breach.address', title: '登録した住所や連絡先について', tasks: [
    { id: 'breach.address.types', text: '氏名・住所・電話番号・配送先などのうち、公式発表が対象としている情報を確認する。登録したことだけで、その情報が流出したとは判断しない。' },
    { id: 'breach.address.messages', text: '自分の氏名や住所を知っている相手からの連絡でも、それだけで信用せず、問い合わせや手続きは公式窓口から確かめる。' },
  ] },
  payment: { id: 'breach.payment', title: '支払いの情報について', tasks: [
    { id: 'breach.payment.scope', text: '購入履歴・請求先・カード情報など、公式発表で対象となる情報と対象外とされる情報を区別する。支払いをしたことだけで、カード番号の流出とは判断しない。' },
    { id: 'breach.payment.statement', text: '支払い元の公式アプリや利用明細で、身に覚えのない請求がないかを確認する。不明な請求があれば、支払い元の公式窓口へ相談する。' },
    { id: 'breach.payment.action', text: '支払い方法の停止・再発行などが案内されている場合は、その対象と手順を確認する。判断に迷う場合は、サービスや支払い元の公式窓口で確かめる。' },
  ] },
  notice: { id: 'breach.notice', title: '届いたお知らせについて', tasks: [
    { id: 'breach.notice.authenticity', text: '届いた通知と同じ内容が公式サイト・公式アプリにあるか確認する。見つからない場合は、通知内の連絡先だけに頼らず公式窓口へ確認する。' },
    { id: 'breach.notice.action', text: '個別通知に書かれた対象範囲・必要な手続き・期限を確認する。通知や問い合わせの記録は手元に残し、この画面に個人情報を入力しない。' },
  ] },
};

/** Contexts choose reading/checking steps, never an exposure score or diagnosis. */
export function breachGuidance(contextIds, role = 'user') {
  const selected = normalizeBreachContext(contextIds);
  return { groups: [incidentModelCommon, ...(role === 'admin' ? [incidentModelAdmin] : []), ...selected.map(id => incidentModelContexts[id])].map(incidentModelCopy) };
}
