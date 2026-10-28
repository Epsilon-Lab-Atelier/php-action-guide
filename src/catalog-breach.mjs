// Directory entries for information-leak research. PHP evidence belongs in catalog.mjs.
// A directory entry identifies a service; it does not establish an incident or PHP use.
export const breachServices = [
{
  "id": "tsukutsuku",
  "name": "ツクツク!!!",
  "category": "service",
  "roles": [
    "user"
  ],
  "groupByRole": {
    "user": "shopping"
  },
  "short": "2025年のカード入力改ざんと個人情報の漏えい可能性",
  "keywords": [
    "ツクツク!!!"
  ],
  "domains": [
    {
      "host": "home.tsuku2.jp",
      "includeSubdomains": false
    }
  ],
  "domainSourceIds": [
    "breachTsukutsuku2026"
  ],
  "supportSourceIds": []
},
{
  "id": "sonet",
  "name": "So-net・plala（Sコース）",
  "category": "service",
  "roles": [
    "user"
  ],
  "groupByRole": {
    "user": "business"
  },
  "short": "会員情報と一部メールサービスのパスワード漏えい",
  "keywords": [
    "So-net・plala（Sコース）"
  ],
  "domains": [
    {
      "host": "www.so-net.ne.jp",
      "includeSubdomains": false
    }
  ],
  "domainSourceIds": [
    "breachSonet2026"
  ],
  "supportSourceIds": []
},
{
  "id": "yomipost",
  "name": "ヨミポスト（読宣WEST四国支社）",
  "category": "service",
  "roles": [
    "user"
  ],
  "groupByRole": {
    "user": "media"
  },
  "short": "ウェブ申込・退会者の情報流出可能性",
  "keywords": [
    "ヨミポスト（読宣WEST四国支社）"
  ],
  "domains": [
    {
      "host": "www.yomisen.co.jp",
      "includeSubdomains": false
    }
  ],
  "domainSourceIds": [
    "breachYomipost2026"
  ],
  "supportSourceIds": []
},
{
  "id": "sonicwire",
  "name": "SONICWIRE（クリプトン）",
  "category": "service",
  "roles": [
    "user"
  ],
  "groupByRole": {
    "user": "shopping"
  },
  "short": "会員・ニュースレター等の情報取得を確認",
  "keywords": [
    "SONICWIRE",
    "ソニックワイヤ",
    "クリプトン"
  ],
  "domains": [
    {
      "host": "www.crypton.co.jp",
      "includeSubdomains": false
    }
  ],
  "domainSourceIds": [
    "breachSonicwire2026"
  ],
  "supportSourceIds": []
},
{
  "id": "giftee",
  "name": "ギフティ（メール配信・eギフト）",
  "category": "service",
  "roles": [
    "user"
  ],
  "groupByRole": {
    "user": "finance"
  },
  "short": "外部メール配信とeギフト発行の事案を分けて確認",
  "keywords": [
    "ギフティ",
    "giftee",
    "eギフト",
    "旅先納税",
    "giftee Benefit"
  ],
  "domains": [
    {
      "host": "giftee.co.jp",
      "includeSubdomains": false
    }
  ],
  "domainSourceIds": [
    "breachGifteeMail2026",
    "breachGifteeEgift2026"
  ],
  "supportSourceIds": []
},
{
  "id": "buyma-mail",
  "name": "BUYMA（メール配信先）",
  "category": "service",
  "roles": [
    "user"
  ],
  "groupByRole": {
    "user": "shopping"
  },
  "short": "Cuenote FCの一部配信先情報の漏えい可能性",
  "keywords": [
    "BUYMA",
    "バイマ",
    "エニグモ",
    "Cuenote"
  ],
  "domains": [
    {
      "host": "qa.buyma.com",
      "includeSubdomains": false
    }
  ],
  "domainSourceIds": [
    "breachBuymaMail2026"
  ],
  "supportSourceIds": []
},
{
  "id": "gundam-base-members",
  "name": "THE GUNDAM BASE MEMBERS",
  "category": "service",
  "roles": [
    "user"
  ],
  "groupByRole": {
    "user": "shopping"
  },
  "short": "メールアドレス等346,247件の漏えい",
  "keywords": [
    "ガンダムベース",
    "THE GUNDAM BASE MEMBERS",
    "バンダイナムコID",
    "BANDAI SPIRITS"
  ],
  "domains": [
    {
      "host": "bandainamcoid.com",
      "includeSubdomains": false
    }
  ],
  "domainSourceIds": [
    "breachGundamBase2026"
  ],
  "supportSourceIds": []
},
{
  "id": "sendenkaigi-mail",
  "name": "宣伝会議（メールマガジン配信先）",
  "category": "service",
  "roles": [
    "user"
  ],
  "groupByRole": {
    "user": "publishing"
  },
  "short": "Cuenote FCの顧客アドレス帳流出可能性",
  "keywords": [
    "宣伝会議",
    "広報会議",
    "メールマガジン"
  ],
  "domains": [
    {
      "host": "sendenkaigi.co.jp",
      "includeSubdomains": true
    }
  ],
  "domainSourceIds": [
    "breachSendenkaigi2026"
  ],
  "supportSourceIds": []
},
{
  "id": "ferret-one",
  "name": "ferret One（ベーシック）",
  "category": "service",
  "roles": [
    "user"
  ],
  "groupByRole": {
    "user": "business"
  },
  "short": "ログイン用メールの取得可能性と6アカウントへの不正ログイン",
  "keywords": [
    "ferret One",
    "フェレットワン",
    "ベーシック"
  ],
  "domains": [
    {
      "host": "ferret-one.com",
      "includeSubdomains": false
    }
  ],
  "domainSourceIds": [
    "breachFerretOne2026"
  ],
  "supportSourceIds": []
},
{
  "id": "wiseman-mell",
  "name": "MeLL+professional（ワイズマン）",
  "category": "service",
  "roles": [
    "user"
  ],
  "groupByRole": {
    "user": "public"
  },
  "short": "クラウド環境への不正アクセスと限定サービス再開",
  "keywords": [
    "ワイズマン",
    "MeLL+",
    "メルタス",
    "professional",
    "介護"
  ],
  "domains": [
    {
      "host": "www.wiseman.co.jp",
      "includeSubdomains": false
    }
  ],
  "domainSourceIds": [
    "breachWisemanMell2026"
  ],
  "supportSourceIds": []
},
{
  "id": "leanonme-learning",
  "name": "Lean on Me（Special Learning・Special Shift）",
  "category": "service",
  "roles": [
    "user"
  ],
  "groupByRole": {
    "user": "public"
  },
  "short": "顧客情報82,723人の取得とレポート内の要配慮情報",
  "keywords": [
    "Lean on Me",
    "リーンオンミー",
    "Special Learning",
    "Special Shift",
    "研修"
  ],
  "domains": [
    {
      "host": "leanonme.co.jp",
      "includeSubdomains": false
    }
  ],
  "domainSourceIds": [
    "breachLeanonmeInitial2026"
  ],
  "supportSourceIds": []
},
{
  "id": "cybozu-mail",
  "name": "サイボウズ（各種お知らせ配信先）",
  "category": "service",
  "roles": [
    "user"
  ],
  "groupByRole": {
    "user": "business"
  },
  "short": "Cuenote FCで配信する一部メールアドレス等の漏えい可能性",
  "keywords": [
    "サイボウズ",
    "cybozu",
    "kintone",
    "Garoon",
    "メールワイズ"
  ],
  "domains": [
    {
      "host": "topics.cybozu.co.jp",
      "includeSubdomains": false
    }
  ],
  "domainSourceIds": [
    "breachCybozuMail2026"
  ],
  "supportSourceIds": []
},
{
  "id": "zen-university-form",
  "name": "ZEN大学（指定問い合わせフォーム）",
  "category": "service",
  "roles": [
    "user"
  ],
  "groupByRole": {
    "user": "public"
  },
  "short": "FAQ内の問い合わせフォーム送信分、最大107件に限定",
  "keywords": [
    "ZEN大学",
    "ゼン大学",
    "問い合わせ",
    "Studio"
  ],
  "domains": [
    {
      "host": "zen.ac.jp",
      "includeSubdomains": false
    }
  ],
  "domainSourceIds": [
    "breachZenUniversity2026"
  ],
  "supportSourceIds": []
},
{
  "id": "ex-reservation",
  "name": "スマートEX・エクスプレス予約",
  "category": "service",
  "roles": [
    "user"
  ],
  "groupByRole": {
    "user": "transport"
  },
  "short": "外部メール配信サービスに登録された一部会員情報が対象",
  "keywords": [
    "スマートEX",
    "エクスプレス予約",
    "EX予約",
    "新幹線"
  ],
  "domains": [
    {
      "host": "smart-ex.jp",
      "includeSubdomains": false
    },
    {
      "host": "expy.jp",
      "includeSubdomains": false
    }
  ],
  "domainSourceIds": [
    "breachExReservation2026",
    "breachExReservationExpy2026"
  ],
  "supportSourceIds": []
},
{
  "id": "komoju",
  "name": "KOMOJU（決済システム・CRM）",
  "category": "service",
  "roles": [
    "user"
  ],
  "groupByRole": {
    "user": "finance"
  },
  "short": "決済システムと問い合わせCRMの被害を分けて掲載",
  "keywords": [
    "KOMOJU",
    "コモジュ",
    "決済",
    "CRM"
  ],
  "domains": [
    {
      "host": "komoju.com",
      "includeSubdomains": false
    },
    {
      "host": "ja.komoju.com",
      "includeSubdomains": false
    }
  ],
  "domainSourceIds": [
    "breachKomoju2026"
  ],
  "supportSourceIds": []
},
{
  "id": "valtec",
  "name": "バルテック（MOT・POS等の対象サービス）",
  "category": "service",
  "roles": [
    "user"
  ],
  "groupByRole": {
    "user": "business"
  },
  "short": "MOT・POS等の指定サービス。流出確認・未確認・調査中の範囲を区別",
  "keywords": [
    "バルテック",
    "VALTEC",
    "MOT",
    "FreePOS",
    "BeSHOKU",
    "BeSALO",
    "券売機"
  ],
  "domains": [
    {
      "host": "www.webjapan.co.jp",
      "includeSubdomains": false
    }
  ],
  "domainSourceIds": [
    "breachValtecThird2026"
  ],
  "supportSourceIds": []
},
{
  "id": "alc-news",
  "name": "アルク（ALC News +）",
  "category": "service",
  "roles": [
    "user"
  ],
  "groupByRole": {
    "user": "publishing"
  },
  "short": "ALC News +の配信先約31万件に限定",
  "keywords": [
    "アルク",
    "ALC News +",
    "アルクニュースプラス"
  ],
  "domains": [
    {
      "host": "www.alc.co.jp",
      "includeSubdomains": false
    }
  ],
  "domainSourceIds": [
    "breachAlcNews2026"
  ],
  "supportSourceIds": []
},
{
  "id": "piccoma",
  "name": "ピッコマ（メールマガジン配信先）",
  "category": "service",
  "roles": [
    "user"
  ],
  "groupByRole": {
    "user": "media"
  },
  "short": "メルマガ1回分の宛先1,002,404件に限定",
  "keywords": [
    "ピッコマ",
    "piccoma",
    "カカオピッコマ",
    "メルマガ"
  ],
  "domains": [
    {
      "host": "piccoma.com",
      "includeSubdomains": false
    }
  ],
  "domainSourceIds": [
    "breachPiccoma2026"
  ],
  "supportSourceIds": []
},
{
  "id": "chariloto",
  "name": "チャリロト（チャリカ会員）",
  "category": "service",
  "roles": [
    "user"
  ],
  "groupByRole": {
    "user": "daily"
  },
  "short": "アプリ利用者のうちチャリカ会員373名に限定",
  "keywords": [
    "チャリロト",
    "チャリカ",
    "チャリ・ロト"
  ],
  "domains": [
    {
      "host": "chariloto.jp",
      "includeSubdomains": false
    }
  ],
  "domainSourceIds": [
    "breachChariloto2026"
  ],
  "supportSourceIds": []
},
{
  "id": "system5",
  "name": "システムファイブ（オンラインショップ連携システム）",
  "category": "service",
  "roles": [
    "user"
  ],
  "groupByRole": {
    "user": "shopping"
  },
  "short": "最大15,671名分の情報取得の可能性",
  "keywords": [
    "システムファイブ",
    "SYSTEM5",
    "オンラインショップ"
  ],
  "domains": [
    {
      "host": "www.system5.jp",
      "includeSubdomains": false
    }
  ],
  "domainSourceIds": [
    "breachSystem52026"
  ],
  "supportSourceIds": []
},
{
  "id": "cotta",
  "name": "cotta・cotta business",
  "category": "service",
  "roles": [
    "user"
  ],
  "groupByRole": {
    "user": "shopping"
  },
  "short": "不正アクセス・情報流出の有無を調査中",
  "keywords": [
    "cotta",
    "コッタ",
    "cotta business",
    "コッタベーカリー"
  ],
  "domains": [
    {
      "host": "www.cotta.jp",
      "includeSubdomains": false
    }
  ],
  "domainSourceIds": [
    "breachCotta2026"
  ],
  "supportSourceIds": []
},
{
  "id": "tiny-garden",
  "name": "TINY GARDEN 蓼科",
  "category": "service",
  "roles": [
    "user"
  ],
  "groupByRole": {
    "user": "transport"
  },
  "short": "宿泊日と予約成立日の両条件に該当する予約",
  "keywords": [
    "TINY GARDEN",
    "蓼科",
    "タイニーガーデン",
    "アーバンリサーチ"
  ],
  "domains": [
    {
      "host": "www.urban-research.co.jp",
      "includeSubdomains": false
    }
  ],
  "domainSourceIds": [
    "breachTinyGarden2026"
  ],
  "supportSourceIds": []
},
{
  "id": "rakuten-travel",
  "name": "楽天トラベル",
  "short": "海外ホテルの一部ページと多言語サイトを区別",
  "category": "service",
  "roles": [
    "user"
  ],
  "groupByRole": {
    "user": "transport"
  },
  "keywords": [
    "楽天トラベル",
    "楽天旅行",
    "Rakuten Travel Xchange",
    "海外ホテル",
    "多言語予約"
  ],
  "domains": [
    {
      "host": "travel.rakuten.co.jp",
      "includeSubdomains": false
    },
    {
      "host": "travel.rakuten.com",
      "includeSubdomains": false
    }
  ],
  "domainSourceIds": [
    "breachRakutenTravel2026"
  ],
  "supportSourceIds": []
},
{
  "id": "nttpc-mail",
  "name": "NTTPCコミュニケーションズ（連絡先メール）",
  "short": "外部メール配信サービスを介した影響を調査中",
  "category": "service",
  "roles": [
    "user"
  ],
  "groupByRole": {
    "user": "business"
  },
  "keywords": [
    "NTTPC",
    "NTTPCコミュニケーションズ",
    "連絡先メール",
    "Cuenote"
  ],
  "domains": [
    {
      "host": "www.nttpc.co.jp",
      "includeSubdomains": false
    }
  ],
  "domainSourceIds": [
    "breachNttpcMail2026"
  ],
  "supportSourceIds": []
},
{
  "id": "ivs2025",
  "name": "IVS2025（フォーム回答）",
  "category": "service",
  "roles": [
    "user"
  ],
  "groupByRole": {
    "user": "daily"
  },
  "short": "フォーム回答約4,200件の漏えい可能性",
  "keywords": [
    "IVS",
    "IVS2025",
    "Headline Japan"
  ],
  "domains": [
    {
      "host": "www.ivs.events",
      "includeSubdomains": false
    }
  ],
  "domainSourceIds": [
    "breachIvs20252026"
  ],
  "supportSourceIds": []
},
{
  "id": "projectdesign-news",
  "name": "先端教育機構出版部（メールマガジン）",
  "category": "service",
  "roles": [
    "user"
  ],
  "groupByRole": {
    "user": "publishing"
  },
  "short": "出版部のメールマガジン配信先に限定",
  "keywords": [
    "先端教育機構",
    "事業構想",
    "メルマガ",
    "出版部"
  ],
  "domains": [
    {
      "host": "www.projectdesign.jp",
      "includeSubdomains": false
    }
  ],
  "domainSourceIds": [
    "breachProjectdesignNews2026"
  ],
  "supportSourceIds": []
},
{
  "id": "comsbi-enterprise",
  "name": "COMSBI エンタープライズ基盤",
  "category": "service",
  "roles": [
    "user"
  ],
  "groupByRole": {
    "user": "business"
  },
  "short": "SaaS版とは別の法人向け個別基盤",
  "keywords": [
    "COMSBI",
    "コムスビ",
    "ソニックムーブ",
    "LINE連携"
  ],
  "domains": [
    {
      "host": "sonicmoov.com",
      "includeSubdomains": false
    }
  ],
  "domainSourceIds": [
    "breachComsbiEnterprise2026"
  ],
  "supportSourceIds": []
},

{
  "id": "idare",
  "name": "IDARE（イデア）",
  "short": "登録者の残高・取引履歴と個別の対象情報",
  "category": "service",
  "roles": [
    "user"
  ],
  "groupByRole": {
    "user": "finance"
  },
  "keywords": [
    "IDARE",
    "イデア",
    "Fivot",
    "LADDER"
  ],
  "domains": [
    {
      "host": "idare.jp",
      "includeSubdomains": false
    }
  ],
  "domainSourceIds": [
    "breachIdareFirst2026"
  ],
  "supportSourceIds": []
},
{
  "id": "murauchi",
  "name": "ムラウチドットコム",
  "short": "顧客情報と配送先情報を区別",
  "category": "service",
  "roles": [
    "user"
  ],
  "groupByRole": {
    "user": "shopping"
  },
  "keywords": [
    "ムラウチ",
    "ムラウチドットコム",
    "murauchi"
  ],
  "domains": [
    {
      "host": "murauchi.com",
      "includeSubdomains": false
    }
  ],
  "domainSourceIds": [
    "breachMurauchiFaq2026"
  ],
  "supportSourceIds": []
},
{
  "id": "wellsupport",
  "name": "ウェルサポート・ウェルサポートPlus",
  "short": "アプリの問い合わせフォームに限定",
  "category": "service",
  "roles": [
    "user"
  ],
  "groupByRole": {
    "user": "business"
  },
  "keywords": [
    "イネサス",
    "山口フィナンシャルグループ",
    "山口FG",
    "福利厚生",
    "Leafea"
  ],
  "domains": [
    {
      "host": "inesus.jp",
      "includeSubdomains": false
    }
  ],
  "domainSourceIds": [
    "breachWellsupportDomain2026"
  ],
  "supportSourceIds": []
},
{
  "id": "passto",
  "name": "PASSTO（ECOMMIT）",
  "short": "問い合わせフォーム送信情報に限定",
  "category": "service",
  "roles": [
    "user"
  ],
  "groupByRole": {
    "user": "daily"
  },
  "keywords": [
    "パスト",
    "エコミット",
    "ECOMMIT",
    "資源循環"
  ],
  "domains": [
    {
      "host": "passto.jp",
      "includeSubdomains": false
    }
  ],
  "domainSourceIds": [
    "breachPassto2026"
  ],
  "supportSourceIds": []
},
  {
    "id": "gyazo",
    "name": "Gyazo",
    "short": "ユーザー情報・画像メタデータ・一部画像を区別",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "social"
    },
    "keywords": [
      "Gyazo",
      "ギャゾー",
      "Helpfeel",
      "画像共有"
    ],
    "domains": [
      {
        "host": "gyazo.com",
        "includeSubdomains": false
      },
      {
        "host": "help-ja.gyazo.com",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachGyazoThird2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "goodsmile-shop",
    "name": "グッドスマイルカンパニー公式ショップ",
    "short": "公式ショップ会員・注文と配送先の情報",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "shopping"
    },
    "keywords": [
      "グッドスマイルカンパニー",
      "グッスマ",
      "GOOD SMILE",
      "公式ショップ"
    ],
    "domains": [
      {
        "host": "support.goodsmile.com",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachGoodsmile2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "rvsta-mail",
    "name": "リバスタ（メール配信先情報）",
    "short": "ブラストメールを通じた配信先",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "business"
    },
    "keywords": [
      "リバスタ",
      "RVSTA",
      "メール配信",
      "ブラストメール"
    ],
    "domains": [
      {
        "host": "www.rvsta.co.jp",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachRvstaMail2026"
    ],
    "supportSourceIds": []
  },
{
  "id": "hachijuni-nagano-bank",
  "name": "八十二長野銀行",
  "short": "職員1名のメール内の顧客・関係先情報",
  "category": "service",
  "roles": [
    "user"
  ],
  "groupByRole": {
    "user": "finance"
  },
  "keywords": [
    "八十二長野銀行",
    "八十二銀行",
    "長野銀行",
    "82銀行"
  ],
  "domains": [
    {
      "host": "bank.82group.jp",
      "includeSubdomains": false
    }
  ],
  "domainSourceIds": [
    "breach82BankFollowup2026"
  ],
  "supportSourceIds": []
},
{
  "id": "osaka-university",
  "name": "大阪大学",
  "short": "委託先が共有していた卒業生・在学生・教職員情報",
  "category": "service",
  "roles": [
    "user"
  ],
  "groupByRole": {
    "user": "business"
  },
  "keywords": [
    "大阪大学",
    "阪大",
    "The University of Osaka"
  ],
  "domains": [
    {
      "host": "www.osaka-u.ac.jp",
      "includeSubdomains": false
    }
  ],
  "domainSourceIds": [
    "breachOsakaUniversity2026"
  ],
  "supportSourceIds": []
},
{
  "id": "futureshop",
  "name": "futureshop（フューチャーショップ）",
  "short": "1店舗の会員情報・別の一部サーバー事案",
  "category": "service",
  "roles": [
    "user"
  ],
  "groupByRole": {
    "user": "business"
  },
  "keywords": [
    "futureshop",
    "フューチャーショップ",
    "Future Shop"
  ],
  "domains": [
    {
      "host": "www.future-shop.jp",
      "includeSubdomains": false
    }
  ],
  "domainSourceIds": [
    "breachFutureshopExplanation2026"
  ],
  "supportSourceIds": []
},
{
  "id": "lashinbang",
  "name": "らしんばん",
  "short": "利用サービス別の顧客・届け先情報",
  "category": "service",
  "roles": [
    "user"
  ],
  "groupByRole": {
    "user": "shopping"
  },
  "keywords": [
    "らしんばん",
    "羅針盤",
    "Lashinbang"
  ],
  "domains": [
    {
      "host": "www.lashinbang.com",
      "includeSubdomains": false
    },
    {
      "host": "shop.lashinbang.com",
      "includeSubdomains": false
    }
  ],
  "domainSourceIds": [
    "breachLashinbang2026"
  ],
  "supportSourceIds": []
},
{
  "id": "awa-bank",
  "name": "阿波銀行",
  "short": "法人契約先・株主などの情報",
  "category": "service",
  "roles": [
    "user"
  ],
  "groupByRole": {
    "user": "finance"
  },
  "keywords": [
    "阿波銀行",
    "あわぎん",
    "AWABANK"
  ],
  "domains": [
    {
      "host": "www.awabank.co.jp",
      "includeSubdomains": false
    }
  ],
  "domainSourceIds": [
    "breachAwaBankFirst2026"
  ],
  "supportSourceIds": []
},
  {
    "id": "sagawa",
    "name": "佐川急便",
    "short": "荷物の送り主・届け先・会員情報",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "transport"
    },
    "keywords": [
      "佐川",
      "佐川急便",
      "スマートクラブ",
      "お荷物問い合わせ",
      "Sagawa",
      "Sagawa Express"
    ],
    "domains": [
      {
        "host": "www.sagawa-exp.co.jp",
        "includeSubdomains": false
      },
      {
        "host": "www2.sagawa-exp.co.jp",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachSagawa2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "burger-king",
    "name": "バーガーキング",
    "short": "公式アプリの会員情報",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "shopping"
    },
    "keywords": [
      "バーガーキング",
      "バーキン",
      "Burger King",
      "ビーケー・ジャパン"
    ],
    "domains": [
      {
        "host": "www.burgerking.co.jp",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachBurgerKing2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "times-car",
    "name": "タイムズカー",
    "short": "カーシェア・過去の登録も確認",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "transport"
    },
    "keywords": [
      "times car",
      "timescar",
      "タイムズ",
      "タイムズカーシェア",
      "カーシェア",
      "カーシェアリング",
      "タイムズモビリティ"
    ],
    "domains": [
      {
        "host": "share.timescar.jp",
        "includeSubdomains": false
      },
      {
        "host": "corp.timescar.jp",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachTimesCarFifth2026",
      "breachTimesCarFaq2026",
      "breachTimesCarFirst2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "jr-east",
    "name": "JR東日本",
    "short": "えきねっと・大人の休日倶楽部",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "transport"
    },
    "keywords": [
      "JR East",
      "jreast",
      "JR東",
      "えきねっと",
      "ekinet",
      "eki-net",
      "大人の休日倶楽部",
      "ジェイアール東日本"
    ],
    "domains": [
      {
        "host": "www.jreast.co.jp",
        "includeSubdomains": false
      },
      {
        "host": "jreast.co.jp",
        "includeSubdomains": false
      },
      {
        "host": "www.eki-net.com",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachJrEastMail2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "view-card",
    "name": "ビューカード",
    "short": "VIEW’s NETのメール配信",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "transport"
    },
    "keywords": [
      "VIEW's NET",
      "VIEW’s NET",
      "viewsnet",
      "view card",
      "JR東日本",
      "JR East",
      "ビューズネット"
    ],
    "domains": [
      {
        "host": "viewsnet.jp",
        "includeSubdomains": false
      },
      {
        "host": "www.viewsnet.jp",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachViewCardMail2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "seicomart",
    "name": "セイコーマート",
    "short": "アプリに登録したことのある会員",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "shopping"
    },
    "keywords": [
      "セコマ",
      "セイコーマートアプリ",
      "Seicomart",
      "Secoma",
      "ペコマ"
    ],
    "domains": [
      {
        "host": "www.secoma.co.jp",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachSeicomartFirst2026",
      "breachSeicomartThird2026",
      "breachSeicomartFourth2026",
      "breachSeicomartResume2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "mrmax",
    "name": "ミスターマックス",
    "short": "アプリ・オンラインストア会員",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "shopping"
    },
    "keywords": [
      "MrMax",
      "ミスターマックス",
      "MrMaxアプリ"
    ],
    "domains": [
      {
        "host": "mrmax.co.jp",
        "includeSubdomains": false
      },
      {
        "host": "www.mrmax.co.jp",
        "includeSubdomains": false
      },
      {
        "host": "mrmax.jp",
        "includeSubdomains": false
      },
      {
        "host": "www.mrmaxhd.co.jp",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachMrmax2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "abahouse",
    "name": "ABAHOUSE",
    "short": "会員情報・オンラインストアの注文",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "shopping"
    },
    "keywords": [
      "アバハウス",
      "アバハウスインターナショナル",
      "ABAHOUSE",
      "AMC",
      "アバハウスメンバーズクラブ"
    ],
    "domains": [
      {
        "host": "abahouse.co.jp",
        "includeSubdomains": false
      },
      {
        "host": "abahouse.jp",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachAbahouseFirst2026",
      "breachAbahouseSecond2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "lawson",
    "name": "ローソン",
    "short": "ローソンID・アプリ予約",
    "keywords": [
      "ローソン",
      "LAWSON",
      "ローソンID",
      "ローソンアプリ"
    ],
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "shopping"
    },
    "domains": [
      {
        "host": "www.lawson.co.jp",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachLawson2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "yakiniku-king",
    "name": "焼肉きんぐ",
    "short": "公式アプリの会員情報",
    "keywords": [
      "焼肉きんぐ",
      "物語コーポレーション",
      "焼肉キング"
    ],
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "shopping"
    },
    "domains": [
      {
        "host": "www.yakiniku-king.jp",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachYakinikuKing2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "infoq",
    "name": "infoQ",
    "short": "アンケートサイトの会員情報",
    "keywords": [
      "infoQ",
      "インフォキュー",
      "GMOリサーチ",
      "アンケート"
    ],
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "daily"
    },
    "domains": [
      {
        "host": "gmo-research.ai",
        "includeSubdomains": false
      },
      {
        "host": "infoq.jp",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachInfoQ2026",
      "breachInfoQDomain"
    ],
    "supportSourceIds": []
  },
  {
    "id": "moonstar",
    "name": "ムーンスター",
    "short": "公式オンラインショップの購入情報",
    "keywords": [
      "MOONSTAR",
      "ムーンスター",
      "810s"
    ],
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "shopping"
    },
    "domains": [
      {
        "host": "www.moonstar.co.jp",
        "includeSubdomains": false
      },
      {
        "host": "store.moonstar.co.jp",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachMoonstar2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "jetro",
    "name": "ジェトロ（日本貿易振興機構）",
    "short": "一部ウェブサイトの登録情報",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "business"
    },
    "domains": [
      {
        "host": "www.jetro.go.jp",
        "includeSubdomains": false
      }
    ],
    "keywords": [
      "JETRO",
      "日本貿易振興機構",
      "ジェトロ"
    ],
    "domainSourceIds": [
      "breachJetro2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "jr-kyushu",
    "name": "JR九州",
    "short": "Web会員向けメール配信",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "transport"
    },
    "domains": [
      {
        "host": "www.jrkyushu.co.jp",
        "includeSubdomains": false
      }
    ],
    "keywords": [
      "JR Kyushu",
      "九州旅客鉄道",
      "JR九州Web会員"
    ],
    "domainSourceIds": [
      "breachJrKyushuMail2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "kddi-isp-mail",
    "name": "KDDI（ISP向けメール基盤）",
    "short": "契約中のプロバイダーの案内を確認",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "business"
    },
    "domains": [
      {
        "host": "newsroom.kddi.com",
        "includeSubdomains": false
      },
      {
        "host": "www.kddi.com",
        "includeSubdomains": false
      }
    ],
    "keywords": [
      "KDDI",
      "ISP",
      "プロバイダー",
      "メールシステム",
      "au"
    ],
    "domainSourceIds": [
      "breachKddiIsp2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "idcf-cloud",
    "name": "IDCフロンティア（IDCFクラウド）",
    "short": "仮想サーバーとポータル情報を区別",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "business"
    },
    "domains": [
      {
        "host": "www.idcf.jp",
        "includeSubdomains": false
      }
    ],
    "keywords": [
      "IDCF",
      "IDC Frontier",
      "IDCフロンティア",
      "IDCFクラウド"
    ],
    "domainSourceIds": [
      "breachIdcfFifth2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "sompo-japan",
    "name": "損保ジャパン",
    "short": "SMILING ROADの問い合わせ情報",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "business"
    },
    "domains": [
      {
        "host": "www.sompo-japan.co.jp",
        "includeSubdomains": false
      }
    ],
    "keywords": [
      "損害保険ジャパン",
      "SMILING ROAD",
      "スマイリングロード",
      "損保"
    ],
    "domainSourceIds": [
      "breachSompoSr2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "citizen-watch",
    "name": "シチズン時計",
    "short": "ブランドのお問い合わせフォーム",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "shopping"
    },
    "domains": [
      {
        "host": "www.citizen.co.jp",
        "includeSubdomains": false
      }
    ],
    "keywords": [
      "CITIZEN",
      "シチズン",
      "ブローバ",
      "フレデリック・コンスタント"
    ],
    "domainSourceIds": [
      "breachCitizenInquiry2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "commune",
    "name": "Commune（コミューン）",
    "short": "コミュニティ別に対象を確認",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "social"
    },
    "domains": [
      {
        "host": "commune.co.jp",
        "includeSubdomains": false
      }
    ],
    "keywords": [
      "コミューン",
      "青森びいき",
      "青森県観光ファンコミュニティ"
    ],
    "domainSourceIds": [
      "breachCommuneAomori2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "skyticket",
    "name": "skyticket（スカイチケット）",
    "short": "予約・登録・旧プレミアム会員情報",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "transport"
    },
    "domains": [
      {
        "host": "skyticket.jp",
        "includeSubdomains": false
      }
    ],
    "keywords": [
      "skyticket",
      "スカイチケット",
      "アドベンチャー",
      "skyticketプレミアム"
    ],
    "domainSourceIds": [
      "breachSkyticketFirst2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "honto",
    "name": "honto",
    "short": "メールマガジン配信を許諾した方",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "media"
    },
    "keywords": [
      "ホント",
      "大日本印刷",
      "丸善",
      "ジュンク堂"
    ],
    "domains": [
      {
        "host": "honto.jp",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachHonto2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "nhk-publishing",
    "name": "NHK出版（みんなの趣味の園芸）",
    "short": "園芸サイトのメール配信登録者",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "media"
    },
    "keywords": [
      "NHK出版",
      "趣味の園芸",
      "みんなの趣味の園芸"
    ],
    "domains": [
      {
        "host": "news.nhk-book.co.jp",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachNHKPublishing2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "capcom-id",
    "name": "CAPCOM ID・イーカプコン",
    "short": "共通アカウントと一部通販アカウント",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "social"
    },
    "keywords": [
      "カプコン",
      "CAPCOM",
      "イーカプコン",
      "ゲーム"
    ],
    "domains": [
      {
        "host": "www.capcom.co.jp",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachCapcom2026",
      "breachCapcomSecond2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "comic-cmoa",
    "name": "コミックシーモア",
    "short": "電子書籍の会員・ログ情報",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "media"
    },
    "keywords": [
      "シーモア",
      "NTTソルマーレ",
      "漫画",
      "電子書籍"
    ],
    "domains": [
      {
        "host": "www.nttsolmare.com",
        "includeSubdomains": false
      },
      {
        "host": "www.cmoa.jp",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachCmoa2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "fuji-tv",
    "name": "フジテレビ（番組宣伝システム）",
    "short": "登録したメディア関係者",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "media"
    },
    "keywords": [
      "フジテレビ",
      "フジテレビジョン",
      "番組宣伝"
    ],
    "domains": [
      {
        "host": "www.fujitv.co.jp",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachFujiTV2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "japan-post",
    "name": "日本郵便・日本郵政（ゆうID）",
    "short": "アプリ・法人ポータル・ゆうIDを区別",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "transport"
    },
    "domains": [
      {
        "host": "www.post.japanpost.jp",
        "includeSubdomains": false
      },
      {
        "host": "www.japanpost.jp",
        "includeSubdomains": false
      },
      {
        "host": "mypage.jpid.pf.japanpost.jp",
        "includeSubdomains": false
      }
    ],
    "keywords": [
      "日本郵便",
      "郵便局アプリ",
      "JP Business Tool Box",
      "ゆうID",
      "ゆうゆうポイント",
      "日本郵政"
    ],
    "domainSourceIds": [
      "breachJapanPostApp2026",
      "breachJapanPostBusiness2026",
      "breachYuId2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "tokyo-metro",
    "name": "東京メトロ",
    "short": "メトポとイベントメールを区別",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "transport"
    },
    "domains": [
      {
        "host": "www.tokyometro.jp",
        "includeSubdomains": false
      },
      {
        "host": "www.to-me-card.jp",
        "includeSubdomains": false
      },
      {
        "host": "www.metro-point-club.jp",
        "includeSubdomains": false
      }
    ],
    "keywords": [
      "東京地下鉄",
      "Tokyo Metro",
      "メトポ",
      "To Me CARD",
      "東京メトロイベントメールマガジン"
    ],
    "domainSourceIds": [
      "breachMetroMetpo2026",
      "breachMetroMetpoPdf2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "digital-agency",
    "name": "デジタル庁",
    "short": "公表事案ごとに対象者を確認",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "public"
    },
    "domains": [
      {
        "host": "www.digital.go.jp",
        "includeSubdomains": false
      }
    ],
    "keywords": [
      "GSS",
      "ガバメントソリューションサービス",
      "Digital Agency"
    ],
    "domainSourceIds": [
      "breachDigitalGss2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "keio",
    "name": "京王電鉄",
    "short": "グループのシステム障害と調査",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "transport"
    },
    "domains": [
      {
        "host": "www.keio.co.jp",
        "includeSubdomains": false
      }
    ],
    "keywords": [
      "京王",
      "京王グループ",
      "Keio"
    ],
    "domainSourceIds": [
      "breachKeioFirst2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "yamato",
    "name": "ヤマト運輸",
    "short": "クロネコ代金後払いサービス",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "transport"
    },
    "domains": [
      {
        "host": "www.kuronekoyamato.co.jp",
        "includeSubdomains": false
      },
      {
        "host": "business.kuronekoyamato.co.jp",
        "includeSubdomains": false
      },
      {
        "host": "www.yamato-hd.co.jp",
        "includeSubdomains": false
      }
    ],
    "keywords": [
      "ヤマト",
      "クロネコヤマト",
      "クロネコ代金後払い"
    ],
    "domainSourceIds": [
      "breachYamatoFourth2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "entouch",
    "name": "エンタッチ（東邦HDグループ）",
    "short": "MR支援のプロジェクト情報",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "business"
    },
    "keywords": [
      "エンタッチ",
      "enTouch",
      "東邦ホールディングス",
      "東邦HD",
      "MR支援"
    ],
    "domains": [
      {
        "host": "entouch.jp",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachEntouch2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "m3",
    "name": "エムスリー",
    "short": "MR君・一部問い合わせフォーム",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "business"
    },
    "keywords": [
      "エムスリー",
      "m3.com",
      "MR君",
      "M3PSP",
      "一人一円基金"
    ],
    "domains": [
      {
        "host": "corporate.m3.com",
        "includeSubdomains": false
      },
      {
        "host": "service.m3psp.jp",
        "includeSubdomains": false
      },
      {
        "host": "m3-1p1y.com",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachM3MrSecond2026",
      "breachM3Studio2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "nec",
    "name": "NEC",
    "short": "委託先を通じた顧客企業の情報",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "business"
    },
    "keywords": [
      "日本電気",
      "NEC",
      "委託先"
    ],
    "domains": [
      {
        "host": "jpn.nec.com",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachNec2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "mitsubishi-gas-chemical",
    "name": "三菱ガス化学",
    "short": "退職者等の氏名・従業員番号",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "business"
    },
    "keywords": [
      "三菱ガス化学",
      "MGC",
      "退職者"
    ],
    "domains": [
      {
        "host": "www.mgc.co.jp",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachMgc2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "toho-gas",
    "name": "東邦ガス",
    "short": "新規事業の問い合わせ・担当者情報",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "business"
    },
    "keywords": [
      "東邦ガス",
      "イエラボ",
      "シャインマスカット"
    ],
    "domains": [
      {
        "host": "www.tohogas.co.jp",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachTohoGas2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "suzuki",
    "name": "スズキ（スズキヴィレッジ）",
    "short": "コミュニティー会員情報",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "daily"
    },
    "keywords": [
      "スズキ",
      "SUZUKI",
      "スズキヴィレッジ"
    ],
    "domains": [
      {
        "host": "www.suzuki.co.jp",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachSuzukiVillage2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "corona",
    "name": "コロナ",
    "short": "施工案件の顧客情報・関連資料",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "business"
    },
    "keywords": [
      "コロナ",
      "CORONA",
      "施工"
    ],
    "domains": [
      {
        "host": "www.corona.co.jp",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachCoronaSecond2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "iwai-cosmo",
    "name": "岩井コスモ証券",
    "short": "一部ネット取引の顧客情報",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "finance"
    },
    "keywords": [
      "岩井コスモ",
      "コスモ・ネットレ",
      "IwaiCosmo"
    ],
    "domains": [
      {
        "host": "www.iwaicosmo.co.jp",
        "includeSubdomains": false
      },
      {
        "host": "www.iwaicosmo.net",
        "includeSubdomains": false
      },
      {
        "host": "ic01.iwaicosmo.co.jp",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachIwaiCosmoSecond2026",
      "breachIwaiCosmoFollowup2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "medley-atlink",
    "name": "メドレー（アットリンク）",
    "short": "医療機関の予約・患者情報",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "public"
    },
    "keywords": [
      "メドレー",
      "MEDLEY",
      "アットリンク",
      "@link",
      "atlink"
    ],
    "domains": [
      {
        "host": "www.medley.jp",
        "includeSubdomains": false
      },
      {
        "host": "at-link.net",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachAtlinkInvestigation2026",
      "breachMedleyAtlink2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "transcosmos",
    "name": "トランスコスモス",
    "short": "過去のコールセンター採用応募者",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "business"
    },
    "keywords": [
      "トランスコスモス",
      "transcosmos",
      "ApplyNow",
      "契約社員採用"
    ],
    "domains": [
      {
        "host": "www.trans-cosmos.co.jp",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachTranscosmos2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "yamaha",
    "name": "ヤマハ（YNE）",
    "short": "ネットワークエンジニア会の会員情報",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "daily"
    },
    "keywords": [
      "ヤマハ",
      "YAMAHA",
      "YNE",
      "ヤマハネットワークエンジニア会"
    ],
    "domains": [
      {
        "host": "www.yamaha.com",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachYamahaYne2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "treasure-factory",
    "name": "トレジャー・ファクトリー",
    "domains": [
      {
        "host": "www.treasure-f.com",
        "includeSubdomains": false
      },
      {
        "host": "www.treasurefactory.co.jp",
        "includeSubdomains": false
      },
      {
        "host": "www.trefac-shuccho.com",
        "includeSubdomains": false
      },
      {
        "host": "www.tfhikkoshi.com",
        "includeSubdomains": false
      }
    ],
    "short": "出張買取・引越し等の利用情報",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "shopping"
    },
    "keywords": [
      "トレファク",
      "トレジャーファクトリー",
      "出張買取",
      "トレファク引越"
    ],
    "domainSourceIds": [
      "breachTreasureFactory2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "and-st",
    "name": "and ST（アンドエスティ）",
    "domains": [
      {
        "host": "www.dot-st.com",
        "includeSubdomains": false
      },
      {
        "host": "www.andst-hd.co.jp",
        "includeSubdomains": false
      }
    ],
    "short": "業務サーバー内の顧客・関係者情報",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "shopping"
    },
    "keywords": [
      "and ST",
      "アンドエスティ",
      "アンドエスティHD",
      ".st",
      "ドットエスティ"
    ],
    "domainSourceIds": [
      "breachAndStCorporate2026",
      "breachAndStCustomer2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "joshin",
    "name": "Joshin",
    "domains": [
      {
        "host": "www.joshin.co.jp",
        "includeSubdomains": false
      },
      {
        "host": "joshinweb.jp",
        "includeSubdomains": false
      },
      {
        "host": "shop.joshin.co.jp",
        "includeSubdomains": false
      },
      {
        "host": "card.joshin.co.jp",
        "includeSubdomains": false
      }
    ],
    "short": "ネットワークへの不正アクセス",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "shopping"
    },
    "keywords": [
      "ジョーシン",
      "上新電機",
      "Joshin web"
    ],
    "domainSourceIds": [
      "breachJoshin2026",
      "breachJoshinNewsIndex2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "hankyu-hanshin",
    "name": "阪急阪神百貨店・H2O ID",
    "domains": [
      {
        "host": "www.hankyu-hanshin-dept.co.jp",
        "includeSubdomains": false
      },
      {
        "host": "www.hankyu-dept.co.jp",
        "includeSubdomains": false
      },
      {
        "host": "www.hanshin-dept.jp",
        "includeSubdomains": false
      },
      {
        "host": "h2o-id.h2o-retailing.co.jp",
        "includeSubdomains": false
      }
    ],
    "short": "会員ID・通販の利用情報",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "shopping"
    },
    "keywords": [
      "阪急百貨店",
      "阪神百貨店",
      "H2O ID",
      "HANKYU HANSHIN E-STORES",
      "Remo Order"
    ],
    "domainSourceIds": [
      "breachHankyuHanshin2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "fancl",
    "name": "ファンケル",
    "domains": [
      {
        "host": "www.fancl.jp",
        "includeSubdomains": false
      },
      {
        "host": "www.fancl.co.jp",
        "includeSubdomains": false
      },
      {
        "host": "faq.fancl.co.jp",
        "includeSubdomains": false
      }
    ],
    "short": "会員・一部の注文情報",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "shopping"
    },
    "keywords": [
      "FANCL",
      "ファンケルオンライン"
    ],
    "domainSourceIds": [
      "breachFanclAttenir2026",
      "breachAttenir2026",
      "breachFanclFAQ2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "attenir",
    "name": "アテニア",
    "domains": [
      {
        "host": "www.attenir.co.jp",
        "includeSubdomains": false
      }
    ],
    "short": "会員・一部の注文情報",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "shopping"
    },
    "keywords": [
      "Attenir",
      "アテニアオンラインショップ"
    ],
    "domainSourceIds": [
      "breachFanclAttenir2026",
      "breachAttenir2026",
      "breachFanclFAQ2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "aena",
    "name": "アエナ",
    "domains": [
      {
        "host": "www.aena.co.jp",
        "includeSubdomains": false
      }
    ],
    "short": "公式アプリ・会員プロフィール",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "shopping"
    },
    "keywords": [
      "AENA",
      "アエナECアプリ"
    ],
    "domainSourceIds": [
      "breachAenaFirst2026",
      "breachAenaResume2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "izumi-yume",
    "name": "イズミ（ゆめオンライン・ゆめデリバリー）",
    "domains": [
      {
        "host": "www.izumi.co.jp",
        "includeSubdomains": false
      }
    ],
    "short": "通販サービスのメール配信",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "shopping"
    },
    "keywords": [
      "イズミ",
      "ゆめオンライン",
      "ゆめデリバリー",
      "ゆめタウン"
    ],
    "domainSourceIds": [
      "breachIzumiFirst2026",
      "breachIzumiSecond2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "nifty-broadband",
    "name": "ニフティ（@nifty光）",
    "short": "一部の光回線申込者",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "daily"
    },
    "keywords": [
      "nifty",
      "ニフティ",
      "光回線"
    ],
    "domains": [
      {
        "host": "www.nifty.co.jp",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachNifty2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "studio-design",
    "name": "Studio",
    "short": "Web制作アカウント・サイトのフォーム",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "publishing"
    },
    "keywords": [
      "Studio",
      "スタジオ",
      "サイト制作",
      "フォーム"
    ],
    "domains": [
      {
        "host": "studio.design",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachStudio2026",
      "breachStudioPortal2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "ly-dslab",
    "name": "LINEヤフー（DS.LAB）",
    "short": "DS.INSIGHTの利用者コミュニティ",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "social"
    },
    "keywords": [
      "LINEヤフー",
      "DS.LAB",
      "DS.INSIGHT",
      "コミューン"
    ],
    "domains": [
      {
        "host": "www.lycorp.co.jp",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachLyDSLab2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "wangan-arcade",
    "name": "バンダイナムコ（湾岸ミッドナイト）",
    "short": "公式ポータルのコミュニティ会員",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "social"
    },
    "keywords": [
      "バンダイナムコ",
      "湾岸ミッドナイト",
      "アーケード",
      "コミューン"
    ],
    "domains": [
      {
        "host": "wanganmaxi-official.com",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachWangan2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "ozmall",
    "name": "OZmall",
    "short": "オズモールの会員・一部退会者",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "media"
    },
    "keywords": [
      "OZmall",
      "オズモール",
      "スターツ出版"
    ],
    "domains": [
      {
        "host": "starts-pub.jp",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachOzmall2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "sourcenext",
    "name": "ソースネクスト",
    "short": "ソースネクストの登録会員",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "shopping"
    },
    "keywords": [
      "ソースネクスト",
      "SOURCENEXT",
      "筆まめ",
      "筆王"
    ],
    "domains": [
      {
        "host": "www.sourcenext.com",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachSourcenext2026",
      "breachSourcenextFAQ2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "skyperfect-jsat",
    "name": "スカパーJSAT",
    "short": "販促メール・一部Webフォーム",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "media"
    },
    "keywords": [
      "スカパー",
      "スカパー！メンバーズ",
      "SATELLITE CRAYON PROJECT",
      "衛星"
    ],
    "domains": [
      {
        "host": "www.skyperfectjsat.space",
        "includeSubdomains": false
      },
      {
        "host": "satellite-crayon.skyperfectjsat.space",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachSkypMail2026",
      "breachSkypStudio2026",
      "breachSkypStudio2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "newspicks",
    "name": "NewsPicks",
    "short": "管理ツールに保存された利用者・取引先情報",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "media"
    },
    "keywords": [
      "NewsPicks",
      "ニューズピックス",
      "ユーザベース"
    ],
    "domains": [
      {
        "host": "newspicks.com",
        "includeSubdomains": false
      },
      {
        "host": "corp.newspicks.com",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachNewsPicks2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "bookoff",
    "name": "BOOKOFF",
    "short": "アプリ・オンライン等の会員情報",
    "keywords": [
      "ブックオフ",
      "BOOKOFF",
      "ブックオフオンライン"
    ],
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "shopping"
    },
    "domains": [
      {
        "host": "www.bookoff.co.jp",
        "includeSubdomains": false
      },
      {
        "host": "www.bookoffgroup.co.jp",
        "includeSubdomains": false
      },
      {
        "host": "shopping.bookoff.co.jp",
        "includeSubdomains": false
      },
      {
        "host": "member.bookoff.co.jp",
        "includeSubdomains": false
      },
      {
        "host": "sell.bookoff.co.jp",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachBookoffSecond2026",
      "breachBookoffFaq2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "mos",
    "name": "モスバーガー",
    "short": "モスカードの番号・PIN・残高情報",
    "keywords": [
      "モスバーガー",
      "モスカード",
      "モスフードサービス",
      "MOS"
    ],
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "shopping"
    },
    "domains": [
      {
        "host": "www.mos.jp",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachMos2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "pizzahut",
    "name": "ピザハット",
    "short": "国内オンライン注文の情報",
    "keywords": [
      "ピザハット",
      "Pizza Hut",
      "日本ピザハット"
    ],
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "shopping"
    },
    "domains": [
      {
        "host": "corp.pizzahut.jp",
        "includeSubdomains": false
      },
      {
        "host": "www.pizzahut.jp",
        "includeSubdomains": false
      },
      {
        "host": "pizzahut.jp",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachPizzahut2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "mizkan-asia-pacific",
    "name": "ミツカン（Mizkan Asia Pacific）",
    "short": "海外事業サイトの問い合わせ情報",
    "keywords": [
      "ミツカン",
      "Mizkan",
      "Mizkan Asia Pacific",
      "mizkan.asia"
    ],
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "shopping"
    },
    "domains": [
      {
        "host": "mizkan.asia",
        "includeSubdomains": false
      },
      {
        "host": "www.mizkan.co.jp",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachMizkanAsia2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "zenb-garden",
    "name": "ZENB GARDEN",
    "short": "オンラインコミュニティの会員情報",
    "keywords": [
      "ZENB",
      "ゼンブ",
      "ZENB GARDEN",
      "ミツカン"
    ],
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "social"
    },
    "domains": [
      {
        "host": "garden.zenb.jp",
        "includeSubdomains": false
      },
      {
        "host": "zenb.jp",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachZenbGarden2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "gin-no-sara",
    "name": "銀のさら・釜寅・すし上等",
    "short": "公式サイト・アプリの会員情報",
    "keywords": [
      "銀のさら",
      "釜寅",
      "すし上等",
      "ライドオンエクスプレス"
    ],
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "shopping"
    },
    "domains": [
      {
        "host": "www.ginsara.jp",
        "includeSubdomains": false
      },
      {
        "host": "www.kamatora.jp",
        "includeSubdomains": false
      },
      {
        "host": "www.sushijoto.jp",
        "includeSubdomains": false
      },
      {
        "host": "www.rideonexpresshd.co.jp",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachGinsara2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "daiichi-kosho",
    "name": "第一興商（ビッグエコー等）",
    "short": "委託先が保有していた会員・従業員情報",
    "keywords": [
      "第一興商",
      "ビッグエコー",
      "BIG ECHO",
      "カラオケメガビッグ",
      "カラオケCLUB DAM",
      "バナナクラブ",
      "B-GARAGE",
      "DKダイニング"
    ],
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "daily"
    },
    "domains": [
      {
        "host": "www.dkkaraoke.co.jp",
        "includeSubdomains": false
      },
      {
        "host": "big-echo.jp",
        "includeSubdomains": false
      },
      {
        "host": "megakara.jp",
        "includeSubdomains": false
      },
      {
        "host": "karaokeclub.jp",
        "includeSubdomains": false
      },
      {
        "host": "dkdining.com",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachDaiichiKosho2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "daiki-suisan",
    "name": "大起水産",
    "short": "公式アプリの会員情報",
    "keywords": [
      "大起水産",
      "だいきすいさん",
      "DAIKI SUISAN"
    ],
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "shopping"
    },
    "domains": [
      {
        "host": "www.daiki-suisan.co.jp",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachDaikiSuisan2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "okinawa-tourist",
    "name": "沖縄ツーリスト（OTS）",
    "short": "レンタカー・宿泊等の登録情報",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "transport"
    },
    "domains": [
      {
        "host": "otspremium.com",
        "includeSubdomains": false
      },
      {
        "host": "www.otsinfo.co.jp",
        "includeSubdomains": false
      },
      {
        "host": "www.otsinternational.jp",
        "includeSubdomains": false
      }
    ],
    "keywords": [
      "OTSレンタカー",
      "OTS HOTEL",
      "OTS ACTIVITIES",
      "OTS Club",
      "デジタルDMO"
    ],
    "domainSourceIds": [
      "breachOtsSecond2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "jr-shikoku",
    "name": "JR四国",
    "short": "ツアーWebメールマガジン",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "transport"
    },
    "domains": [
      {
        "host": "www.jr-shikoku.co.jp",
        "includeSubdomains": false
      },
      {
        "host": "www.jr-eki.com",
        "includeSubdomains": false
      }
    ],
    "keywords": [
      "四国旅客鉄道",
      "JR四国ツアーWeb"
    ],
    "domainSourceIds": [
      "breachJrShikokuMail2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "fujiq",
    "name": "富士急ハイランド",
    "short": "公式アプリ・CLUBフジQ",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "daily"
    },
    "domains": [
      {
        "host": "www.fujiq.jp",
        "includeSubdomains": false
      }
    ],
    "keywords": [
      "CLUBフジQ",
      "フジキュー",
      "富士急"
    ],
    "domainSourceIds": [
      "breachFujiqLogin2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "jr-kyushu-food",
    "name": "JR九州フードサービス",
    "short": "うまや・たんや等のトイポ会員",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "daily"
    },
    "domains": [
      {
        "host": "www.jrfs.co.jp",
        "includeSubdomains": false
      }
    ],
    "keywords": [
      "うまや",
      "たんや",
      "トイポアプリ"
    ],
    "domainSourceIds": [
      "breachJrKyushuFood2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "jr-central-market",
    "name": "JR東海MARKET・いいもの探訪",
    "short": "通販サイトのメール配信",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "shopping"
    },
    "domains": [
      {
        "host": "market.jr-central.co.jp",
        "includeSubdomains": false
      },
      {
        "host": "jr-central.co.jp",
        "includeSubdomains": false
      }
    ],
    "keywords": [
      "JR東海",
      "東海旅客鉄道",
      "いいもの探訪",
      "JR東海マーケット"
    ],
    "domainSourceIds": [
      "breachJrCentralFirst2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "nimoca",
    "name": "nimoca（ニモカ）",
    "short": "Web利用履歴照会サービス",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "transport"
    },
    "domains": [
      {
        "host": "www.nimoca.jp",
        "includeSubdomains": false
      },
      {
        "host": "api.nimoca.jp",
        "includeSubdomains": false
      }
    ],
    "keywords": [
      "ニモカ",
      "西鉄nimoca",
      "交通系IC"
    ],
    "domainSourceIds": [
      "breachNimocaFirst2026",
      "breachNimocaResume2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "aeon",
    "name": "イオン",
    "short": "グループの一部Webサイト",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "shopping"
    },
    "keywords": [
      "イオン",
      "AEON",
      "イオングループ"
    ],
    "domains": [
      {
        "host": "www.aeon.info",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachAeon2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "green-expo-2027",
    "name": "GREEN×EXPO 2027（国際園芸博覧会協会）",
    "short": "ボランティアのメール配信情報",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "public"
    },
    "keywords": [
      "GREEN EXPO",
      "グリーンエクスポ",
      "国際園芸博覧会協会",
      "花博",
      "ボランティア"
    ],
    "domains": [
      {
        "host": "expo2027yokohama.or.jp",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachExpoVolunteer2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "tohoku-frontier",
    "name": "東北電力フロンティア",
    "short": "イベントの問い合わせ・eポイントモール",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "daily"
    },
    "keywords": [
      "東北電力",
      "eポイントモール",
      "キャンプフロンティア",
      "MusuBiz"
    ],
    "domains": [
      {
        "host": "www.tohoku-frontier.co.jp",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachTohokuFrontierStudio2026",
      "breachTohokuFrontierMail2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "mhlw-1fedu",
    "name": "厚生労働省（1FEdu）",
    "short": "廃炉等作業の研修サイト受講者",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "public"
    },
    "keywords": [
      "いちえふエデュ",
      "1FEdu",
      "テクノヒル",
      "厚労省",
      "廃炉研修"
    ],
    "domains": [
      {
        "host": "www.mhlw.go.jp",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachMhlw1fedu2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "fukuoka-convention",
    "name": "福岡コンベンションセンター",
    "short": "施設・落とし物・駐車スペースのフォーム",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "public"
    },
    "keywords": [
      "マリンメッセ",
      "福岡国際会議場",
      "福岡国際センター",
      "福岡市イベント施設"
    ],
    "domains": [
      {
        "host": "www.marinemesse.or.jp",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachFukuokaConvention2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "hamamatsu-city",
    "name": "浜松市（消防局）",
    "short": "119RAIDEN・Net119の登録者",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "public"
    },
    "keywords": [
      "浜松",
      "消防団",
      "Net119",
      "119RAIDEN",
      "アルカディア"
    ],
    "domains": [
      {
        "host": "www.city.hamamatsu.shizuoka.jp",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachHamamatsuFire2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "omaezaki-city",
    "name": "御前崎市（防災メール）",
    "short": "防災メールサービスの登録者",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "public"
    },
    "keywords": [
      "御前崎",
      "防災メール",
      "アルカディア"
    ],
    "domains": [
      {
        "host": "www.city.omaezaki.shizuoka.jp",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachOmaezakiMail2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "osaka-metropolitan-university",
    "name": "大阪公立大学",
    "short": "委託先クラウドと学内基盤を区別",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "public"
    },
    "keywords": [
      "OMU",
      "大阪公立大",
      "大阪市立大学",
      "大阪府立大学"
    ],
    "domains": [
      {
        "host": "www.omu.moe",
        "includeSubdomains": false
      },
      {
        "host": "e.omu.ac.jp",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachOmuDomain"
    ],
    "supportSourceIds": []
  },
  {
    "id": "nikkei",
    "name": "日本経済新聞社",
    "short": "システム開発用クラウドに保管された情報",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "media"
    },
    "keywords": [
      "日経",
      "NIKKEI",
      "日本経済新聞"
    ],
    "domains": [
      {
        "host": "www.nikkei.co.jp",
        "includeSubdomains": false
      },
      {
        "host": "www.nikkei.com",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachNikkei2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "niigata-nippo",
    "name": "新潟日報社",
    "short": "新潟日報パスポートの会員情報",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "media"
    },
    "keywords": [
      "新潟日報",
      "パスポート",
      "にいがた鮭プロジェクト",
      "ブラストメール"
    ],
    "domains": [
      {
        "host": "www.niigata-nippo.co.jp",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachNiigataSecond2026",
      "breachNiigataThird2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "furusato-choice",
    "name": "ふるさとチョイス",
    "short": "寄附者の会員情報・寄附手続き",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "shopping"
    },
    "keywords": [
      "ふるさとチョイス",
      "ふるさと納税",
      "トラストバンク"
    ],
    "domains": [
      {
        "host": "www.furusato-tax.jp",
        "includeSubdomains": false
      },
      {
        "host": "www.trustbank.co.jp",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachFurusato2026",
      "breachFurusatoSecond2026",
      "breachFurusatoDisplay2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "shopserve",
    "name": "Eストアー（ショップサーブ）",
    "short": "利用店舗の購入者・会員・運営者",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "shopping"
    },
    "keywords": [
      "ショップサーブ",
      "Eストアー",
      "BASE子会社",
      "ネットショップ"
    ],
    "domains": [
      {
        "host": "estore.jp",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachShopserve2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "worldshopping",
    "name": "ジグザグ（WorldShopping）",
    "short": "海外から購入代行を利用した顧客",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "shopping"
    },
    "keywords": [
      "ジグザグ",
      "WorldShopping",
      "ワールドショッピング",
      "越境EC"
    ],
    "domains": [
      {
        "host": "www.zig-zag.co.jp",
        "includeSubdomains": false
      },
      {
        "host": "www.worldshopping.global",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "zigzagDomain2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "astemo",
    "name": "Astemo（アステモ）",
    "short": "従業員・仕入先等の業務情報",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "business"
    },
    "keywords": [
      "Astemo",
      "アステモ",
      "日立Astemo"
    ],
    "domains": [
      {
        "host": "www.astemo.com",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachAstemo2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "sansan",
    "name": "Sansan（User Forum）",
    "short": "ユーザーコミュニティーの会員情報",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "business"
    },
    "keywords": [
      "Sansan",
      "サンサン",
      "Sansan User Forum",
      "サンサンユーザーフォーラム"
    ],
    "domains": [
      {
        "host": "jp.corp-sansan.com",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachSansanForum2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "yamaha-motor",
    "name": "ヤマハ発動機（PAS Life）",
    "short": "電動アシスト自転車コミュニティー",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "daily"
    },
    "keywords": [
      "ヤマハ発動機",
      "YAMAHA PAS Life",
      "PAS Life",
      "パスライフ"
    ],
    "domains": [
      {
        "host": "www.yamaha-motor.co.jp",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachYamahaMotorPas2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "daiichi-life",
    "name": "第一ライフグループ・第一生命",
    "short": "従業員・退職者の人事情報",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "finance"
    },
    "keywords": [
      "第一ライフ",
      "第一生命",
      "Daiichi Life",
      "退職者",
      "人事システム"
    ],
    "domains": [
      {
        "host": "www.dai-ichi-life.co.jp",
        "includeSubdomains": false
      },
      {
        "host": "www.daiichilife-group.com",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachDaiichiLifeHr2026",
      "breachDaiichiLifeGroupHr2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "mazda",
    "name": "マツダ（CLUB MAZDA COMMUNITY）",
    "short": "コミュニティー会員・運営担当者",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "daily"
    },
    "keywords": [
      "マツダ",
      "MAZDA",
      "CLUB MAZDA COMMUNITY",
      "クラブマツダ"
    ],
    "domains": [
      {
        "host": "newsroom.mazda.com",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachMazdaCommunity2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "onamae-desktop-cloud",
    "name": "お名前.com デスクトップクラウド",
    "short": "FX取引ツールなどを設置して使うクラウドサービス",
    "operator": "GMOインターネット株式会社",
    "companyAliases": [
      "GMOインターネットグループ株式会社"
    ],
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "business"
    },
    "keywords": [
      "お名前.com",
      "お名前ドットコム",
      "デスクトップクラウド",
      "GMO",
      "FX",
      "MT4",
      "MT5"
    ],
    "domains": [
      {
        "host": "www.onamae.com",
        "includeSubdomains": false
      },
      {
        "host": "help.onamae.com",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachOnamaeDesktopFirst2026",
      "breachOnamaeDesktopFifth2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "nabari-kintetsu-gas",
    "name": "名張近鉄ガス",
    "short": "プロパンガス利用者の顧客情報",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "business"
    },
    "keywords": [
      "名張近鉄ガス",
      "近鉄ガス",
      "大阪ガス",
      "Daigas"
    ],
    "domains": [
      {
        "host": "www.kintetsugas.co.jp",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachNabariGas2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "shingu-gas",
    "name": "新宮ガス",
    "short": "一部のガス利用者の顧客情報",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "business"
    },
    "keywords": [
      "新宮ガス",
      "大阪ガス",
      "Daigas"
    ],
    "domains": [
      {
        "host": "www.shingugas.co.jp",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachShinguGas2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "asahi-kasei-medical",
    "name": "旭化成メディカル",
    "short": "医療従事者向けサイトの予防停止",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "public"
    },
    "keywords": [
      "旭化成メディカル",
      "Asahi Kasei Medical"
    ],
    "domains": [
      {
        "host": "www.am-blood-purif.com",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachAsahiMedicalMaintenance2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "ymirlink",
    "name": "ユミルリンク（Cuenote）",
    "short": "一部のメール配信システム",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "business"
    },
    "domains": [
      {
        "host": "www.ymir.co.jp",
        "includeSubdomains": false
      },
      {
        "host": "www.cuenote.jp",
        "includeSubdomains": false
      }
    ],
    "keywords": [
      "ユミルリンク",
      "Cuenote FC",
      "キューノート"
    ],
    "domainSourceIds": [
      "breachYmirlink2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "blastmail",
    "name": "ブラストメール（ラクスライトクラウド）",
    "short": "契約者と配信先情報を区別",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "business"
    },
    "domains": [
      {
        "host": "blastmail.jp",
        "includeSubdomains": false
      },
      {
        "host": "www.rakus.co.jp",
        "includeSubdomains": false
      }
    ],
    "keywords": [
      "ラクス",
      "ラクスライトクラウド",
      "blastmail",
      "ブラストメール"
    ],
    "domainSourceIds": [
      "breachBlastmail2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "baitoru",
    "name": "バイトル・バイトルNEXT",
    "short": "会員のメールアドレス",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "business"
    },
    "domains": [
      {
        "host": "www.baitoru.com",
        "includeSubdomains": false
      },
      {
        "host": "www.dip-net.co.jp",
        "includeSubdomains": false
      }
    ],
    "keywords": [
      "バイトル",
      "バイトルNEXT",
      "ディップ",
      "dip"
    ],
    "domainSourceIds": [
      "breachBaitoru2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "temairazu",
    "name": "手間いらず（TEMAIRAZU）",
    "short": "導入施設の宿泊予約情報",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "business"
    },
    "domains": [
      {
        "host": "www.temairazu.co.jp",
        "includeSubdomains": false
      },
      {
        "host": "www.temairazu.com",
        "includeSubdomains": false
      }
    ],
    "keywords": [
      "手間いらず",
      "TEMAIRAZU",
      "宿泊予約管理システム"
    ],
    "domainSourceIds": [
      "breachTemairazuIr2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "resorttrust",
    "name": "リゾートトラスト",
    "short": "一部会員・カハラ横浜予約者情報",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "transport"
    },
    "domains": [
      {
        "host": "www.resorttrust.co.jp",
        "includeSubdomains": false
      },
      {
        "host": "rsv.rtg.jp",
        "includeSubdomains": false
      },
      {
        "host": "mypage.rttg.jp",
        "includeSubdomains": false
      }
    ],
    "keywords": [
      "エクシブ",
      "RTTG",
      "ザ・カハラ",
      "ベイコート",
      "リゾートトラスト"
    ],
    "domainSourceIds": [
      "breachResorttrustUpdate2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "his",
    "name": "HIS（タイ現地法人の事案）",
    "short": "対象期間のタイ旅行情報",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "transport"
    },
    "domains": [
      {
        "host": "www.his.co.jp",
        "includeSubdomains": false
      }
    ],
    "keywords": [
      "エイチ・アイ・エス",
      "H.I.S. TOURS",
      "HISタイ",
      "コムローイ祭り"
    ],
    "domainSourceIds": [
      "breachHisThailand2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "his-hotels",
    "name": "HISホテルホールディングス",
    "short": "ホテル会員のメールマガジン",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "transport"
    },
    "domains": [
      {
        "host": "www.hishotelgroup.com",
        "includeSubdomains": false
      },
      {
        "host": "www.hennnahotel.com",
        "includeSubdomains": false
      }
    ],
    "keywords": [
      "HISホテル",
      "変なホテル",
      "H.I.S.ホテルホールディングス"
    ],
    "domainSourceIds": [
      "breachHisHotelMail2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "daiwa-securities",
    "name": "大和証券",
    "short": "インターネット経由の問い合わせ情報",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "finance"
    },
    "keywords": [
      "大和証券",
      "Daiwa",
      "スカラコミュニケーションズ"
    ],
    "domains": [
      {
        "host": "www.daiwa.jp",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachDaiwaDomain2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "shikoku-bank",
    "name": "四国銀行（大和証券提携）",
    "short": "大和証券の問い合わせ情報に関する案内",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "finance"
    },
    "keywords": [
      "四国銀行",
      "しぎん",
      "大和証券",
      "金融商品仲介"
    ],
    "domains": [
      {
        "host": "www.shikokubank.co.jp",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachShikokuDaiwa2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "pharma-digital",
    "name": "旭化成セラピューティクス（Pharma DIGITAL）",
    "short": "医療従事者向けサイトの会員情報",
    "category": "service",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "public"
    },
    "keywords": [
      "旭化成",
      "旭化成セラピューティクス",
      "旭化成ファーマ",
      "Pharma DIGITAL",
      "ファーマデジタル",
      "医薬情報ネット"
    ],
    "domains": [
      {
        "host": "akp-pharma-digital.com",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachPharmaDigital2026"
    ],
    "supportSourceIds": []
  },
  {
    "id": "arcadia-raiden",
    "name": "アルカディア（RAIDEN・NET119）",
    "short": "自治体・学校・消防の情報配信",
    "roles": [
      "user"
    ],
    "groupByRole": {
      "user": "public"
    },
    "keywords": [
      "アルカディア",
      "arcadia",
      "SpeeCAN RAIDEN",
      "スピーキャンライデン",
      "ライデン・スクール",
      "ライデンスクール",
      "NET119",
      "119RAIDEN",
      "防災メール"
    ],
    "domains": [
      {
        "host": "www.arcadia.co.jp",
        "includeSubdomains": false
      },
      {
        "host": "raiden.site.ktaiwork.jp",
        "includeSubdomains": false
      },
      {
        "host": "raiden.ktaiwork.jp",
        "includeSubdomains": false
      },
      {
        "host": "raiden2.ktaiwork.jp",
        "includeSubdomains": false
      },
      {
        "host": "raiden3.ktaiwork.jp",
        "includeSubdomains": false
      },
      {
        "host": "raiden2.speecan.jp",
        "includeSubdomains": false
      },
      {
        "host": "s.ktaiwork.jp",
        "includeSubdomains": false
      },
      {
        "host": "s2.ktaiwork.jp",
        "includeSubdomains": false
      },
      {
        "host": "net119.speecan.jp",
        "includeSubdomains": false
      },
      {
        "host": "net119fd.speecan.jp",
        "includeSubdomains": false
      },
      {
        "host": "fs119.ktaiwork.jp",
        "includeSubdomains": false
      }
    ],
    "domainSourceIds": [
      "breachArcadiaTimeline2026",
      "breachArcadiaReport2026",
      "breachArcadiaExplanation2026"
    ],
    "category": "service",
    "supportSourceIds": []
  }
];
