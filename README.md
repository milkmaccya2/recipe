# Recipe Suggester AI

画像から献立を提案するWebアプリケーション。ユーザーがカメラで食材を撮影すると、AIが食材を識別し、その食材を使った献立を提案します。

## 主要機能

- 📷 カメラ起動による食材撮影
- 🤖 AI画像認識による食材識別（Amazon Rekognition）
- 🍽️ 識別した食材に基づく献立提案（OpenAI GPT-4）
- 🧂 調味料不足時の代替レシピ提案
- ❤️ レシピ履歴・お気に入り管理
- 🔐 GitHub/Google OAuth認証

## 技術スタック

### Frontend
- **Next.js 14** (App Router)
- **Jotai** - 状態管理
- **Shadcn/ui** - UIコンポーネント
- **Tailwind CSS** - スタイリング

### Backend
- **Next.js API Routes**
- **NextAuth.js** - 認証
- **Supabase** - PostgreSQL データベース
- **Prisma** - ORM

### AI/画像処理
- **Amazon Rekognition** - 画像認識
- **OpenAI GPT-4** - レシピ生成

### インフラ
- **AWS S3 + CloudFront** - 画像ストレージ
- **Vercel** - ホスティング

## セットアップ

### 前提条件

- Node.js 18+ 
- npm または yarn
- AWS アカウント (S3, Rekognition用)
- OpenAI API キー
- Supabase プロジェクト

### インストール

```bash
# リポジトリのクローン
git clone <repository-url>
cd recipe-suggester-ai

# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env.local
```

### 環境変数の設定

`.env.local` ファイルに以下の環境変数を設定してください：

```env
# Next.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AWS
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=ap-northeast-1
AWS_S3_BUCKET_NAME=your-bucket-name

# AI APIs
OPENAI_API_KEY=your-openai-api-key

# GitHub OAuth
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Development
USE_AI_MOCK=false # 開発時にAI機能をモックする場合はtrue
```

### データベースのセットアップ

```bash
# Supabaseスキーマの適用
# lib/supabase/schema.sql の内容をSupabase SQLエディタで実行
```

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリケーションにアクセスできます。

## テスト

### テスト実装状況

このプロジェクトでは包括的なテストスイートを実装しています：

#### 実装済みテスト

- **ユーティリティ関数テスト**
  - `lib/utils.test.ts` - 共通ユーティリティ関数
  - `lib/utils/image.test.ts` - 画像処理ユーティリティ
  - `lib/validations.test.ts` - Zodバリデーションスキーマ

- **カスタムフックテスト**
  - `hooks/use-camera.test.ts` - カメラ機能フック
  - `hooks/use-favorites.test.ts` - お気に入り管理フック

- **Reactコンポーネントテスト**
  - `components/providers.test.tsx` - プロバイダーコンポーネント
  - `components/features/recipe-card.test.tsx` - レシピカード
  - `components/features/header.test.tsx` - ヘッダーコンポーネント
  - `components/features/image-upload.test.tsx` - 画像アップロード
  - `components/features/camera-modal.test.tsx` - カメラモーダル
  - `components/features/recipe-list.test.tsx` - レシピ一覧
  - `components/features/recipe-detail.test.tsx` - レシピ詳細
  - `components/features/seasoning-checker.test.tsx` - 調味料チェッカー

- **API関数テスト**
  - `app/api/upload/route.test.ts` - 画像アップロードAPI
  - `app/api/recipes/route.test.ts` - レシピ生成API

- **AWS統合テスト**
  - `lib/aws/s3.test.ts` - S3アップロード機能
  - `lib/aws/rekognition.test.ts` - Rekognition画像認識

#### テストコマンド

```bash
# 全テスト実行
npm test

# テストをウォッチモードで実行
npm run test:watch

# カバレッジレポート生成
npm run test:coverage

# 特定のテストファイル実行
npm test -- --testPathPattern="recipe-card"

# 型チェック
npm run typecheck

# リント
npm run lint
```

#### テスト設定

- **テストフレームワーク**: Jest + React Testing Library
- **設定ファイル**: `jest.config.js`, `jest.setup.js`
- **モック**: next-auth, AWS SDK, OpenAI, Jotai atoms
- **カバレッジ目標**: 主要な機能で80%以上

#### テストの特徴

- **コンポーネントテスト**: ユーザーインタラクション、状態変更、エラーハンドリング
- **統合テスト**: API呼び出し、外部サービス連携（モック使用）
- **エラーハンドリング**: ネットワークエラー、バリデーションエラー、API制限
- **認証テスト**: ログイン状態による動作変化
- **レスポンシブテスト**: デバイス固有の機能テスト

## 開発ガイド

### ディレクトリ構造

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── auth/              # 認証ページ
│   └── globals.css        # グローバルスタイル
├── components/            # コンポーネント
│   ├── ui/               # Shadcn/ui コンポーネント
│   └── features/         # 機能別コンポーネント
├── hooks/                # カスタムフック
├── lib/                  # ユーティリティ・設定
│   ├── aws/             # AWS関連ユーティリティ
│   ├── utils/           # 汎用ユーティリティ
│   └── constants.ts     # 定数定義
├── stores/               # Jotai atoms
├── types/                # TypeScript型定義
└── __tests__/           # E2Eテスト
```

### 主要なワークフロー

1. **画像アップロード** → S3保存 → Rekognition解析
2. **食材識別** → 英語→日本語マッピング → 信頼度フィルタリング
3. **レシピ生成** → OpenAI GPT-4 → 構造化データ変換
4. **調味料チェック** → 不足調味料検出 → 代替レシピ提案

### コーディング規約

詳細は `CLAUDE.md` を参照してください。

## デプロイ

### Vercel デプロイ

```bash
# Vercel CLIのインストール
npm i -g vercel

# デプロイ
vercel --prod
```

### 環境変数の設定

Vercelダッシュボードで本番用環境変数を設定してください。

## ライセンス

MIT License

## 貢献

1. フォークする
2. feature ブランチを作成する
3. 変更をコミットする
4. プルリクエストを作成する

## サポート

問題や質問がある場合は、GitHubのIssuesでお知らせください。