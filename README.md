# FINAL FANTASY XIV 個人用ツールポータル

GitHub Pagesで公開する静的ポータルです。

## 管理の基本

### FF14最新情報
手動更新は不要です。

- 公式Lodestone RSSをGitHub Actionsが3時間ごとに確認
- `assets/data/news.json` を自動更新
- ホーム画面は `news.json` を読み込んで最新情報を表示
- RSS取得に失敗した場合は既存の `news.json` を残します

手動で確認したい場合：

`Actions` → `Update FF14 News` → `Run workflow`

### ツールの追加・更新
ホームHTMLは編集しません。

**台帳は `assets/data/tools.json` だけです。**

#### 既存ツールを更新するとき
1. `tools/<ツールID>/` のツール本体を更新
2. `assets/data/tools.json` の該当項目で次を変更
   - `updatedAt`
   - `status`: `"UPDATE"`
   - `updateNote`
3. GitHubへコミット

これだけで「新規・更新ツール」と「ツール一覧」の両方へ反映されます。

#### 新しいツールを追加するとき
1. `tools/<新しいID>/index.html` を作成
2. `tools.json` に1件追加
3. `enabled: true`
4. `status: "NEW"`
5. `path: "./tools/<新しいID>/"`

#### 更新表示を外すとき
`status` を `null` にします。

### tools.json の主な項目

- `id`: 重複しない英数字ID
- `name`: 表示名
- `category`: `CRAFT` / `GATHER` / `BATTLE` / `UTILITY` など
- `icon`: カードのアイコン
- `description`: ツール一覧の説明
- `path`: ツールURL
- `enabled`: `true` でクリック可能
- `visible`: `false` で一覧から非表示
- `status`: `"NEW"` / `"UPDATE"` / `null`
- `updatedAt`: `YYYY-MM-DD`
- `updateNote`: 新規・更新欄に出す説明

## GitHub Pages

- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/(root)`

## GitHub Actionsの権限

`Settings` → `Actions` → `General` → `Workflow permissions` で  
`Read and write permissions` を選択してください。

## ファイル構成

```text
index.html
assets/
  css/styles.css
  js/app.js
  images/hero.png
  data/
    news.json
    tools.json
scripts/
  update-news.js
.github/
  workflows/
    update-news.yml
tools/
  _template.html
```

## 補足
このサイトは非公式の個人制作物です。
