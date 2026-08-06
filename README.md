# FINAL FANTASY XIV 個人用ツールポータル

FINAL FANTASY XIVの最新情報、更新情報、個人用ツールへの導線をまとめる静的ポータルサイトです。

## 構成

```text
.
├── index.html
├── .nojekyll
├── README.md
└── assets
    ├── css
    │   └── styles.css
    ├── js
    │   └── app.js
    └── images
        └── hero.png
```

## ローカル確認

`index.html` をブラウザで開いて確認できます。

より本番に近い状態で確認する場合は、プロジェクトフォルダで次を実行します。

```bash
python -m http.server 8000
```

その後、ブラウザで `http://localhost:8000` を開きます。

## GitHub Pagesへの公開

1. このフォルダ内のファイルをGitHubリポジトリのルートへアップロードします。
2. GitHubで `Settings` → `Pages` を開きます。
3. `Deploy from a branch` を選択します。
4. Branchを `main`、Folderを `/(root)` に設定します。
5. `Save` を押します。

## 現在の仕様

- 24インチモニターを基準にしたデスクトップレイアウト
- サイドバー開閉
- 横幅が足りない場合の縦並び
- スマートフォン向けレスポンシブ
- 最新情報カルーセル
- 新規・更新ツール一覧
- ツール一覧
- ヒーロー画像

## 注意

現在のニュース、更新情報、ツールリンクはUI確認用のダミーです。  
実際のリンクや自動更新機能は、次のフェーズで実装してください。

本サイトは非公式の個人制作物です。FINAL FANTASY XIVおよび関連名称は各権利者に帰属します。
