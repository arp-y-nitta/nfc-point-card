# NFC ポイントカードアプリ

LINE ミニアプリを使用した NFC ポイントカードアプリケーションです。ユーザーが NFC タグをスキャンすると、ユーザー ID と店舗 ID を記録し、ポイント付与の履歴として保存します。

## 機能

- NFC タグからアプリにアクセス
- LINE ユーザー ID の取得
- URL パラメータから店舗 ID を取得
- スキャン履歴のサーバー保存
- スキャン完了画面の表示

## 技術スタック

- Next.js
- React
- TypeScript
- LINE LIFF SDK
- Tailwind CSS

## セットアップ

1. 依存関係をインストール

```
npm install
```

2. 環境変数を設定
   `.env.local` ファイルを作成し、以下の変数を設定：

```
NEXT_PUBLIC_LIFF_ID=your-liff-id-here
```

3. 開発サーバーを起動

```
npm run dev
```

## 使用方法

1. LINE デベロッパーコンソールで LIFF アプリを作成し、LIFF ID を取得
2. `.env.local`ファイルに LIFF ID を設定
3. NFC タグにアプリの URL を書き込む（例：https://your-domain.com/scan?storeId=shibuya01）
4. LINE アプリ内で NFC タグをスキャン

## API エンドポイント

- POST `/api/scan` - スキャン履歴を保存
  - リクエストボディ: `{ "userId": "LINE-USER-ID", "storeId": "STORE-ID" }`
  - レスポンス: `{ "success": true, "scanRecord": { ... } }`

## ライセンス

MIT
