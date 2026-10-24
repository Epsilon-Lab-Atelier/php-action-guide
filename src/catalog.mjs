export const checkedAt = '2026-10-24';

export const sources = {
  noteNotice: {
    title: 'note: PHPの脆弱性について - noteのサービスではPHPを使用していません',
    url: 'https://note.jp/n/n09b0faecd702',
    publishedAt: '2026-10-22',
    checkedAt,
  },
  wordpressComNotice: {
    title: 'WordPress.com: 今回の重大なPHP脆弱性への対応について',
    url: 'https://wordpress.com/blog/2026/10/21/php2shell-vulnerabilities/',
    publishedAt: '2026-10-21',
    checkedAt,
  },
  wordpressComDomains: {
    title: 'WordPress.com: サイトアドレスの仕組み',
    url: 'https://wordpress.com/support/changing-site-address/',
    publishedAt: null,
    checkedAt,
  },
  pixivReport: {
    title: 'pixiv: PHP 8.5.12の緊急リリースにpixivはどう対応したか',
    url: 'https://inside.pixiv.blog/2026/10/22/193321',
    publishedAt: '2026-10-22',
    checkedAt,
  },
  boothNotice: {
    title: 'BOOTH: 緊急メンテナンスに伴う注文・ログインへの影響について (復旧)',
    url: 'https://booth.pm/announcements/1004',
    publishedAt: '2026-10-21',
    checkedAt,
  },
  boothDomains: {
    title: 'BOOTH: ショップURLの案内',
    url: 'https://booth.pixiv.help/hc/ja/articles/115005850707',
    publishedAt: null,
    checkedAt,
  },
  wordpressRequirements: {
    title: 'WordPress.org: 動作要件',
    url: 'https://wordpress.org/about/requirements/',
    publishedAt: null,
    checkedAt,
  },
  drupalRequirements: {
    title: 'Drupal: PHPの動作要件',
    url: 'https://www.drupal.org/docs/getting-started/system-requirements/php-requirements',
    publishedAt: null,
    checkedAt,
  },
  drupalNotice: {
    title: 'Drupal: PHPの緊急更新に関する案内 (PSA-2026-10-20)',
    url: 'https://www.drupal.org/psa-2026-10-20',
    publishedAt: '2026-10-21',
    checkedAt,
  },
};

export const services = [
  {
    id: 'note',
    name: 'note',
    short: '記事の閲覧・投稿・購入',
    category: 'service',
    domains: [
      { host: 'note.com', includeSubdomains: false },
      { host: 'money.note.com', includeSubdomains: false },
      { host: 'tales.note.com', includeSubdomains: false },
    ],
    php: {
      label: '公式に不使用と説明',
      text: 'note株式会社は、同社が提供するサービスでPHPを使用していないと説明しています。告知の対象はnote、note pro、noteマネー、TALESです。',
      sourceIds: ['noteNotice'],
    },
    incident: {
      label: '公式説明あり',
      text: '10月22日の告知では、今回の脆弱性による影響はないと考えており、サービス停止の予定はないと説明しています。外部サービスの埋め込みは、そのサービス側のメンテナンスで表示できない場合があります。',
      sourceIds: ['noteNotice'],
    },
    officialAction: {
      text: '運営元は、投稿・閲覧・購入などを従来どおり利用できると案内しています。外部の埋め込みについては、各サービスのお知らせを確認するよう案内しています。',
      sourceIds: ['noteNotice'],
    },
    actions: {
      user: [
        '公式のお知らせを開き、利用する機能が告知の対象に含まれるか確認する。',
        '記事内の動画や商品などだけが表示されない場合は、埋め込み元のお知らせを確認する。',
        '追加のお知らせや個別の案内が届いていないか確認する。',
      ],
      admin: [
        'noteへの投稿や販売を行う立場では、PHPの保守はサービス側の管理範囲として扱う。',
        '自分が管理する外部サイトや埋め込み先があれば、その事業者の対応状況を別に確認する。',
        '独自ドメインのnote proサイトはURLだけで照合できないため、契約と公式案内の対象を確認する。',
      ],
    },
    caution: 'この説明はnoteの公式告知の範囲です。外部サービスや、ほかの安全上の問題まで保証するものではありません。',
  },
  {
    id: 'wordpress-com',
    name: 'WordPress.com',
    short: '運営会社に管理を任せるブログサービス',
    category: 'service',
    domains: [{ host: 'wordpress.com', includeSubdomains: true }],
    php: {
      label: '公式に使用を確認',
      text: 'WordPress.comはPHPを使用し、PHPの導入・保守・修正は運営元が行うと説明しています。',
      sourceIds: ['wordpressComNotice'],
    },
    incident: {
      label: '公式説明あり',
      text: '10月21日の告知では、WordPress.comでホストするサイトは、この日に公表されたPHPの問題に対する保護措置を実施済みと説明しています。',
      sourceIds: ['wordpressComNotice'],
    },
    officialAction: {
      text: '10月21日の告知では、この問題のためにWordPress.comのサイト所有者が行う作業はないと説明しています。自分でサーバーを運用する場合には更新を案内しています。',
      sourceIds: ['wordpressComNotice'],
    },
    actions: {
      user: [
        '利用しているサイトがWordPress.comの管理するサービスか確認する。',
        '公式告知の日付と、その後の追加のお知らせを確認する。',
        '閲覧・購入などに支障がある場合は、サイト運営元の案内や問い合わせ窓口を確認する。',
      ],
      admin: [
        '契約先がWordPress.comか、自分で設置したWordPressかを区別する。',
        'WordPress.comであれば、PHPの更新を自分で行おうとせず、運営元の続報を確認する。',
        '別のサーバーも管理している場合は、その環境のPHP修正状況を別に確認する。',
      ],
    },
    caution: '10月23日のPHP追加案内への個別対応は、この掲載資料では未確認です。独自ドメインはURLだけでは照合できません。自己管理のWordPressにこの対応状況は適用できません。',
  },
  {
    id: 'pixiv',
    name: 'pixiv',
    short: '作品の閲覧・投稿',
    category: 'service',
    domains: [
      { host: 'pixiv.net', includeSubdomains: false },
      { host: 'www.pixiv.net', includeSubdomains: false },
    ],
    php: {
      label: '公式に使用を確認',
      text: '運営元の技術ブログで、pixivの稼働環境にPHPを使用し、今回の修正を適用したことを説明しています。',
      sourceIds: ['pixivReport'],
    },
    incident: {
      label: '公式説明あり',
      text: '10月22日の報告では、10月21日にPHPのセキュリティ更新を適用し、pixivのメンテナンスを解除した経緯を説明しています。',
      sourceIds: ['pixivReport'],
    },
    officialAction: {
      text: 'この掲載資料から、一般利用者へのパスワード変更などの具体的な対応指示は未確認です。資料は運営側の更新作業についての報告です。',
      sourceIds: ['pixivReport'],
    },
    actions: {
      user: [
        '公式のお知らせで、現在の利用状況と追加の案内を確認する。',
        '自分宛ての個別通知がある場合は、対象と必要な手続きを確認する。',
        'ほかのピクシブ関連サービスも使う場合は、それぞれの告知を確認する。',
      ],
      admin: [
        'pixivへの投稿者・利用者としては、サーバー側のPHP更新は運営元の管理範囲として扱う。',
        '作品からリンクする自分のサイトがある場合は、そちらのPHP修正状況を別に確認する。',
        '運営元の更新報告の日付と、その後の追加案内を確認する。',
      ],
    },
    caution: '10月23日のPHP追加案内への個別対応は、この掲載資料では未確認です。pixivの更新報告から、関連サービス全体の対応状況や被害の有無は断定できません。',
  },
  {
    id: 'booth',
    name: 'BOOTH',
    short: '商品の購入・販売',
    category: 'service',
    domains: [{ host: 'booth.pm', includeSubdomains: true }],
    php: {
      label: '未確認',
      text: '今回掲載したBOOTHの公式告知では、PHPを使用しているかどうかは明記されていません。関連サービスの技術情報から推測しません。',
      sourceIds: ['boothNotice'],
    },
    incident: {
      label: '未確認',
      text: '公式には10月21日のセキュリティ強化目的のメンテナンスと復旧が告知されています。ただし、本文にはPHPや今回の対象CVEとの関係が明記されておらず、この問題への対応状況は未確認です。',
      sourceIds: ['boothNotice'],
    },
    officialAction: {
      text: '告知は、メンテナンス中にログインや購入ができない場合があったと説明しています。この掲載資料から、利用者が追加で行う手続きは未確認です。',
      sourceIds: ['boothNotice'],
    },
    actions: {
      user: [
        'BOOTHの公式告知で、注文・ログインに関する案内を確認する。',
        '購入途中で利用できなくなった場合は、注文履歴や決済状況を確認してから操作を続ける。',
        '状況が分からない場合は、公式の問い合わせ窓口で確認する。',
      ],
      admin: [
        'BOOTHのショップ運営者としては、サービス側のPHPを自分で更新する作業とは分けて考える。',
        '注文や販売に支障がある場合は、BOOTHの案内と問い合わせ窓口を確認する。',
        '別途管理する自分の通販サイトがあれば、その環境の修正状況を別に確認する。',
      ],
    },
    caution: 'メンテナンスの復旧告知だけでは、PHPの使用状況、今回の脆弱性の修正状況、被害の有無は判定できません。',
  },
  {
    id: 'wordpress-selfhost',
    name: '自分で設置したWordPress',
    short: 'レンタルサーバーなどで動かすCMS',
    category: 'cms',
    domains: [],
    php: {
      label: '公式に使用を確認',
      text: 'WordPress公式の動作要件にはPHPが含まれます。ただし、あなたのサイトで動いているPHPの版や修正状況は、このアプリでは確認できません。',
      sourceIds: ['wordpressRequirements'],
    },
    incident: {
      label: '未確認',
      text: '個別サイトへの修正適用状況は未確認です。WordPress.comの対応済みという告知は、自分で設置したWordPressの対応を示すものではありません。',
      sourceIds: ['wordpressComNotice'],
    },
    officialAction: {
      text: 'WordPress.comの公式告知でも、自分でサーバーを運用する場合には更新を案内しています。実際の対応は、PHPと利用するホスティング事業者の最新の案内で確認してください。',
      sourceIds: ['wordpressComNotice'],
    },
    actions: {
      user: [
        'そのサイトの運営元が出すお知らせを確認する。',
        '自分が対象となる案内や手続きがあるか確認する。',
        '掲載情報がなければ、影響の有無を推測せず運営元に確認する。',
      ],
      admin: [
        'PHPを誰が管理しているか、契約先や保守担当者に確認する。',
        '稼働中のPHPに今回の修正が適用されたかと、10月23日の追加案内に基づく対応の要否を確認する。',
        '自分で管理する場合は、PHP・OS提供元の案内に沿って更新し、適用状況とサイトの動作を確認する。',
      ],
    },
    caution: 'WordPress本体やプラグインの更新だけで、PHP自体の修正が完了するとは限りません。URLやページの見た目からCMS・PHPの版を推測しません。',
  },
  {
    id: 'drupal',
    name: 'Drupal',
    short: '自分や管理会社が運用するCMS',
    category: 'cms',
    domains: [],
    php: {
      label: '公式に使用を確認',
      text: 'Drupal公式の動作要件にはPHPが含まれます。個別サイトのPHPの版や修正状況は、このアプリでは確認できません。',
      sourceIds: ['drupalRequirements'],
    },
    incident: {
      label: '未確認',
      text: 'Drupal公式は今回のPHP更新に関する案内を公開していますが、個別サイトへの修正適用状況は未確認です。',
      sourceIds: ['drupalNotice'],
    },
    officialAction: {
      text: 'Drupal公式は、PHPを自己管理している場合は更新し、事業者が管理している場合は実施時期と必要な作業について事業者の案内に従うよう求めています。',
      sourceIds: ['drupalNotice'],
    },
    actions: {
      user: [
        '利用するサイトの運営元のお知らせを確認する。',
        'サービス停止の理由と、利用者向けの対応指示があるかを確認する。',
        '情報がなければ、安全かどうかを推測せず運営元に確認する。',
      ],
      admin: [
        'PHPの管理担当を確認し、自己管理かホスティング事業者による管理かを整理する。',
        '今回のPHP修正の適用状況と、10月23日の追加案内に基づく対応の要否を確認する。',
        '更新を担当する場合は、PHP・OS提供元の案内に沿って修正を適用し、Drupalの動作を確認する。',
      ],
    },
    caution: 'Drupal公式の更新案内があることと、個別サイトが更新済みであることは別です。PHPの動作要件に書かれた版だけで、今回の修正済みとは判断できません。',
  },
];
