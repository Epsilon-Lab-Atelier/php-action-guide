# サービス別の使い方

`src/usage-profiles.mjs` は、掲載済み14サービスについて、このガイドで扱う主な利用方法を設定しています。サービスの全機能を列挙した一覧ではありません。選択肢がないことから、その機能が存在しない、または今回の問題の影響がないとは判断しません。画面には `usageScopeForService()` の説明も表示してください。

| サービス | 主な選択肢 |
| --- | --- |
| note | 登録・閲覧・購入支援・有料記事やプラン運営・投稿 |
| WordPress.com | 登録・閲覧・プラン購入・投稿 |
| pixiv | 登録・閲覧・有料サービス・作品投稿 |
| BOOTH | 登録・閲覧・購入・商品販売 |
| Amazon.co.jp | 登録・商品閲覧・購入・レビュー |
| 楽天市場 | 登録・商品閲覧・購入・レビュー |
| Yahoo!ショッピング | 登録・商品閲覧・購入・レビュー |
| メルカリ | 登録・商品閲覧・購入・出品販売・コメントや取引メッセージ |
| BASE | 登録・ショップ閲覧・購入・ショップ運営 |
| YouTube | 登録・視聴・有料サービス・動画やコメント投稿 |
| Instagram | 登録・閲覧・投稿やメッセージ |
| X | 登録・閲覧・有料サービス・投稿やメッセージ |
| LINE | 登録・トーク閲覧・スタンプなどの購入・メッセージ送信 |
| pixiv FANBOX | 登録・閲覧・支援・支援プラン運営・投稿 |

Amazon.co.jp、楽天市場、Yahoo!ショッピングは現在のカタログと同じく買い物側の案内を中心とします。出店・販売は出店者向け公式案内で確認します。WordPress.comのショップ、Instagramの課金機能など、このガイドで個別に扱っていない利用方法もあります。

## 一般的な確認手順

- LINEとメルカリのメッセージには、投稿の公開範囲を確認する手順を当てはめません。
- 買い物サイトの投稿には、レビューや写真の確認手順を使います。
- noteとFANBOXの収益化には、出店者向けではなくクリエイター向けの案内を確認するよう説明します。
- 有料サービスへの支払いには、商品配送や注文履歴を前提としない確認手順を使います。
- これらはEpsilonLabが整理した一般的な手順です。今回のPHP問題の公式な対応指示や影響範囲ではありません。

## 参照資料

既存カタログに掲載している公式ヘルプ・サービス概要に加え、2026-10-24に以下の公式資料を確認しました。機能名の整理に用いた資料であり、PHP利用や修正状況を示す根拠ではありません。料金・契約条件・対象地域は、このガイドには転載していません。

- [LINE: スタンプ・絵文字の購入](https://guide.line.me/ja/customization/purchase-stickers.html)
- [pixiv: プレミアムとは](https://www.pixiv.help/hc/ja/articles/231827668-pixiv%E3%83%97%E3%83%AC%E3%83%9F%E3%82%A2%E3%83%A0%E3%81%A8%E3%81%AF)
- [YouTube: メンバーシップの登録・変更・解約](https://support.google.com/youtube/answer/6304294?co=GENIE.Platform&hl=ja)
- [note: メンバーシップとは](https://www.help-note.com/hc/ja/articles/900000163906-%E3%83%A1%E3%83%B3%E3%83%90%E3%83%BC%E3%82%B7%E3%83%83%E3%83%97%E3%81%A8%E3%81%AF)
- [X: プレミアムについて](https://help.x.com/ja/using-x/x-premium)
- [WordPress.com: 購入を管理する](https://wordpress.com/ja/support/manage-purchases/)
- [FANBOX: クリエイターの支援金の受け取り](https://fanbox.pixiv.help/hc/ja/articles/360005114953-%E3%82%AF%E3%83%AA%E3%82%A8%E3%82%A4%E3%82%BF%E3%83%BC%E3%81%AF%E3%81%84%E3%81%A4-%E3%81%A9%E3%81%AE%E3%82%88%E3%81%86%E3%81%AB%E6%94%AF%E6%8F%B4%E9%87%91%E3%82%92%E5%8F%97%E3%81%91%E5%8F%96%E3%82%8C%E3%81%BE%E3%81%99%E3%81%8B)
- [Amazon: カスタマーレビューの案内](https://sell.amazon.co.jp/learn/customer-reviews)
- [楽天市場: レビューへの画像・動画の投稿](https://ichiba.faq.rakuten.net/detail/000006744)
- [Yahoo!ショッピング: 商品レビューの案内](https://support.yahoo-net.jp/SccShopping/s/article/H000009446)

## テスト

`node --test tests/usage-profiles.test.mjs` で、14サービスの網羅、全選択組合せ、サービス変更時の選択の除外、未登録・管理者項目のフォールバック、文言の区別、返却値の独立性を確認します。
