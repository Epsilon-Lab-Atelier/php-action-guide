# GitHub Pagesでの公開

`.github/workflows/pages.yml` は、ソースからHTMLを生成し、テストが通った内容をGitHub Pagesへ公開します。

## 初回の設定

1. Epsilon-Lab-Atelierで対象リポジトリの [Settings → Pages](https://github.com/Epsilon-Lab-Atelier/php-action-guide/settings/pages) を開きます。
2. **Build and deployment → Source** を **GitHub Actions** にします。
3. ワークフローを `main` に反映します。すでに反映済みの場合は、[Actions](https://github.com/Epsilon-Lab-Atelier/php-action-guide/actions) の **Pages CI → Run workflow** から `main` を選んで実行できます。
4. **Build and test**、**Deploy to GitHub Pages** が成功したことを確認し、デプロイ結果のURLを開きます。

独自ドメインを設定していない場合の公開先は `https://epsilon-lab-atelier.github.io/php-action-guide/` です。これは予定URLであり、ワークフローの追加だけでは公開成功を意味しません。

初回に作成される `github-pages` environment の **Deployment branches and tags** は、公開対象を `main` だけに制限する設定を推奨します。個人アクセストークンの発行やSecretsへの追加は不要です。

## 実行の流れ

| 操作 | ビルド・テスト | Pagesへの公開 |
| --- | --- | --- |
| `main` 向けPRの作成・更新 | 実行 | 実行しない |
| `main` へのpush・PRのマージ | 実行 | 成功後に実行 |
| `main` を指定した手動実行 | 実行 | 成功後に実行 |
| 他のブランチを指定した手動実行 | 実行 | 実行しない |

公開ジョブは `Epsilon-Lab-Atelier/php-action-guide` の `main` に限定しています。別リポジトリへコピーしても自動公開されません。同じブランチの実行は直列にし、進行中の公開を次のpushで中断しません。

Node.js 24で `npm run build` → `npm test` の順に実行します。テストが生成済みのHTMLを読むため、この順序を保ってください。外部パッケージやlockfileはなく、`npm install` や `npm ci` は不要です。

公開用artifactには生成済みの `index.html` と `.nojekyll` だけを入れます。HTMLにはCSS・JavaScript・画像を含むため、`/php-action-guide/` のサブパスでも追加設定なしで動作します。ソース・テスト・保守用ファイルはWebサイトの配信対象に含めません。

ビルドジョブはリポジトリの読み取り権限だけを使います。Pagesへの書き込みとOIDCの権限は、公開ジョブに限定しています。

## 毎朝の公式情報調査との関係

毎朝の調査タスクは、公式情報の変更をレビュー用PRとして提出します。`maintenance/policy.json` の `allowAutoMerge: false` と `allowDeployment: false` は、この調査タスクの操作範囲を定めています。Pages CIのために値を変更する必要はありません。

PRを確認して `main` にマージすると、Pages CIがビルド・テストを実行し、成功した内容を公開します。調査タスクが直接公開したり、PRの内容を自動でマージしたりする設定ではありません。

## 失敗したとき

- **Configure Pages** で失敗する場合は、Settings → PagesのSourceが **GitHub Actions** になっているか確認します。
- **Build and test** で失敗した場合は公開を行いません。ログにあるビルドまたはテストの問題を直して再実行します。
- 公開ジョブが待機している場合は、`github-pages` environmentの承認待ちやブランチ制限を確認します。
- 公開後に問題が見つかった場合は、原因となったソース変更を修正またはrevertして `main` に反映します。生成済みの `dist/index.html` だけを直しても、次のビルドで上書きされます。

## 参考

- [GitHub Pagesのカスタムワークフロー](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [GitHub Pagesの公開元の設定](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
