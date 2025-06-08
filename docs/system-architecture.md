# システム構成図

## 画像認識APIの比較

### Amazon Rekognition（推奨）
**メリット：**
- AWS S3との完全な統合
- 日本語対応が充実
- 料金体系が明確（1,000画像あたり$1〜）
- 食品認識の精度が高い
- バッチ処理に対応

**デメリット：**
- AWSエコシステムへの依存

### Google Cloud Vision API
**メリット：**
- 高精度な物体検出
- 多言語対応
- REST APIが使いやすい

**デメリット：**
- S3との連携に追加実装が必要
- 料金がやや高め

## システム構成図

```mermaid
graph TB
    subgraph "Client Side"
        A[ユーザー<br/>スマートフォン/PC]
        B[Next.js Frontend<br/>- React<br/>- Jotai<br/>- Shadcn/ui]
    end

    subgraph "Vercel Edge"
        C[Next.js App<br/>App Router]
        D[API Routes]
    end

    subgraph "Authentication"
        E[NextAuth.js<br/>+ Supabase Auth]
    end

    subgraph "Database Layer"
        F[(Supabase<br/>PostgreSQL)]
        G[Prisma ORM]
    end

    subgraph "AWS Services"
        H[S3 Bucket<br/>画像ストレージ]
        I[CloudFront CDN]
        J[Amazon Rekognition<br/>画像認識]
    end

    subgraph "AI Services"
        K[OpenAI API<br/>GPT-4<br/>献立生成]
    end

    subgraph "External APIs"
        L[レシピDB API<br/>（オプション）]
    end

    A -->|カメラ撮影/アップロード| B
    B <-->|API Call| C
    C --> D
    D --> E
    E --> F
    D --> G
    G <--> F
    
    D -->|画像アップロード| H
    H --> I
    I -->|画像配信| A
    
    H --> J
    J -->|食材識別結果| D
    
    D -->|食材リスト| K
    K -->|献立提案| D
    
    D -.->|追加レシピ取得| L

    style A fill:#f9f,stroke:#333,stroke-width:2px
    style K fill:#9f9,stroke:#333,stroke-width:2px
    style J fill:#99f,stroke:#333,stroke-width:2px
```

## データフロー図

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant F as Frontend
    participant API as API Routes
    participant S3 as AWS S3
    participant R as Rekognition
    participant DB as Supabase
    participant AI as OpenAI

    U->>F: カメラで食材撮影
    F->>API: 画像アップロード
    API->>S3: 画像保存
    S3-->>API: 画像URL
    API->>R: 画像解析リクエスト
    R-->>API: 食材識別結果
    API->>DB: 解析結果保存
    API->>AI: 食材リスト送信
    AI-->>API: 献立提案
    API->>DB: 献立保存
    API-->>F: 献立リスト
    F-->>U: 献立表示

    alt 調味料が不足
        U->>F: 調味料不足を通知
        F->>API: 代替レシピリクエスト
        API->>AI: 制約付き献立生成
        AI-->>API: 代替レシピ
        API-->>F: 代替レシピ表示
        F-->>U: 代替レシピ提案
    end
```

## インフラ構成

```mermaid
graph LR
    subgraph "Frontend Hosting"
        A[Vercel<br/>- Next.js<br/>- Edge Functions<br/>- Image Optimization]
    end

    subgraph "Backend Services"
        B[(Supabase<br/>- PostgreSQL<br/>- Auth<br/>- Realtime)]
    end

    subgraph "AWS Infrastructure"
        C[S3<br/>画像ストレージ]
        D[CloudFront<br/>CDN]
        E[Rekognition<br/>画像AI]
        C --> D
        C --> E
    end

    subgraph "AI Services"
        F[OpenAI<br/>GPT-4 API]
    end

    A <--> B
    A <--> C
    A <--> E
    A <--> F
    D --> A

    style A fill:#0070f3,stroke:#fff,stroke-width:2px,color:#fff
    style B fill:#3ecf8e,stroke:#fff,stroke-width:2px,color:#fff
    style C fill:#ff9900,stroke:#fff,stroke-width:2px,color:#fff
    style F fill:#10a37f,stroke:#fff,stroke-width:2px,color:#fff
```

## セキュリティ構成

- **認証**: Supabase Auth + NextAuth.js
- **API保護**: JWT認証
- **画像アクセス**: S3 Presigned URLs
- **環境変数管理**: Vercel環境変数
- **CORS設定**: Vercelで制御