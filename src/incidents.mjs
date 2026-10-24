// Official disclosures are separate from PHP patch status. No personal exposure diagnosis.
export const breachSources = {
  "breachSocial1Source1": {
    "title": "LINE GAMEユーザー内部識別子の外部送信に関するお知らせとお詫び",
    "url": "https://www.lycorp.co.jp/ja/privacy-security/announcement/020632/",
    "checkedAt": "2026-10-25",
    "publishedAt": "2026-07-13",
    "updatedAt": null,
    "kind": "incident"
  },
  "breachSocial1Source2": {
    "title": "LINE GAMEユーザー内部識別子の外部送信に関する総務省からの行政指導について",
    "url": "https://www.lycorp.co.jp/ja/privacy-security/announcement/020695/",
    "checkedAt": "2026-10-25",
    "publishedAt": "2026-07-31",
    "updatedAt": null,
    "kind": "incident"
  },
  "breachSocial2Source1": {
    "title": "「LINE公式アカウント」誤表示による情報漏えいのお知らせとお詫び",
    "url": "https://www.lycorp.co.jp/ja/privacy-security/announcement/019924/",
    "checkedAt": "2026-10-25",
    "publishedAt": "2025-12-09",
    "updatedAt": null,
    "kind": "incident"
  },
  "breachSocial3Source1": {
    "title": "noteでソースコードからIPアドレスが確認できた事態に関する追加報告とお詫び",
    "url": "https://note.jp/n/n2115642a4e45",
    "checkedAt": "2026-10-25",
    "publishedAt": "2020-09-30",
    "updatedAt": "2021-09-09",
    "kind": "incident"
  },
  "breachXserver2026": {
    "title": "エックスサーバー：委託先メール配信サービス「ブラストメール」における個人情報の漏洩に関するお詫びとお知らせ",
    "url": "https://www.xserver.ne.jp/news_detail.php?view_id=19739",
    "checkedAt": "2026-10-25",
    "publishedAt": "2026-10-23",
    "updatedAt": null,
    "kind": "incident"
  },
  "breachSakura2026": {
    "title": "さくらインターネット：不正アクセスの調査結果と再発防止策（第三報）",
    "url": "https://www.sakura.ad.jp/corporate/information/newsreleases/2026/09/10/1968225692/",
    "checkedAt": "2026-10-24",
    "publishedAt": "2026-09-10",
    "updatedAt": null,
    "kind": "incident"
  },
  "breachSakuraSecond2026": {
    "title": "さくらインターネット：当社システムへの不正アクセスに関するお知らせ（第二報）",
    "url": "https://www.sakura.ad.jp/corporate/information/newsreleases/2026/08/19/1968225633/",
    "checkedAt": "2026-10-24",
    "publishedAt": "2026-08-19",
    "updatedAt": "2026-08-26",
    "kind": "incident"
  },
  "breachSakuraFaq2026": {
    "title": "さくら：当社システムへの不正アクセスに関するご案内",
    "url": "https://help.sakura.ad.jp/unauth-access-faq/",
    "checkedAt": "2026-10-24",
    "publishedAt": null,
    "updatedAt": "2026-09-10",
    "kind": "incident"
  },
  "breachConoha2026": {
    "title": "ConoHa WING：一部収容ホストへの第三者による不正アクセスに関するお詫びとお知らせ",
    "url": "https://www.conoha.jp/wing/news/?ap=2015054834&btn_id=wing-news--news_wing-news",
    "checkedAt": "2026-10-25",
    "publishedAt": "2026-09-20",
    "updatedAt": null,
    "kind": "incident"
  }
};

export const breachIncidents = [
  {
    "id": "line-game-identifiers-2026",
    "serviceIds": [
      "line"
    ],
    "title": "LINE GAME 3作品の内部識別子の外部送信",
    "type": "breach",
    "publishedAt": "2026-07-13",
    "updatedAt": "2026-07-31",
    "occurredAt": "LINE ポコポコ: 2022-05-25〜2026-04-02。LINE ポコパンタウン: 2022-05-25〜2026-04-03。LINE ポコパン: 2022-05-25〜2025-06-11（終了日）。",
    "affectedPeriod": "LINE ポコポコ: 2022-05-25〜2026-04-02。LINE ポコパンタウン: 2022-05-25〜2026-04-03。LINE ポコパン: 2022-05-25〜2025-06-11（終了日）。",
    "scope": "この3作品を対象期間中に利用したユーザー。LINE全利用者が対象という意味ではない。",
    "dataTypes": [
      "ゲーム利用者の内部識別子"
    ],
    "excludedData": "氏名・住所・電話番号・銀行口座・クレジットカード番号は含まれないと説明。内部識別子は友だち追加に用いるLINE IDとは異なる。",
    "status": {
      "code": "confirmed",
      "label": "外部送信を確認",
      "text": "このガイドでは個人ごとの該当有無を判定しない。"
    },
    "providerResponse": {
      "label": "対処を実施と説明",
      "text": "送信停止・情報削除済みと説明。2026-07-31に行政指導を受け、管理強化と再発防止を表明。"
    },
    "officialAction": {
      "text": "対象者へ順次個別通知。公式発表では利用者の対応事項はないとしている。"
    },
    "sourceIds": [
      "breachSocial1Source1",
      "breachSocial1Source2"
    ],
    "history": [
      {
        "date": "2026-10-24",
        "title": "この手帳へ掲載",
        "summary": "公式資料を確認して初めて掲載しました。発生日・公表日とは異なります。"
      }
    ],
    "caution": "この記録だけでは、あなた個人が対象かどうかを判定できません。"
  },
  {
    "id": "line-official-account-display-2025",
    "serviceIds": [
      "line"
    ],
    "title": "LINE公式アカウントの誤表示による情報漏えい",
    "type": "breach",
    "publishedAt": "2025-12-09",
    "updatedAt": null,
    "occurredAt": "LINEチャットは2025-09-19 9〜11時、09-24 14〜18時、09-25 11〜15時。管理画面は09-24 15時台。いずれも日本時間。",
    "affectedPeriod": "LINEチャットは2025-09-19 9〜11時、09-24 14〜18時、09-25 11〜15時。管理画面は09-24 15時台。いずれも日本時間。",
    "scope": "公式発表にある検証時間帯に、検証者と同じ通信経路で企業・店舗向けLINE公式アカウントのLINEチャットまたは管理画面を利用した場合。ユーザー同士のトークは対象外。",
    "dataTypes": [
      "内部識別子・ユーザーネーム・プロフィール画像など",
      "企業・店舗情報と管理者プロフィール",
      "公式アカウントの配信情報",
      "企業・店舗とのLINEチャットのテキストメッセージ"
    ],
    "excludedData": "LINEチャットで送受信された画像・動画・ファイルと、ユーザー同士のトークは対象外と説明。プロフィール画像は上記の対象情報に含まれます。",
    "status": {
      "code": "confirmed",
      "label": "漏えいを確認（一部は可能性）",
      "text": "このガイドでは個人ごとの該当有無を判定しない。"
    },
    "providerResponse": {
      "label": "対処を実施と説明",
      "text": "2025-11-17に外部CDN提供会社の修正完了と解消を確認。検証者は取得情報を削除したと説明。"
    },
    "officialAction": {
      "text": "該当時間帯に受信・保存した見覚えのない画面やメッセージがあれば破棄し、不審なメールに注意するよう案内。"
    },
    "sourceIds": [
      "breachSocial2Source1"
    ],
    "history": [
      {
        "date": "2026-10-24",
        "title": "この手帳へ掲載",
        "summary": "公式資料を確認して初めて掲載しました。発生日・公表日とは異なります。"
      }
    ],
    "caution": "この記録だけでは、あなた個人が対象かどうかを判定できません。"
  },
  {
    "id": "note-ip-exposure-2020",
    "serviceIds": [
      "note"
    ],
    "title": "noteの記事投稿者のIPアドレス等の露出（2020年公表）",
    "type": "breach",
    "publishedAt": "2020-08-14",
    "updatedAt": "2021-09-09",
    "occurredAt": "IPアドレスの露出は2019-04-11〜2020-08-14。特商法表記は画面上で非表示となった2019-12-03から2020-08-14までソース上に残存。",
    "affectedPeriod": "IPアドレスの露出は2019-04-11〜2020-08-14。特商法表記は画面上で非表示となった2019-12-03から2020-08-14までソース上に残存。",
    "scope": "2020-08-14までに2記事以上を投稿したnoteアカウントの保有者。一部の任意入力した特商法表記にも影響。",
    "dataTypes": [
      "最後のログイン時のIPアドレス",
      "一部投稿者が任意入力した事業者名・連絡先"
    ],
    "excludedData": null,
    "status": {
      "code": "confirmed",
      "label": "情報の露出を確認",
      "text": "露出した情報が誰に取得・利用されたかを、このガイドでは判定しない。"
    },
    "providerResponse": {
      "label": "対処を実施と説明",
      "text": "2020年8月14日に露出を修正。2021年9月9日の追記では、当時独自ドメインを使っていた一部利用者のIPアドレスが外部アーカイブに残る可能性を説明し、対象者へ連絡しています。"
    },
    "officialAction": {
      "text": "特商法表記が対象となった利用者には登録メールへ個別連絡したと説明。本資料では全利用者への一律のパスワード変更指示は確認できない。"
    },
    "sourceIds": [
      "breachSocial3Source1"
    ],
    "history": [
      {
        "date": "2026-10-24",
        "title": "この手帳へ掲載",
        "summary": "公式資料を確認して初めて掲載しました。発生日・公表日とは異なります。"
      }
    ],
    "caution": "この記録だけでは、あなた個人が対象かどうかを判定できません。"
  },
  {
    "id": "xserver-blastmail-2026",
    "serviceIds": [
      "xserver"
    ],
    "title": "委託先ブラストメールからの配信先情報流出（2026年）",
    "type": "breach",
    "publishedAt": "2026-10-23",
    "updatedAt": null,
    "occurredAt": "発生期間は掲載資料に記載なし。委託先の公表は2026年10月21日。",
    "affectedPeriod": "配信先に登録された時期の範囲は、この掲載資料では未確認。",
    "scope": "現在・過去の利用者のうち、ニュース等の配信を希望し、ブラストメールに登録された人。全契約者ではない。",
    "dataTypes": [
      "メールアドレス（流出を確認）",
      "氏名・会社名（流出した可能性）"
    ],
    "excludedData": "パスワード・住所・電話番号・決済情報は配信先リストに含まず、今回の流出対象外と説明。",
    "status": {
      "code": "confirmed",
      "label": "流出を確認・一部調査中",
      "text": "メールアドレスの流出を確認。氏名・会社名や対象人数等は引き続き確認中。"
    },
    "providerResponse": {
      "label": "連携停止・範囲を確認中",
      "text": "データ連携を停止し、委託先の利用終了と自社配信への移行を予定。自社サーバーや管理画面の侵害とは区別。"
    },
    "officialAction": {
      "text": "不審メールのリンク・添付を開かず、個人情報等を入力しないよう案内。範囲を確認後、対象者へ個別通知する予定。"
    },
    "sourceIds": [
      "breachXserver2026"
    ],
    "history": [
      {
        "date": "2026-10-24",
        "title": "この手帳へ掲載",
        "summary": "公式資料を確認して初めて掲載しました。発生日・公表日とは異なります。"
      }
    ],
    "caution": "この記録だけでは、あなた個人が対象かどうかを判定できません。"
  },
  {
    "id": "sakura-rental-access-2026",
    "serviceIds": [
      "sakura-rental"
    ],
    "title": "レンタルサーバーの一部利用領域への不正アクセス",
    "type": "breach",
    "publishedAt": "2026-08-17",
    "updatedAt": "2026-09-10",
    "occurredAt": "2026年8月9日に異常を検知。過去の痕跡との関連・侵入経路には未確認の点があります。",
    "affectedPeriod": "一律の対象期間はこの記録では確定できません。対象契約は個別案内を確認してください。",
    "scope": "レンタルサーバーの951アカウントに影響の可能性。実際に情報を取得されたと確認できた件数ではありません。",
    "dataTypes": [
      "利用領域内のメール・Webサイト・ログ・保存ファイル"
    ],
    "excludedData": null,
    "status": {
      "code": "possible",
      "label": "閲覧・取得された可能性",
      "text": "外部持ち出しを裏付ける明確な事実は確認されていないと説明。"
    },
    "providerResponse": {
      "label": "調査・封じ込めを実施",
      "text": "影響する可能性のある契約へ個別連絡。追加の368アカウントと当初事象の関連は未確認。"
    },
    "officialAction": {
      "text": "個別通知と公式FAQに沿って対応してください。不審なメール・電話等に注意するよう案内しています。"
    },
    "sourceIds": [
      "breachSakura2026",
      "breachSakuraFaq2026"
    ],
    "history": [
      {
        "date": "2026-10-24",
        "title": "この手帳へ掲載",
        "summary": "公式資料を確認して初めて掲載しました。発生日・公表日とは異なります。"
      }
    ],
    "caution": "販売管理システムへの不正アクセスとは分けて記録しています。両事象の関連は未確認です。"
  },
  {
    "id": "sakura-member-access-2026",
    "serviceIds": [
      "sakura-rental",
      "sakura-vps"
    ],
    "title": "販売管理システムの会員情報等への不正アクセス",
    "type": "breach",
    "publishedAt": "2026-08-19",
    "updatedAt": "2026-09-10",
    "occurredAt": "2023年4月以降〜2026年3月に不正アクセス。",
    "affectedPeriod": "会員情報の保存範囲が対象。解約済みでも会員情報が残る場合があります。",
    "scope": "販売管理に保存された1,360,563アカウントの会員情報に影響の可能性（レンタル側の951件を含む）。VPSの提供環境への侵入を示すものではありません。",
    "dataTypes": [
      "氏名・住所・連絡先・契約情報等",
      "一部のレンタル/VPS初期パスワード",
      "30アカウントのハッシュ化された会員パスワード"
    ],
    "excludedData": "事業者はカード情報を保持していないと説明。初期値から変更した後のパスワードは本システムに保存されません。",
    "status": {
      "code": "possible",
      "label": "閲覧・取得された可能性",
      "text": "全件の取得を確認したという意味ではなく、外部持ち出しの明確な証拠は未確認と説明。"
    },
    "providerResponse": {
      "label": "調査・封じ込めを実施",
      "text": "対象へ個別案内。影響する初期パスワードが使用中のレンタル契約は事業者が変更しました。"
    },
    "officialAction": {
      "text": "案内されたレンタル利用者は任意のパスワードへ変更。案内されたVPS利用者は、初期パスワードを使用中なら変更してください。通知がなくても使い回しの確認を案内しています。"
    },
    "sourceIds": [
      "breachSakura2026",
      "breachSakuraFaq2026",
      "breachSakuraSecond2026"
    ],
    "history": [
      {
        "date": "2026-10-24",
        "title": "この手帳へ掲載",
        "summary": "公式資料を確認して初めて掲載しました。発生日・公表日とは異なります。"
      }
    ],
    "caution": "レンタルの利用領域への侵入と、会員情報を保存する販売管理側の侵入との関連は未確認です。"
  },
  {
    "id": "conoha-wing-access-2026",
    "serviceIds": [
      "conoha-wing"
    ],
    "title": "ConoHa WINGの一部Webサーバー領域への不正アクセス（2026年）",
    "type": "breach",
    "publishedAt": "2026-09-20",
    "updatedAt": null,
    "occurredAt": "2026年9月3日侵入開始、9月16日検知、9月18日排除。",
    "affectedPeriod": "上記の侵入期間と対象契約について、個別通知を確認してください。",
    "scope": "一部ホストの426アカウントのWeb領域。対象者には個別連絡済みと説明。",
    "dataTypes": [
      "対象のWebサーバー領域に保存されたデータ"
    ],
    "excludedData": "会員・契約・支払い情報は別環境で管理し、今回の漏えいはないと説明。",
    "status": {
      "code": "access-confirmed",
      "label": "不正アクセスを確認",
      "text": "侵入と不正プログラムの設置を確認。Web領域の情報が外部へ流出したかは、この公表からは未確認。"
    },
    "providerResponse": {
      "label": "不正プログラムを排除",
      "text": "2026年9月18日までに影響範囲を特定し、不正プログラムを排除したと説明。"
    },
    "officialAction": {
      "text": "対象者への個別メールに必要な対応を案内。事業者は、個別連絡のない利用者は本件の対象外と説明しています。不審な通知は公式窓口から確かめてください。"
    },
    "sourceIds": [
      "breachConoha2026"
    ],
    "history": [
      {
        "date": "2026-10-24",
        "title": "この手帳へ掲載",
        "summary": "公式資料を確認して初めて掲載しました。発生日・公表日とは異なります。"
      }
    ],
    "caution": "この記録だけでは、あなた個人が対象かどうかを判定できません。"
  }
];

export const breachReviews = {
  "note": {
    "attemptedAt": "2026-10-25",
    "status": "body-reviewed",
    "sourceIds": [
      "breachSocial3Source1"
    ],
    "note": "公式発表を検索し、掲載した事案の本文を確認しました。すべての事案を網羅するものではありません。"
  },
  "wordpress-com": {
    "attemptedAt": "2026-10-25",
    "status": "searched",
    "sourceIds": [],
    "note": "今回の公式情報の検索範囲では、ここに掲載できる事案の本文を確認できていません。被害がないことを意味しません。"
  },
  "pixiv": {
    "attemptedAt": "2026-10-25",
    "status": "searched",
    "sourceIds": [],
    "note": "今回の公式情報の検索範囲では、ここに掲載できる事案の本文を確認できていません。被害がないことを意味しません。"
  },
  "booth": {
    "attemptedAt": "2026-10-25",
    "status": "searched",
    "sourceIds": [],
    "note": "今回の公式情報の検索範囲では、ここに掲載できる事案の本文を確認できていません。被害がないことを意味しません。"
  },
  "amazon-jp": {
    "attemptedAt": "2026-10-25",
    "status": "searched",
    "sourceIds": [],
    "note": "今回の公式情報の検索範囲では、ここに掲載できる事案の本文を確認できていません。被害がないことを意味しません。"
  },
  "rakuten-ichiba": {
    "attemptedAt": "2026-10-25",
    "status": "searched",
    "sourceIds": [],
    "note": "今回の公式情報の検索範囲では、ここに掲載できる事案の本文を確認できていません。被害がないことを意味しません。"
  },
  "yahoo-shopping": {
    "attemptedAt": "2026-10-25",
    "status": "searched",
    "sourceIds": [],
    "note": "今回の公式情報の検索範囲では、ここに掲載できる事案の本文を確認できていません。被害がないことを意味しません。"
  },
  "mercari": {
    "attemptedAt": "2026-10-25",
    "status": "searched",
    "sourceIds": [],
    "note": "候補の2021年公式報告は本文取得に失敗したため掲載していません。今回の検索結果から、被害がないとは判断できません。"
  },
  "base": {
    "attemptedAt": "2026-10-25",
    "status": "searched",
    "sourceIds": [],
    "note": "今回の公式情報の検索範囲では、ここに掲載できる事案の本文を確認できていません。被害がないことを意味しません。"
  },
  "youtube": {
    "attemptedAt": "2026-10-25",
    "status": "searched",
    "sourceIds": [],
    "note": "今回の公式情報の検索範囲では、ここに掲載できる事案の本文を確認できていません。被害がないことを意味しません。"
  },
  "instagram": {
    "attemptedAt": "2026-10-25",
    "status": "searched",
    "sourceIds": [],
    "note": "今回の公式情報の検索範囲では、ここに掲載できる事案の本文を確認できていません。被害がないことを意味しません。"
  },
  "x": {
    "attemptedAt": "2026-10-25",
    "status": "searched",
    "sourceIds": [],
    "note": "今回の公式情報の検索範囲では、ここに掲載できる事案の本文を確認できていません。被害がないことを意味しません。"
  },
  "line": {
    "attemptedAt": "2026-10-25",
    "status": "body-reviewed",
    "sourceIds": [
      "breachSocial1Source1",
      "breachSocial1Source2",
      "breachSocial2Source1"
    ],
    "note": "公式発表を検索し、掲載した事案の本文を確認しました。すべての事案を網羅するものではありません。"
  },
  "fanbox": {
    "attemptedAt": "2026-10-25",
    "status": "searched",
    "sourceIds": [],
    "note": "不正ログイン注意喚起の候補は本文取得に失敗したため、流出事案として掲載していません。被害がないことを意味しません。"
  },
  "sakura-rental": {
    "attemptedAt": "2026-10-25",
    "status": "body-reviewed",
    "sourceIds": [
      "breachSakura2026",
      "breachSakuraFaq2026"
    ],
    "note": "公式発表を検索し、掲載した事案の本文を確認しました。すべての事案を網羅するものではありません。"
  },
  "sakura-vps": {
    "attemptedAt": "2026-10-25",
    "status": "body-reviewed",
    "sourceIds": [
      "breachSakura2026",
      "breachSakuraFaq2026"
    ],
    "note": "公式発表を検索し、掲載した事案の本文を確認しました。すべての事案を網羅するものではありません。"
  },
  "xserver": {
    "attemptedAt": "2026-10-25",
    "status": "body-reviewed",
    "sourceIds": [
      "breachXserver2026"
    ],
    "note": "公式発表を検索し、掲載した事案の本文を確認しました。すべての事案を網羅するものではありません。"
  },
  "lolipop": {
    "attemptedAt": "2026-10-25",
    "status": "searched",
    "sourceIds": [],
    "note": "今回の公式情報の検索範囲では、ここに掲載できる事案の本文を確認できていません。被害がないことを意味しません。"
  },
  "conoha-wing": {
    "attemptedAt": "2026-10-25",
    "status": "body-reviewed",
    "sourceIds": [
      "breachConoha2026"
    ],
    "note": "公式発表を検索し、掲載した事案の本文を確認しました。すべての事案を網羅するものではありません。"
  }
};

