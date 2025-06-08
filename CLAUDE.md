# Recipe Suggester AI - プロジェクトコンテキスト

## プロジェクト概要
画像から献立を提案するWebアプリケーション。ユーザーがカメラで食材を撮影すると、AIが食材を識別し、その食材を使った献立を提案する。

## 主要機能
1. カメラ起動による食材撮影
2. AI画像認識による食材識別
3. 識別した食材に基づく献立提案
4. 調味料不足時の代替レシピ提案
5. レシピ履歴・お気に入り管理

## 技術スタック
- **Frontend**: Next.js 14 (App Router), Jotai, Shadcn/ui, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma, Supabase (PostgreSQL)
- **AI/画像**: Amazon Rekognition, OpenAI GPT-4
- **Storage**: AWS S3 + CloudFront
- **Hosting**: Vercel

## コーディング規約

### ディレクトリ構造
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 認証が必要なルート
│   ├── api/               # API Routes
│   └── components/        # ページ固有のコンポーネント
├── components/            # 共通コンポーネント
│   ├── ui/               # Shadcn/ui コンポーネント
│   └── features/         # 機能別コンポーネント
├── hooks/                # カスタムフック
├── lib/                  # ユーティリティ関数
├── stores/               # Jotai atoms
├── types/                # TypeScript型定義
└── __tests__/           # テストファイル
```

### 命名規則
- **コンポーネント**: PascalCase (例: `RecipeCard.tsx`)
- **関数・変数**: camelCase (例: `analyzeImage`)
- **定数**: UPPER_SNAKE_CASE (例: `MAX_FILE_SIZE`)
- **型定義**: PascalCase with suffix (例: `RecipeType`, `UserProps`)
- **Jotai atoms**: camelCase with 'Atom' suffix (例: `userAtom`, `recipesAtom`)

### コンポーネント設計
```tsx
// 基本的なコンポーネント構造
export function ComponentName({ prop1, prop2 }: ComponentNameProps) {
  // hooks は最上部に
  const [state, setState] = useAtom(stateAtom)
  
  // ハンドラー関数
  const handleAction = useCallback(() => {
    // 処理
  }, [dependencies])
  
  // レンダリング
  return (
    <div className="...">
      {/* JSX */}
    </div>
  )
}
```

### API設計
```typescript
// API Route の基本構造
export async function POST(request: Request) {
  try {
    // 認証チェック
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // バリデーション
    const body = await request.json()
    const validatedData = schema.parse(body)
    
    // 処理実行
    const result = await processData(validatedData)
    
    return NextResponse.json(result)
  } catch (error) {
    // エラーハンドリング
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
```

## テスト戦略

### テストツール
- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: Jest + MSW (Mock Service Worker)
- **E2E Tests**: Playwright
- **Visual Regression**: Chromatic (Storybook)

### テストコマンド
```bash
# ユニットテスト
npm run test

# E2Eテスト
npm run test:e2e

# カバレッジレポート
npm run test:coverage

# 型チェック
npm run typecheck

# リント
npm run lint
```

### テスト実装方針
1. **必須テスト対象**
   - 画像アップロード・バリデーション
   - AI API連携（モック使用）
   - 認証フロー
   - データベース操作
   - エラーハンドリング

2. **テストカバレッジ目標**
   - ユニットテスト: 80%以上
   - 統合テスト: 主要フローを網羅
   - E2Eテスト: クリティカルパスを網羅

3. **テストファイル配置**
   ```
   src/
   ├── components/RecipeCard/
   │   ├── RecipeCard.tsx
   │   └── RecipeCard.test.tsx
   ├── lib/imageAnalysis/
   │   ├── imageAnalysis.ts
   │   └── imageAnalysis.test.ts
   └── __tests__/
       ├── integration/
       └── e2e/
   ```

## 環境変数
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AWS
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-northeast-1
AWS_S3_BUCKET_NAME=

# AI APIs
OPENAI_API_KEY=
REKOGNITION_REGION=ap-northeast-1

# Auth
NEXTAUTH_URL=
NEXTAUTH_SECRET=
```

## デプロイチェックリスト
- [ ] 環境変数の設定確認
- [ ] データベースマイグレーション実行
- [ ] テスト全パス確認
- [ ] ビルド成功確認
- [ ] セキュリティヘッダー設定
- [ ] エラー監視設定（Sentry等）

## よくある問題と解決策

### 画像アップロードエラー
- ファイルサイズ制限: 10MB
- 対応フォーマット: JPEG, PNG, WebP
- S3 CORS設定の確認

### AI API レート制限
- リトライ機能の実装
- キャッシュの活用
- エラー時のフォールバック

### パフォーマンス最適化
- 画像の事前最適化
- API レスポンスのキャッシュ
- 無限スクロールの実装

## 開発時の注意事項
1. **セキュリティ**: APIキーをクライアントサイドに露出させない
2. **アクセシビリティ**: WCAG 2.1 Level AA準拠
3. **レスポンシブ**: モバイルファーストで実装

## Git コミット規約

### コミット頻度
- **こまめにコミット**: 機能の小さな単位で頻繁にコミット
- **目安**: 1つの機能追加や修正ごと（最大でも1時間に1回）
- **WIP（Work In Progress）コミット**: 作業途中でも積極的にコミット

### コミットメッセージフォーマット
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type（必須）
- **feat**: 新機能追加
- **fix**: バグ修正
- **docs**: ドキュメントのみの変更
- **style**: コードの意味に影響しない変更（空白、フォーマット等）
- **refactor**: バグ修正や機能追加を伴わないコード変更
- **test**: テストの追加・修正
- **chore**: ビルドプロセスやツールの変更
- **perf**: パフォーマンス改善

### Scope（オプション）
- **auth**: 認証関連
- **upload**: 画像アップロード機能
- **ai**: AI連携機能
- **recipe**: レシピ関連
- **ui**: UIコンポーネント
- **api**: APIエンドポイント
- **db**: データベース関連

### 例
```
feat(upload): カメラ起動機能を追加

- MediaDevices APIを使用したカメラアクセス実装
- モバイルデバイスでの撮影に対応
- 撮影後の画像プレビュー機能を追加

feat(recipe): 調味料不足時の代替レシピ提案機能を実装

fix(auth): ログイン時のリダイレクトエラーを修正

test(upload): 画像バリデーションのユニットテストを追加

chore: ESLint設定を更新
```

### ブランチ戦略
```
main
├── develop
│   ├── feature/camera-upload
│   ├── feature/recipe-suggestion
│   ├── feature/seasoning-check
│   └── fix/auth-redirect
└── hotfix/critical-bug
```

### 作業フロー
1. **feature/fix ブランチを作成**
2. **こまめにコミット**（1機能1コミット）
3. **プッシュ前にテスト実行**
4. **PR作成時にはテストがパスしていることを確認**
5. **レビュー後にdevelopへマージ**

### コミット前チェックリスト
- [ ] コードがビルドできる（`npm run build`）
- [ ] リントエラーがない（`npm run lint`）
- [ ] 型エラーがない（`npm run typecheck`）
- [ ] 関連するテストが追加されている
- [ ] 既存のテストが全てパス（`npm run test`）

## エラーハンドリング規約

### エラーレスポンス形式
```typescript
interface ErrorResponse {
  error: {
    code: string        // エラーコード (例: "UPLOAD_FAILED")
    message: string     // ユーザー向けメッセージ
    details?: any       // 開発者向け詳細情報（本番環境では除外）
    timestamp: string   // ISO 8601形式
    requestId: string   // トレース用ID
  }
}
```

### エラーコード体系
- `AUTH_*`: 認証関連エラー
- `UPLOAD_*`: 画像アップロード関連
- `AI_*`: AI処理関連
- `DB_*`: データベース関連
- `VALIDATION_*`: バリデーションエラー

### ユーザーフレンドリーメッセージ
```typescript
const ERROR_MESSAGES = {
  UPLOAD_FILE_TOO_LARGE: "ファイルサイズが大きすぎます（10MB以下にしてください）",
  UPLOAD_INVALID_FORMAT: "対応していないファイル形式です（JPEG/PNG/WebPのみ）",
  AI_RECOGNITION_FAILED: "画像の解析に失敗しました。別の画像をお試しください",
  AI_RATE_LIMIT: "現在混雑しています。しばらくしてからお試しください",
}
```

## Jotai 状態管理パターン

### Atom設計原則
```typescript
// 1. 基本的なatom
export const userAtom = atom<User | null>(null)

// 2. 派生atom（読み取り専用）
export const isAuthenticatedAtom = atom((get) => get(userAtom) !== null)

// 3. 非同期atom
export const recipesAtom = atom(async (get) => {
  const ingredients = get(identifiedIngredientsAtom)
  return await fetchRecipes(ingredients)
})

// 4. atomWithStorage（永続化）
export const favoriteRecipesAtom = atomWithStorage<string[]>('favorites', [])
```

### Atom命名規則
- 単数形: 単一の値 (`userAtom`, `currentRecipeAtom`)
- 複数形: 配列・コレクション (`recipesAtom`, `ingredientsAtom`)
- is/has接頭辞: boolean値 (`isLoadingAtom`, `hasErrorAtom`)
- 派生atomは用途を明確に (`filteredRecipesAtom`)

## API レスポンス形式

### 成功レスポンス
```typescript
interface SuccessResponse<T> {
  data: T
  meta?: {
    page?: number
    totalPages?: number
    totalCount?: number
  }
}
```

### ページネーション
```typescript
interface PaginatedRequest {
  page?: number      // デフォルト: 1
  limit?: number     // デフォルト: 20, 最大: 100
  sort?: string      // 例: "createdAt:desc"
}
```

## 画像処理仕様

### 画像最適化設定
```typescript
const IMAGE_OPTIMIZATION = {
  upload: {
    maxSize: 10 * 1024 * 1024,  // 10MB
    formats: ['image/jpeg', 'image/png', 'image/webp'],
    quality: 0.85,
    maxDimensions: { width: 2048, height: 2048 }
  },
  thumbnail: {
    sizes: [200, 400, 800],
    quality: 0.8,
    format: 'webp'
  }
}
```

### S3アップロード設定
```typescript
// Presigned URLの有効期限
const PRESIGNED_URL_EXPIRES = 3600 // 1時間

// アップロードパス構造
const getS3Key = (userId: string, timestamp: number) => 
  `uploads/${userId}/${timestamp}-${nanoid()}.jpg`
```

## キャッシュ戦略

### クライアントサイドキャッシュ
```typescript
// React Query設定
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5分
      cacheTime: 10 * 60 * 1000,     // 10分
      refetchOnWindowFocus: false,
      retry: 3,
    },
  },
})

// キャッシュキー
const CACHE_KEYS = {
  recipes: (ingredients: string[]) => ['recipes', ...ingredients],
  userProfile: (userId: string) => ['user', userId],
  recipeDetail: (recipeId: string) => ['recipe', recipeId],
}
```

### APIレスポンスキャッシュ
```typescript
// Vercel Edge Config
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
  // キャッシュヘッダー
  headers: {
    'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
  },
}
```

## ログ記録方針

### ログレベル
- **ERROR**: エラー発生時（必ず記録）
- **WARN**: 警告（異常な状態だが継続可能）
- **INFO**: 重要なイベント（APIコール、認証等）
- **DEBUG**: 開発用詳細情報（本番では無効）

### ログ形式
```typescript
interface LogEntry {
  level: 'error' | 'warn' | 'info' | 'debug'
  message: string
  timestamp: string
  userId?: string
  requestId?: string
  metadata?: Record<string, any>
}
```

### 記録すべきイベント
- 画像アップロード（成功/失敗）
- AI API呼び出し（レスポンスタイム含む）
- レシピ生成結果
- エラー発生時の詳細
- パフォーマンス指標

## パフォーマンス最適化

### 画像の遅延読み込み
```tsx
import Image from 'next/image'

<Image
  src={recipe.image}
  alt={recipe.title}
  loading="lazy"
  placeholder="blur"
  blurDataURL={recipe.blurDataURL}
/>
```

### バンドルサイズ最適化
- 動的インポートの活用
- Tree shakingの確認
- 未使用の依存関係の削除

### データベースクエリ最適化
- N+1問題の回避（Prismaのinclude活用）
- インデックスの適切な設定
- 必要なフィールドのみ選択

## デバッグ支援

### 開発用環境変数
```env
# デバッグモード
DEBUG=true
# AIモック使用
USE_AI_MOCK=true
# ログ詳細度
LOG_LEVEL=debug
```

### デバッグツール
- React Developer Tools
- Redux DevTools (Jotai DevTools)
- Network タブでのAPI監視
- Performance タブでのボトルネック特定

### トラブルシューティング
1. **画像アップロード失敗**
   - ブラウザコンソールでエラー確認
   - ネットワークタブでレスポンス確認
   - S3の権限設定確認

2. **AI応答が遅い**
   - API レート制限の確認
   - リクエストサイズの確認
   - タイムアウト設定の調整

3. **状態管理の不具合**
   - Jotai DevToolsで状態確認
   - atom依存関係の確認
   - 無限ループの検出

## レシピデータ構造

### Recipe型定義
```typescript
interface Recipe {
  id: string
  title: string
  description: string
  imageUrl: string
  thumbnailUrl: string
  cookingTime: number        // 分単位
  difficulty: 'easy' | 'medium' | 'hard'
  servings: number
  calories: number
  ingredients: RecipeIngredient[]
  seasonings: RecipeSeasoning[]
  steps: RecipeStep[]
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

interface RecipeIngredient {
  id: string
  name: string
  amount: string
  unit: string
  isOptional: boolean
}

interface RecipeSeasoning {
  id: string
  name: string
  amount: string
  unit: string
  isEssential: boolean     // 代替不可な調味料
  alternatives?: string[]   // 代替可能な調味料
}

interface RecipeStep {
  order: number
  description: string
  duration?: number        // 分単位
  tips?: string
}
```

## 食材認識の精度向上

### 画像前処理
```typescript
// 画像の前処理設定
const preprocessImage = async (file: File): Promise<Blob> => {
  // 1. 画像のリサイズ（大きすぎる場合）
  // 2. 明度・コントラストの自動調整
  // 3. EXIF情報に基づく回転補正
  return processedBlob
}
```

### 認識結果の信頼度スコア活用
```typescript
interface IngredientDetection {
  name: string
  confidence: number      // 0-1の信頼度スコア
  boundingBox?: {        // 画像内の位置情報
    x: number
    y: number
    width: number
    height: number
  }
}

// 信頼度が低い場合の処理
const CONFIDENCE_THRESHOLD = 0.7
const filterReliableIngredients = (detections: IngredientDetection[]) => 
  detections.filter(d => d.confidence >= CONFIDENCE_THRESHOLD)
```

## レシピ提案アルゴリズム

### 優先順位付けロジック
```typescript
interface RecipeRanking {
  recipe: Recipe
  score: number
  factors: {
    ingredientMatch: number      // 食材の一致度 (0-1)
    missingIngredients: number   // 不足食材数
    seasoningAvailability: number // 調味料の利用可能度 (0-1)
    userPreference: number       // ユーザー嗜好スコア (0-1)
    popularityScore: number      // 人気度スコア (0-1)
  }
}

// スコア計算の重み付け
const SCORE_WEIGHTS = {
  ingredientMatch: 0.4,
  missingIngredients: -0.2,
  seasoningAvailability: 0.2,
  userPreference: 0.15,
  popularityScore: 0.05
}
```

### プロンプトエンジニアリング
```typescript
// OpenAI APIへのプロンプト例
const generateRecipePrompt = (ingredients: string[], constraints: any) => `
あなたは経験豊富な料理研究家です。以下の食材を使用して、家庭で作れる実用的なレシピを5つ提案してください。

利用可能な食材:
${ingredients.join(', ')}

制約条件:
- 調理時間: ${constraints.maxCookingTime}分以内
- 難易度: ${constraints.difficulty}
- 除外する調味料: ${constraints.excludedSeasonings?.join(', ') || 'なし'}

各レシピには以下の情報を含めてください:
1. 料理名
2. 調理時間
3. 必要な調味料（一般的な家庭にあるものを想定）
4. 簡単な作り方（3-5ステップ）
5. カロリー目安

JSON形式で回答してください。
`
```

## セキュリティベストプラクティス

### APIキー管理
```typescript
// サーバーサイドのみでAPIキーを使用
// app/api/analyze/route.ts
const rekognitionClient = new AWS.Rekognition({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  region: process.env.AWS_REGION!,
})

// クライアントサイドでは絶対に使用しない
// ❌ BAD: const apiKey = process.env.NEXT_PUBLIC_OPENAI_KEY
// ✅ GOOD: API Routeを経由してアクセス
```

### 入力検証
```typescript
// Zodスキーマでの厳密な検証
const uploadSchema = z.object({
  image: z.string().refine(
    (data) => data.startsWith('data:image/'),
    'Invalid image data'
  ),
  userId: z.string().uuid(),
})

const recipeRequestSchema = z.object({
  ingredients: z.array(z.string()).min(1).max(20),
  preferences: z.object({
    maxCookingTime: z.number().min(5).max(180),
    difficulty: z.enum(['easy', 'medium', 'hard']),
  }).optional(),
})
```

## モニタリング項目

### 重要メトリクス
- **画像アップロード成功率**: 95%以上を維持
- **AI API応答時間**: p95で10秒以内
- **レシピ生成成功率**: 90%以上
- **ユーザーセッション継続率**: 70%以上
- **エラー発生率**: 1%以下

### アラート設定
```typescript
// エラー率が閾値を超えた場合の通知
if (errorRate > 0.05) {
  await sendAlert({
    level: 'critical',
    message: 'Error rate exceeded 5%',
    metrics: { errorRate, timestamp: new Date() }
  })
}
```