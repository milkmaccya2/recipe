# Recipe Suggester AI - セットアップガイド

## 📋 必要な環境

### システム要件
- Node.js 18.0 以降
- npm 9.0 以降
- Git

### 外部サービス
1. **Supabase** (データベース・認証)
2. **Google Cloud** (OAuth認証)
3. **GitHub** (OAuth認証)
4. **AWS** (S3・Rekognition)
5. **OpenAI** (GPT-4 API)

---

## 🚀 クイックスタート

### 1. リポジトリのクローン

```bash
git clone https://github.com/your-username/recipe-suggester-ai.git
cd recipe-suggester-ai
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

```bash
# .env.localファイルを作成
cp .env.example .env.local

# .envファイルを作成（Prisma用）
cp .env.example .env
```

### 4. データベースのセットアップ

```bash
# Prismaマイグレーション
npx prisma generate
npx prisma db push
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` にアクセス

---

## 🔧 詳細設定

### Supabase設定

#### 1. プロジェクト作成
1. [Supabase](https://supabase.com)にアクセス
2. 「New Project」でプロジェクト作成
3. プロジェクト設定から以下を取得:

```bash
# .env.local に追加
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### 2. データベース設定
```bash
# .env に追加（Prisma用）
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

#### 3. 認証設定
Supabaseダッシュボード > Authentication > Providers:
- Google OAuth有効化
- GitHub OAuth有効化

### Google OAuth設定

#### 1. Google Cloud Console
1. [Google Cloud Console](https://console.cloud.google.com)でプロジェクト作成
2. 「APIs & Services」→「Credentials」
3. 「Create Credentials」→「OAuth 2.0 Client IDs」

#### 2. OAuth設定
- Application type: Web application
- Authorized JavaScript origins: `http://localhost:3000`
- Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`

```bash
# .env.local に追加
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### GitHub OAuth設定

#### 1. GitHub Developer Settings
1. GitHub Settings > Developer settings > OAuth Apps
2. 「New OAuth App」をクリック

#### 2. OAuth設定
- Application name: Recipe Suggester AI
- Homepage URL: `http://localhost:3000`
- Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

```bash
# .env.local に追加
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret
```

### AWS設定

#### 1. IAMユーザー作成
1. AWS Console > IAM > Users
2. 新しいユーザーを作成
3. 以下のポリシーをアタッチ:
   - AmazonS3FullAccess
   - AmazonRekognitionFullAccess

#### 2. S3バケット作成
```bash
# AWS CLIでバケット作成
aws s3 mb s3://your-recipe-bucket
```

#### 3. 環境変数設定
```bash
# .env.local に追加
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_REGION=ap-northeast-1
AWS_S3_BUCKET=your-recipe-bucket
```

### OpenAI設定

#### 1. APIキー取得
1. [OpenAI Platform](https://platform.openai.com)にアクセス
2. API Keys > Create new secret key

```bash
# .env.local に追加
OPENAI_API_KEY=your-openai-api-key
```

### NextAuth設定

```bash
# .env.local に追加
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret-key-min-32-chars
```

---

## 📁 完全な環境変数一覧

### .env.local
```bash
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-at-least-32-characters-long

# Google OAuth
GOOGLE_CLIENT_ID=123456789-xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxxx

# GitHub OAuth  
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# AWS
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=xxx...
AWS_REGION=ap-northeast-1
AWS_S3_BUCKET=your-recipe-bucket

# OpenAI
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### .env (Prisma用)
```bash
# Database
DATABASE_URL="postgresql://postgres:password@db.project.supabase.co:5432/postgres"
```

---

## 🧪 テスト環境

### テスト用データベース

```bash
# テスト用環境変数 (.env.test)
DATABASE_URL="postgresql://postgres:password@localhost:5432/recipe_test"
```

### テスト実行

```bash
# 単体テスト
npm run test

# 統合テスト
npm run test:integration

# E2Eテスト
npm run test:e2e

# カバレッジ
npm run test:coverage
```

---

## 🏭 本番環境設定

### Vercel設定

#### 1. プロジェクトデプロイ
```bash
# Vercel CLIインストール
npm i -g vercel

# デプロイ
vercel
```

#### 2. 環境変数設定
Vercelダッシュボード > Project Settings > Environment Variables:
- すべての環境変数を本番用に設定
- `NEXTAUTH_URL`を本番URLに変更

#### 3. ドメイン設定
- Custom domainを設定
- OAuth redirect URLsを本番URLに更新

### データベース本番設定

```bash
# 本番用マイグレーション
npx prisma migrate deploy
```

---

## 🛠️ 開発コマンド

### 開発関連
```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# プロダクション実行
npm run start

# 型チェック
npm run typecheck

# リント
npm run lint
npm run lint:fix

# フォーマット
npm run format
npm run format:check
```

### データベース関連
```bash
# Prisma Studio
npx prisma studio

# スキーマ生成
npx prisma generate

# マイグレーション作成
npx prisma migrate dev --name migration-name

# データベースリセット
npx prisma migrate reset
```

### その他
```bash
# 依存関係更新
npm update

# セキュリティ監査
npm audit
npm audit fix

# 品質チェック
npm run quality
```

---

## 🚨 トラブルシューティング

### よくある問題

#### 1. データベース接続エラー
```
Error: Can't reach database server
```

**解決方法:**
- DATABASE_URLが正しいか確認
- Supabaseプロジェクトが稼働中か確認
- ファイアウォール設定を確認

#### 2. 認証エラー
```
[next-auth][error][OAUTH_CALLBACK_ERROR]
```

**解決方法:**
- OAuth Client IDとSecretを確認
- Redirect URLが正しいか確認
- NEXTAUTH_SECRETが設定されているか確認

#### 3. AWS S3エラー
```
AccessDenied: Access Denied
```

**解決方法:**
- AWS認証情報を確認
- IAMポリシーが正しいか確認
- S3バケットが存在するか確認

#### 4. OpenAI APIエラー
```
Error: You exceeded your current quota
```

**解決方法:**
- OpenAI APIキーを確認
- 使用量上限を確認
- 課金設定を確認

### ログの確認

#### 開発環境
```bash
# フロントエンドログ
console.log outputs in browser

# APIログ
npm run dev で自動表示
```

#### 本番環境
```bash
# Vercelログ
vercel logs

# Supabaseログ
Supabaseダッシュボード > Logs
```

---

## 📚 追加リソース

### ドキュメント
- [API仕様書](./api-specification.md)
- [ユーザーガイド](./user-guide.md)
- [要件定義書](./requirements.md)

### 外部ドキュメント
- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs)

### コミュニティ
- [GitHub Issues](https://github.com/your-username/recipe-suggester-ai/issues)
- [Discussions](https://github.com/your-username/recipe-suggester-ai/discussions)

---

## ✅ セットアップチェックリスト

### 環境構築
- [ ] Node.js 18+ インストール
- [ ] リポジトリクローン
- [ ] npm install 実行
- [ ] .env.local 作成
- [ ] .env 作成

### 外部サービス設定
- [ ] Supabaseプロジェクト作成
- [ ] Google OAuth設定
- [ ] GitHub OAuth設定  
- [ ] AWS IAMユーザー作成
- [ ] S3バケット作成
- [ ] OpenAI APIキー取得

### データベース設定
- [ ] Prisma generate実行
- [ ] Prisma db push実行
- [ ] データベース接続確認

### テスト
- [ ] 開発サーバー起動確認
- [ ] 認証フロー確認
- [ ] 画像アップロード確認
- [ ] レシピ提案確認

### 本番デプロイ
- [ ] Vercelデプロイ
- [ ] 本番環境変数設定
- [ ] ドメイン設定
- [ ] 本番動作確認

---

**Generated with [Claude Code](https://claude.ai/code)**