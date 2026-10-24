import { usageOptions, normalizeUsage, guidanceForUsage } from './usage.mjs';

// These profiles describe the guide's scope, not every feature of each service.
// They neither identify affected users nor change incident facts in the catalog.
const serviceUsageProfiles = {
  note: { ids: ['account', 'browse', 'purchase', 'sell', 'post'], words: {
    browse: ['記事を読んだ', '無料記事・有料記事など'],
    purchase: ['購入・支援をした', '有料記事・メンバーシップなど'],
    sell: ['有料記事・プランを運営した', '販売・支援の受け取りなど'],
    post: ['記事・コメントを投稿した', '文章・写真などの公開'],
  } },
  'wordpress-com': { ids: ['account', 'browse', 'purchase', 'post'], words: {
    browse: ['ブログを読んだ', '記事の閲覧など'],
    purchase: ['プランなどを購入した', 'WordPress.comへの支払い'],
    post: ['記事・コメントを投稿した', 'ブログ・画像の公開など'],
  } },
  pixiv: { ids: ['account', 'browse', 'purchase', 'post'], words: {
    browse: ['作品を見たり読んだりした', 'イラスト・漫画・小説など'],
    purchase: ['有料サービスを利用した', 'pixivプレミアムなど'],
    post: ['作品・コメントを投稿した', 'イラスト・漫画・小説など'],
  } },
  booth: { ids: ['account', 'browse', 'purchase', 'sell'], words: {
    browse: ['商品を見た', 'ショップ・商品ページなど'],
    sell: ['商品を販売した', 'ショップ運営・売上の受け取り'],
  } },
  'amazon-jp': { ids: ['account', 'browse', 'purchase', 'post'], words: {
    browse: ['商品を見たり探したりした', 'Amazon.co.jpの買い物'],
    post: ['レビューなどを投稿した', '評価・文章・写真など'],
  } },
  'rakuten-ichiba': { ids: ['account', 'browse', 'purchase', 'post'], words: {
    browse: ['商品を見たり探したりした', '楽天市場の買い物'],
    post: ['レビューなどを投稿した', '評価・文章・写真など'],
  } },
  'yahoo-shopping': { ids: ['account', 'browse', 'purchase', 'post'], words: {
    browse: ['商品を見たり探したりした', 'Yahoo!ショッピングの買い物'],
    post: ['レビューなどを投稿した', '評価・文章・写真など'],
  } },
  mercari: { ids: ['account', 'browse', 'purchase', 'sell', 'post'], words: {
    browse: ['商品を見たり探したりした', 'フリマの商品検索など'],
    post: ['コメント・メッセージを送った', '商品コメント・取引のやりとり'],
  } },
  base: { ids: ['account', 'browse', 'purchase', 'sell'], words: {
    browse: ['ショップ・商品を見た', 'BASEを利用したショップ'],
    sell: ['ショップを運営した', '商品の販売・売上の受け取り'],
  } },
  youtube: { ids: ['account', 'browse', 'purchase', 'post'], words: {
    browse: ['動画を見た', '動画・ライブ配信の視聴など'],
    purchase: ['有料サービスを利用した', 'チャンネルメンバーシップなど'],
    post: ['動画・コメントを投稿した', '動画・ライブ配信など'],
  } },
  instagram: { ids: ['account', 'browse', 'post'], words: {
    browse: ['写真・動画を見た', '投稿・ストーリーズなど'],
    post: ['投稿・メッセージを送った', '写真・動画・コメントなど'],
  } },
  x: { ids: ['account', 'browse', 'purchase', 'post'], words: {
    browse: ['投稿を読んだ', 'タイムライン・検索など'],
    purchase: ['有料サービスを利用した', 'Xプレミアムなど'],
    post: ['投稿・メッセージを送った', 'ポスト・返信・DMなど'],
  } },
  line: { ids: ['account', 'browse', 'purchase', 'post'], words: {
    browse: ['届いたトークなどを読んだ', 'メッセージ・画像の閲覧など'],
    purchase: ['スタンプなどを購入した', 'スタンプ・絵文字など'],
    post: ['メッセージ・写真を送った', 'トークでのやりとりなど'],
  } },
  fanbox: { ids: ['account', 'browse', 'purchase', 'sell', 'post'], words: {
    browse: ['投稿を読んだ', 'クリエイターの投稿など'],
    purchase: ['クリエイターを支援した', '支援プランへの支払い'],
    sell: ['支援プランを運営した', 'クリエイターとして支援を受けた'],
    post: ['記事・コメントを投稿した', '画像・ファイルの公開など'],
  } },
};

export const usageProfileServiceIds = Object.freeze(Object.keys(serviceUsageProfiles));

function serviceUsageProfile(service) {
  if (!service || (Array.isArray(service.roles) && !service.roles.includes('user'))) return null;
  return Object.hasOwn(serviceUsageProfiles, service.id) ? serviceUsageProfiles[service.id] : null;
}

/** Always return fresh objects; callers may customize labels without leaking state. */
export function usageOptionsForService(service) {
  const profile = serviceUsageProfile(service);
  return usageOptions.filter(option => !profile || profile.ids.includes(option.id)).map(option => {
    const words = profile?.words[option.id];
    return { ...option, ...(words ? { label: words[0], short: words[1] } : {}) };
  });
}

export function normalizeServiceUsage(ids, service) {
  const allowed = new Set(usageOptionsForService(service).map(option => option.id));
  return normalizeUsage(ids).filter(id => allowed.has(id));
}

const serviceReviewIds = new Set(['amazon-jp', 'rakuten-ichiba', 'yahoo-shopping']);
const servicePaymentIds = new Set(['wordpress-com', 'pixiv', 'youtube', 'x', 'line', 'fanbox']);
const serviceMessageIds = new Set(['line', 'mercari']);

/** Editorial general checks, clearly separate from the catalog's official advice. */
export function guidanceForServiceUsage(ids, service) {
  const result = guidanceForUsage(normalizeServiceUsage(ids, service));
  const profile = serviceUsageProfile(service);
  if (!profile) return result;
  for (const group of result.groups) {
    if (group.id === 'unselected') {
      group.tasks[0].text = '画面に表示された使い方から、過去の利用も含めて思い当たるものを選ぶ。覚えていなければ、選ばずに公式の案内を確認する。';
    }
    if (group.id === 'purchase' && servicePaymentIds.has(service.id)) {
      group.title = service.id === 'fanbox' ? '支援や支払いの記録' : '購入や契約・支払いの記録';
      group.tasks[0].text = '公式の購入履歴や契約画面、支払い元の利用明細で、身に覚えのない購入・請求がないかを確認する。不明な点はサービスや支払い元の公式窓口で確認する。';
    }
    if (group.id === 'post' && serviceReviewIds.has(service.id)) {
      group.title = '投稿したレビューや写真';
      group.tasks[0].text = '公式の投稿履歴などで、レビューや掲載した写真に身に覚えのない内容・変更がないかを確認する。';
      group.tasks[1].text = '自分が投稿していない内容が見つかった場合は、公式ヘルプからアカウント保護や問い合わせの手順を確認する。';
    }
    if (group.id === 'post' && serviceMessageIds.has(service.id)) {
      group.title = service.id === 'line' ? '送信したメッセージや写真' : 'コメントや取引メッセージ';
      group.tasks[0].text = '公式アプリで、送信したメッセージや写真に身に覚えのないものがないかを確認する。相手とのやりとりを公開する必要はありません。';
      group.tasks[1].text = '身に覚えのない送信や操作があれば、公式ヘルプからアカウント保護や問い合わせの手順を確認する。';
    }
    if (group.id === 'post' && ['instagram', 'x'].includes(service.id)) {
      group.title = '投稿・メッセージと共有設定';
      group.tasks[0].text = '投稿の内容や公開範囲、送信したメッセージに身に覚えのない変更がないかを確認する。投稿と個別のやりとりは、それぞれの画面で確かめる。';
    }
    if (group.id === 'sell' && ['note', 'fanbox'].includes(service.id)) {
      group.title = service.id === 'note' ? '有料記事やプランの運営' : '支援プランと支援金の受け取り';
      group.tasks[0].text = 'クリエイター向けの公式案内で、記事やプランの運営、売上・支援金の受け取りについて必要な手続きがあるかを確認する。';
      group.tasks[1].text = '管理画面でプランの内容、売上・支援金、振込先に身に覚えのない変更がないかを確認する。不明な点は公式窓口へ相談する。';
      group.tasks[2].text = 'サービス内で記事やプランを管理することと、サーバーの保守は別です。外部サイトのサーバーも自分で管理している場合は、「サイトを管理する人」の案内も確認する。';
    }
  }
  return result;
}

/** A scope hint prevents hidden choices from being mistaken for unavailable features. */
export function usageScopeForService(service) {
  if (!serviceUsageProfile(service)) return '使い方がわからない場合も、共通の確認事項をご覧いただけます。';
  if (serviceReviewIds.has(service.id)) return 'ここでは買い物・レビューの利用を扱います。出店・販売は出店者向けの公式案内もご確認ください。';
  return 'このガイドで扱う主な使い方です。表示のない機能や関連サービスは、それぞれの公式案内をご確認ください。';
}
