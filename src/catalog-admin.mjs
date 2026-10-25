export const adminSources = {
  sakuraPhpNotice: {
    title: 'さくらインターネット: PHPの脆弱性に関する対応状況 (10月23日追記)',
    url: 'https://www.sakura.ad.jp/corporate/information/announcements/2026/10/22/1968226117/',
    publishedAt: '2026-10-22', updatedAt: '2026-10-23', checkedAt: '2026-10-25', kind: 'incident',
  },
  sakuraRentalPhpHelp: {
    title: 'さくら：提供PHPの脆弱性対応状況と利用者への案内',
    url: 'https://help.sakura.ad.jp/notification/n-2700/',
    publishedAt: '2026-10-22', updatedAt: '2026-10-22', checkedAt: '2026-10-25', kind: 'incident',
  },
  sakuraStatus: {
    title: 'さくらインターネット: メンテナンス・障害情報',
    url: 'https://help.sakura.ad.jp/status/',
    publishedAt: null, checkedAt: '2026-10-24', kind: 'support',
  },
  xserverPhpNotice: {
    title: 'エックスサーバー: 公式サイト・管理画面等の一時停止とPHPへの対応',
    url: 'https://www.xserver.ne.jp/news_detail.php?view_id=19734',
    publishedAt: '2026-10-22', updatedAt: '2026-10-23', checkedAt: '2026-10-25', kind: 'incident',
  },
  xserverStatus: {
    title: 'エックスサーバー: 障害・メンテナンス情報',
    url: 'https://www.xserver.ne.jp/support/information.php',
    publishedAt: null, checkedAt: '2026-10-24', kind: 'support',
  },
  lolipopPhpNotice: {
    title: 'ロリポップ!: PHPの脆弱性へのメンテナンス完了と経緯',
    url: 'https://lolipop.jp/info/news/8239/',
    publishedAt: '2026-10-22', checkedAt: '2026-10-25', kind: 'incident',
  },
  lolipopSupport: {
    title: 'ロリポップ!: お問い合わせ',
    url: 'https://lolipop.jp/support-chat/',
    publishedAt: null, checkedAt: '2026-10-24', kind: 'support',
  },
  conohaWingPhpNotice: {
    title: 'ConoHa WING: PHPの脆弱性への対応完了のお知らせ (終報)',
    url: 'https://www.conoha.jp/wing/news/?ap=2015054909',
    publishedAt: '2026-10-22', checkedAt: '2026-10-25', kind: 'incident',
  },
  conohaWingSupport: {
    title: 'ConoHa WING: サポート',
    url: 'https://support.conoha.jp/wing/',
    publishedAt: null, checkedAt: '2026-10-24', kind: 'support',
  },
  eccubePhpNotice: {
    title: 'EC-CUBE: PHPのセキュリティリリース公開について (対応のお願い)',
    url: 'https://www.ec-cube.net/news/detail.php?news_id=492',
    publishedAt: '2026-10-22', checkedAt: '2026-10-25', kind: 'incident',
  },
  eccubeSupport: {
    title: 'EC-CUBE: サポート',
    url: 'https://www.ec-cube.net/support/',
    publishedAt: null, checkedAt: '2026-10-24', kind: 'support',
  },
};

export const adminServices = [
  {
    id: 'sakura-rental', name: 'さくらのレンタルサーバ', short: '事業者が提供するPHPを利用',
    category: 'service', roles: ['admin'], groupByRole: { admin: 'hosting' },
    keywords: ['さくら', 'サクラ', 'sakura', 'レンタルサーバー'], domains: [],
    supportSourceIds: ['sakuraStatus'],
    php: {
      label: '公式に提供を確認',
      text: '事業者がPHPを提供するサービスです。個々の契約サイトでPHPを使っているかは、このアプリでは確認しません。',
      sourceIds: ['sakuraPhpNotice'],
    },
    incident: {
      label: '公式説明あり',
      text: '10月23日追記の告知では、10月21日に公表された2件について、サービスで提供するPHPへ必要な修正を適用したと説明しています。',
      sourceIds: ['sakuraPhpNotice'],
    },
    officialAction: {
      text: '10月21日の2件について、コントロールパネルで提供するPHPは対応済みで、利用者の緊急対応は不要と案内しています。サポート中のPHPへの移行は引き続き推奨しています。自分でOSやPHPを管理するVPS等の契約は対象外です。',
      sourceIds: ['sakuraPhpNotice', 'sakuraRentalPhpHelp'],
    },
    actions: {
      user: ['サイト運営元のお知らせを確認する。', '利用できない機能と案内されている手続きを確認する。', '不明点はサイト運営元へ問い合わせる。'],
      admin: ['契約が「さくらのレンタルサーバ」であることを確認する。', '公式告知で、利用中のPHPが修正の対象に含まれるか確認する。', 'サイトの表示・フォームなどの動作と、追加のお知らせを確認する。'],
    },
    caution: 'この告知の対象は10月21日の2件です。10月23日の追加CVEへの個別対応は、この資料では未確認です。VPS内で自分が導入したPHPには、この修正済みの説明を適用できません。',
  },
  {
    id: 'sakura-vps', name: 'さくらのVPS', short: 'VPS内のPHPは利用者が管理',
    category: 'service', roles: ['admin'], groupByRole: { admin: 'server' },
    keywords: ['さくら', 'サクラ', 'sakura', '仮想サーバー', 'vps'], domains: [],
    supportSourceIds: ['sakuraStatus'],
    php: {
      label: '利用環境は未確認',
      text: '事業者はVPSのサービス提供部分ではPHPを使っていないと説明しています。一方、利用者がVPS内に導入したPHPは別で、個々の環境は未確認です。',
      sourceIds: ['sakuraPhpNotice'],
    },
    incident: {
      label: '利用環境は未確認',
      text: '事業者の提供部分には影響がないとの説明がありますが、利用者のVPS内で動くPHPの修正状況は示していません。',
      sourceIds: ['sakuraPhpNotice'],
    },
    officialAction: {
      text: 'VPS内でPHPが動いている場合は、利用者自身が状況を確認し、提供元の情報に沿って更新するよう案内しています。',
      sourceIds: ['sakuraPhpNotice'],
    },
    actions: {
      user: ['利用するサイトの運営元のお知らせを確認する。', '必要な手続きがあるか確認する。', 'サーバー会社の告知だけで個別サイトの状態を判断しない。'],
      admin: ['VPS内でPHPを使っているか、管理担当者と配布元を確認する。', 'PHP・OS提供元の修正を適用し、必要な再起動と動作確認を行う。', '10月23日の追加案内も、自分の構成に当てはまるか確認する。'],
    },
    caution: '「VPSのサービス提供部分でPHP不使用」と「VPS内の自分のサイトでPHP不使用」は別です。個別環境が安全・対応不要とは判断できません。',
  },
  {
    id: 'xserver', name: 'エックスサーバー', short: 'レンタルサーバーのPHPを確認',
    category: 'service', roles: ['admin'], groupByRole: { admin: 'hosting' },
    keywords: ['xserver', 'x server', 'エックス', 'レンタルサーバー'], domains: [],
    supportSourceIds: ['xserverStatus'],
    php: {
      label: '公式に提供を確認',
      text: 'レンタルサーバーでPHPを提供しています。事業者の告知はPHPの系列ごとに修正状況を分けています。',
      sourceIds: ['xserverPhpNotice'],
    },
    incident: {
      label: '公式説明あり',
      text: '10月23日追記時点の告知では、提供するPHP 5.6〜8.5は対象サーバーへの修正適用が完了、5.1〜5.5は過半数への適用完了と説明しています。',
      sourceIds: ['xserverPhpNotice'],
    },
    officialAction: {
      text: 'PHP 5.6〜8.5の利用者は、この問題のために急いでバージョンを変える必要はないと案内しています。利用状況によって追加対応を依頼する場合があるとも説明しています。',
      sourceIds: ['xserverPhpNotice'],
    },
    actions: {
      user: ['利用するサイトの運営元のお知らせを確認する。', '必要な手続きがあるか確認する。', 'サーバー会社の対応から個別サイトの被害の有無を推測しない。'],
      admin: ['契約がレンタルサーバーかVPSかを確認する。', '使用中のPHPの系列と、公式告知に書かれた適用範囲を照合する。', '古い系列や追加の指示は、最新の告知またはサポートへ確認する。'],
    },
    caution: 'ここで紹介する修正は10月21日の問題への説明です。10月23日の追加CVEへの個別対応は未確認です。XServer VPSへ同じ対応済みの説明を広げないでください。',
  },
  {
    id: 'lolipop', name: 'ロリポップ!', short: 'レンタルサーバーのPHPを確認',
    category: 'service', roles: ['admin'], groupByRole: { admin: 'hosting' },
    keywords: ['ロリポップ', 'ろりぽっぷ', 'lolipop', 'ロリポ', 'レンタルサーバー'], domains: [],
    supportSourceIds: ['lolipopSupport'],
    php: {
      label: '公式に提供を確認',
      text: 'PHPの実行環境をサーバー側で提供しています。公式告知では、提供中のPHPの系列ごとに修正内容を説明しています。',
      sourceIds: ['lolipopPhpNotice'],
    },
    incident: {
      label: '公式説明あり',
      text: '10月22日の告知で、CVE-2026-109618 / CVE-2026-109619への修正適用とサイト表示の再開を報告しています。アップロード進捗機能を無効にしたことも明記しています。',
      sourceIds: ['lolipopPhpNotice'],
    },
    officialAction: {
      text: 'サポート中のPHPへの切り替えと、サイト・フォーム・アップロードなどの動作確認を求めています。WordPressの本体・プラグイン・テーマも確認するよう案内しています。',
      sourceIds: ['lolipopPhpNotice'],
    },
    actions: {
      user: ['利用するサイトの運営元のお知らせを確認する。', 'フォームなどに不具合があれば運営元に知らせる。', '自分に求められている手続きがあるか確認する。'],
      admin: ['公式告知のPHP設定・更新の案内を確認する。', '表示、問い合わせフォーム、ファイルアップロードを実際に確認する。', '使用中のCMSとの互換性と、追加のお知らせを確認する。'],
    },
    caution: 'PHPの更新状況と、サイト内の機能が動くことは別々に確認してください。10月23日の追加CVEへの個別対応について、この資料だけから完了とは判断しません。',
  },
  {
    id: 'conoha-wing', name: 'ConoHa WING', short: '管理されたレンタルサーバー',
    category: 'service', roles: ['admin'], groupByRole: { admin: 'hosting' },
    keywords: ['このは', 'コノハ', 'conoha', 'wing', 'ウィング', 'レンタルサーバー'], domains: [],
    supportSourceIds: ['conohaWingSupport'],
    php: {
      label: '公式に提供を確認',
      text: 'ConoHa WINGはPHPを提供しています。利用者が独自にPHPを管理するConoHa VPSとは区別してください。',
      sourceIds: ['conohaWingPhpNotice'],
    },
    incident: {
      label: '公式説明あり',
      text: '10月22日の終報で、提供中の全PHPバージョンへ修正を適用したと説明しています。版番号を維持したまま修正を取り込んだため、表示番号だけでは判別できない場合があります。',
      sourceIds: ['conohaWingPhpNotice'],
    },
    officialAction: {
      text: 'この告知では、利用者自身によるPHPバージョンの変更などは必要ないと案内しています。これは告知が扱う問題とConoHa WINGの提供環境に限った説明です。',
      sourceIds: ['conohaWingPhpNotice'],
    },
    actions: {
      user: ['利用するサイトの運営元のお知らせを確認する。', '必要な手続きがあるか確認する。', 'サイトの異常は運営元へ問い合わせる。'],
      admin: ['契約がConoHa WINGであることを確認する。', '表示バージョンだけで未修正と決めず、公式告知の適用範囲を確認する。', 'サイトの動作と、その後の追加案内を確認する。'],
    },
    caution: '10月23日の追加CVEへの個別対応は、この掲載資料では未確認です。ConoHa VPSや、別契約のサーバーにはこの説明を適用できません。',
  },
  {
    id: 'ec-cube', name: 'EC-CUBE', short: '自分や委託先が管理する通販サイト',
    category: 'cms', roles: ['admin'], groupByRole: { admin: 'cms' },
    keywords: ['eccube', 'ec cube', 'ec-cube', 'イーシーキューブ', '通販', 'ネットショップ'], domains: [],
    supportSourceIds: ['eccubeSupport'],
    php: {
      label: '公式に使用を確認',
      text: 'EC-CUBEはPHPを使って動作します。個別サイトに入っているPHPの版や修正状況は、このアプリでは確認できません。',
      sourceIds: ['eccubePhpNotice'],
    },
    incident: {
      label: '利用環境は未確認',
      text: '10月22日の公式告知で、10月21日に公表された2件への対応を求めています。個々のサイトで修正済みかは未確認です。',
      sourceIds: ['eccubePhpNotice'],
    },
    officialAction: {
      text: '管理者・ホスティング会社・保守会社に共有し、PHPの提供元と版、修正適用、再起動後の反映を確認するよう案内しています。購入・決済などの動作確認も必要としています。',
      sourceIds: ['eccubePhpNotice'],
    },
    actions: {
      user: ['ショップ運営元のお知らせを確認する。', '購入に支障がある場合は注文・決済状況を運営元へ確認する。', '利用者向けの追加手続きがあるか確認する。'],
      admin: ['自社・委託先・ホスティング会社のうち、PHPの管理担当を確認する。', 'PHP修正の適用・反映と、10月23日の追加案内への対応要否を確認する。', 'EC-CUBE本体・プラグイン・カスタマイズとの互換性と購入・決済を確認する。'],
    },
    caution: 'EC-CUBE本体やプラグインの更新だけでは、PHP自体の修正を確認したことにはなりません。クラウド版ec-cube.coの契約では、公式案内に従ってコンソールの対応状況を確認してください。',
  },
];
