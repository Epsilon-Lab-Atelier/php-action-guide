/** Usage describes what a visitor did, never a risk level or incident finding. */
export const usageOptions = Object.freeze([
  { id: 'account', label: '登録・ログインした', short: '以前作ったアカウントも', icon: 'key' },
  { id: 'browse', label: '見たり読んだりした', short: '閲覧・視聴・検索など', icon: 'book' },
  { id: 'purchase', label: '購入・支払いをした', short: '注文・定期購入・支援など', icon: 'bag' },
  { id: 'sell', label: '出品・販売をした', short: 'ショップ・作品の販売など', icon: 'shop' },
  { id: 'post', label: '投稿・アップロードした', short: '文章・写真・ファイルなど', icon: 'pen' },
].map(option => Object.freeze(option)));

/** Accept checkbox state as an array or Set, with a stable display order. */
export function normalizeUsage(ids) {
  const values = Array.isArray(ids) || ids instanceof Set ? new Set(ids) : new Set();
  return usageOptions.filter(option => values.has(option.id)).map(option => option.id);
}

const commonGroup = {
  id: 'common',
  title: '最初に、公式のお知らせを',
  tasks: [
    { id: 'common.official-notice', text: '公式サイトや公式アプリで、今回の問題に関する案内が出ているかを確認する。案内があれば、対象となる機能・期間と必要な手続きを確かめる。' },
  ],
};

const usageGroups = {
  sell: {
    id: 'sell',
    title: '出品やショップの運営',
    tasks: [
      { id: 'sell.notice', text: '出店者・販売者向けの公式案内を確認する。購入者向けとは、対象の機能や必要な手続きが異なる場合があります。' },
      { id: 'sell.records', text: '注文・売上・振込先の情報に、身に覚えのない変更がないかを確認する。気になる点があれば、公式の販売者向け窓口へ相談する。' },
      { id: 'sell.management', text: '自分でサイトやサーバーも管理している場合は、「サイトを管理する人」の案内も確認する。出品しているだけで、サーバーの管理者になるわけではありません。' },
    ],
  },
  account: {
    id: 'account',
    title: 'アカウントに残っている情報',
    tasks: [
      { id: 'account.profile', text: '公式のアカウント画面で、登録した情報を確認する。以前作ったままのアカウントも、覚えている範囲で確かめる。' },
      { id: 'account.activity', text: 'ログイン履歴が提供されていれば確認する。身に覚えのないログインや登録情報の変更があれば、公式ヘルプで保護の手続きを確認する。' },
    ],
  },
  browse: {
    id: 'browse',
    title: '見たり読んだりしたとき',
    tasks: [
      { id: 'browse.scope', text: '公式の案内が出ている場合は、利用したページや機能が対象に含まれるかを確認する。利用した時期がわかれば、その期間も照らし合わせる。' },
      { id: 'browse.unexpected-screen', text: 'いつもと違う画面や警告に気づいた場合は、その場で手続きを進めず、公式の案内から状況を確認する。' },
    ],
  },
  purchase: {
    id: 'purchase',
    title: '注文や支払いの記録',
    tasks: [
      { id: 'purchase.history', text: '注文履歴や支払いの利用明細で、取引が完了しているか、身に覚えのない請求がないかを確認する。不明な取引は、サービスや決済元の公式窓口で確認する。' },
      { id: 'purchase.subscription', text: '定期購入や支援をしている場合は、契約内容や次回の請求と、継続利用に関する公式案内を確認する。' },
    ],
  },
  post: {
    id: 'post',
    title: '投稿や共有の設定',
    tasks: [
      { id: 'post.visibility', text: '投稿・アップロードした内容と公開範囲を確認する。公開、限定公開、非公開など、意図した共有設定になっているかを確かめる。' },
      { id: 'post.changes', text: '身に覚えのない投稿や変更があれば、公式ヘルプから対応を確認する。自分の端末に原本がある場合は、見比べられるよう手元に残しておく。' },
    ],
  },
};

const unselectedGroup = {
  id: 'unselected',
  title: '使い方をまだ選んでいないとき',
  tasks: [
    { id: 'unselected.choose-usage', text: '過去の利用も含めて、登録・閲覧・購入・販売・投稿のうち、思い当たる使い方を選ぶ。覚えていなければ、選ばずに公式の案内を確認する。' },
  ],
};

/** Return fresh, grouped general guidance; the catalog supplies incident facts. */
export function guidanceForUsage(ids) {
  const selected = normalizeUsage(ids);
  const seen = new Set();
  const groups = [commonGroup, ...(selected.length ? selected.map(id => usageGroups[id]) : [unselectedGroup])]
    .map(group => ({
      id: group.id,
      title: group.title,
      tasks: group.tasks.filter(task => {
        if (seen.has(task.id)) return false;
        seen.add(task.id);
        return true;
      }).map(task => ({ ...task })),
    }))
    .filter(group => group.tasks.length);
  return {
    heading: selected.length ? 'あなたの使い方に合わせた確認メモ' : 'まずは、公式の案内から。',
    intro: 'サーバー側のPHP更新は、サービスを管理する人の作業です。ここでは利用者として確認できることを整理します。今回の問題への対応指示は、各サービスの公式案内をご確認ください。',
    groups,
  };
}
