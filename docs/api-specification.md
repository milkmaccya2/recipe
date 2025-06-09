# Recipe Suggester AI - API仕様書

## 概要

Recipe Suggester AIのREST API仕様書です。認証システム、レシピ提案、ユーザー管理、画像処理機能を提供します。

## 認証

### 概要
NextAuth.js v5を使用したJWT認証システム

### プロバイダー
- Google OAuth 2.0
- GitHub OAuth

### 認証フロー
1. `/auth/signin` - サインインページ
2. OAuth認証
3. JWTトークン発行
4. `/dashboard` リダイレクト

---

## エンドポイント一覧

### 🔐 認証関連

#### NextAuth.js API Routes

```
GET/POST /api/auth/[...nextauth]
```
NextAuth.jsが自動生成する認証エンドポイント

**機能:**
- サインイン/サインアウト
- OAuth認証
- セッション管理

---

### 📷 画像・レシピ提案

#### 画像アップロード・分析

```
POST /api/upload
```

**説明:** 画像をアップロードし、食材を認識してレシピを提案

**リクエスト:**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
  "filename": "ingredients.jpg"
}
```

**レスポンス:**
```json
{
  "success": true,
  "uploadResult": {
    "imageUrl": "https://bucket.s3.amazonaws.com/images/123.jpg",
    "s3Key": "images/123.jpg"
  },
  "detectedIngredients": [
    {
      "name": "トマト",
      "confidence": 0.95,
      "category": "vegetable"
    }
  ],
  "recipes": [
    {
      "id": "recipe_123",
      "title": "トマトパスタ",
      "description": "新鮮なトマトを使った簡単パスタ",
      "cookingTime": "20分",
      "difficulty": "easy",
      "servings": 2,
      "calories": 450,
      "ingredients": [...],
      "steps": [...],
      "tips": [...],
      "nutritionInfo": {...}
    }
  ]
}
```

**エラーレスポンス:**
```json
{
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "ファイルサイズが大きすぎます",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

---

#### 画像分析（画像URLから）

```
POST /api/analyze-image
```

**説明:** 既存の画像URLから食材を分析

**リクエスト:**
```json
{
  "imageUrl": "https://example.com/image.jpg"
}
```

**レスポンス:**
```json
{
  "detectedIngredients": [...],
  "success": true
}
```

---

### 🍽️ レシピ管理

#### レシピ一覧取得

```
GET /api/recipes
```

**説明:** ユーザーがアクセス可能なレシピ一覧を取得

**クエリパラメータ:**
- `page` (number): ページ番号 (デフォルト: 1)
- `limit` (number): 1ページあたりの件数 (デフォルト: 20, 最大: 100)
- `difficulty` (string): 難易度フィルター (`easy`, `medium`, `hard`)
- `cookingTime` (number): 調理時間上限（分）
- `search` (string): レシピ名検索

**レスポンス:**
```json
{
  "recipes": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalCount": 95,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

#### 代替レシピ提案

```
POST /api/recipes/alternatives
```

**説明:** 不足調味料を考慮した代替レシピを提案

**リクエスト:**
```json
{
  "recipe": {
    "id": "recipe_123",
    "title": "チキンカレー",
    ...
  },
  "missingSeasonings": ["ガラムマサラ", "カルダモン"]
}
```

**レスポンス:**
```json
{
  "alternatives": [
    {
      "id": "recipe_124",
      "title": "簡単チキンカレー",
      "description": "基本調味料だけで作れるカレー",
      "reasonForAlternative": "ガラムマサラ、カルダモン不使用",
      ...
    }
  ]
}
```

---

### ❤️ お気に入り管理

#### お気に入り一覧取得

```
GET /api/favorites
```

**認証:** 必須

**レスポンス:**
```json
{
  "favorites": [
    {
      "id": "fav_123",
      "recipeId": "recipe_123",
      "recipe": {...},
      "addedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

#### お気に入り追加

```
POST /api/favorites
```

**認証:** 必須

**リクエスト:**
```json
{
  "recipeId": "recipe_123"
}
```

**レスポンス:**
```json
{
  "success": true,
  "favorite": {
    "id": "fav_123",
    "recipeId": "recipe_123",
    "addedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

#### お気に入り削除

```
DELETE /api/favorites/:recipeId
```

**認証:** 必須

**レスポンス:**
```json
{
  "success": true,
  "message": "お気に入りから削除しました"
}
```

---

### 📖 履歴管理

#### 履歴一覧取得

```
GET /api/history
```

**認証:** 必須

**クエリパラメータ:**
- `page` (number): ページ番号
- `limit` (number): 1ページあたりの件数

**レスポンス:**
```json
{
  "history": [
    {
      "id": "hist_123",
      "recipeId": "recipe_123",
      "recipe": {...},
      "viewedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {...}
}
```

---

#### 履歴追加

```
POST /api/history
```

**認証:** 必須

**リクエスト:**
```json
{
  "recipeId": "recipe_123"
}
```

---

### 👤 ユーザー管理

#### ユーザー調味料設定取得

```
GET /api/user/seasonings
```

**認証:** 必須

**レスポンス:**
```json
{
  "seasonings": [
    {
      "id": "seasoning_123",
      "name": "醤油",
      "isAvailable": true,
      "category": "basic"
    }
  ]
}
```

---

#### ユーザー調味料設定更新

```
POST /api/user/seasonings
```

**認証:** 必須

**リクエスト:**
```json
{
  "seasonings": [
    {
      "name": "醤油",
      "isAvailable": true
    },
    {
      "name": "味噌", 
      "isAvailable": false
    }
  ]
}
```

**レスポンス:**
```json
{
  "success": true,
  "message": "調味料設定を保存しました"
}
```

---

## データモデル

### Recipe

```typescript
interface Recipe {
  id: string
  title: string
  description: string
  image?: string
  cookingTime: string
  difficulty: 'easy' | 'medium' | 'hard'
  servings: number
  calories?: number
  ingredients: RecipeIngredient[]
  steps: RecipeStep[]
  tips?: string[]
  nutritionInfo?: NutritionInfo
  createdAt: string
  updatedAt: string
}
```

### RecipeIngredient

```typescript
interface RecipeIngredient {
  name: string
  amount: string
  unit: string
  category?: 'vegetable' | 'meat' | 'dairy' | 'grain' | 'seasoning' | 'other'
}
```

### RecipeStep

```typescript
interface RecipeStep {
  step: number
  instruction: string
  duration?: string
  tips?: string
}
```

### NutritionInfo

```typescript
interface NutritionInfo {
  protein: number    // g
  carbs: number      // g
  fat: number        // g
  fiber: number      // g
}
```

### DetectedIngredient

```typescript
interface DetectedIngredient {
  name: string
  confidence: number
  category: string
  boundingBox?: {
    left: number
    top: number
    width: number
    height: number
  }
}
```

---

## エラーハンドリング

### エラーレスポンス形式

```typescript
interface ErrorResponse {
  error: {
    code: string
    message: string
    timestamp: string
    context?: Record<string, unknown>
    stack?: string  // 開発環境のみ
  }
}
```

### エラーコード一覧

| コード | 説明 | HTTPステータス |
|--------|------|----------------|
| `UNAUTHORIZED` | 認証が必要 | 401 |
| `FORBIDDEN` | アクセス権限なし | 403 |
| `NOT_FOUND` | リソースが見つからない | 404 |
| `VALIDATION_ERROR` | バリデーションエラー | 400 |
| `FILE_TOO_LARGE` | ファイルサイズ超過 | 400 |
| `INVALID_FILE_TYPE` | 対応していないファイル形式 | 400 |
| `OPENAI_API_ERROR` | OpenAI APIエラー | 500 |
| `AWS_S3_ERROR` | S3アップロードエラー | 500 |
| `AWS_REKOGNITION_ERROR` | Rekognition分析エラー | 500 |
| `DATABASE_ERROR` | データベースエラー | 500 |

---

## レート制限

- **認証済みユーザー:** 1000リクエスト/時間
- **未認証ユーザー:** 100リクエスト/時間
- **画像アップロード:** 50回/時間
- **OpenAI API呼び出し:** 200回/日

---

## セキュリティ

### 認証
- JWT (JSON Web Token)
- セッション有効期限: 30日
- CSRF保護: NextAuth.js内蔵

### ファイルアップロード
- 最大ファイルサイズ: 10MB
- 対応形式: JPEG, PNG, WebP
- ウイルススキャン: CloudFront経由

### レート制限
- IP基準の制限
- ユーザー基準の制限
- Redis Cache使用

---

## 環境変数

```bash
# 認証
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_ID=your_github_client_id
GITHUB_SECRET=your_github_client_secret

# データベース
DATABASE_URL=postgresql://user:password@host:port/database
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# AWS
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ap-northeast-1
AWS_S3_BUCKET=your-bucket-name

# OpenAI
OPENAI_API_KEY=your_openai_api_key
```

---

## 使用例

### 基本的な画像アップロードフロー

```javascript
// 1. 画像をアップロード
const formData = new FormData()
formData.append('image', file)

const uploadResponse = await fetch('/api/upload', {
  method: 'POST',
  body: formData
})

const result = await uploadResponse.json()

// 2. 提案されたレシピを表示
result.recipes.forEach(recipe => {
  console.log(recipe.title, recipe.description)
})

// 3. お気に入りに追加
if (result.recipes.length > 0) {
  const favoriteResponse = await fetch('/api/favorites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipeId: result.recipes[0].id })
  })
}
```

---

## バージョン履歴

### v1.0.0 (2024-01-01)
- 初期リリース
- 基本的なレシピ提案機能

### v1.1.0 (2024-01-15) 
- 認証システム統合
- お気に入り機能追加
- 履歴機能追加

### v1.2.0 (2024-02-01)
- 調味料チェッカー機能
- 代替レシピ提案
- ユーザー設定保存

---

Generated with [Claude Code](https://claude.ai/code)