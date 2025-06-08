// 画像関連の定数
export const IMAGE_OPTIMIZATION = {
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
} as const

// API エラーコード
export const ERROR_CODES = {
  // 認証関連
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_INVALID: 'AUTH_INVALID',
  
  // アップロード関連
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  UPLOAD_FILE_TOO_LARGE: 'UPLOAD_FILE_TOO_LARGE',
  UPLOAD_INVALID_FORMAT: 'UPLOAD_INVALID_FORMAT',
  
  // AI関連
  AI_RECOGNITION_FAILED: 'AI_RECOGNITION_FAILED',
  AI_RATE_LIMIT: 'AI_RATE_LIMIT',
  AI_SERVICE_UNAVAILABLE: 'AI_SERVICE_UNAVAILABLE',
  
  // データベース関連
  DB_CONNECTION_FAILED: 'DB_CONNECTION_FAILED',
  DB_QUERY_FAILED: 'DB_QUERY_FAILED',
  
  // バリデーション関連
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  VALIDATION_REQUIRED_FIELD: 'VALIDATION_REQUIRED_FIELD',
  
  // 一般的なエラー
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED'
} as const

// エラーメッセージ
export const ERROR_MESSAGES = {
  [ERROR_CODES.UPLOAD_FILE_TOO_LARGE]: "ファイルサイズが大きすぎます（10MB以下にしてください）",
  [ERROR_CODES.UPLOAD_INVALID_FORMAT]: "対応していないファイル形式です（JPEG/PNG/WebPのみ）",
  [ERROR_CODES.AI_RECOGNITION_FAILED]: "画像の解析に失敗しました。別の画像をお試しください",
  [ERROR_CODES.AI_RATE_LIMIT]: "現在混雑しています。しばらくしてからお試しください",
  [ERROR_CODES.AI_SERVICE_UNAVAILABLE]: "AI サービスが一時的に利用できません",
  [ERROR_CODES.AUTH_REQUIRED]: "ログインが必要です",
  [ERROR_CODES.VALIDATION_FAILED]: "入力内容に誤りがあります",
  [ERROR_CODES.INTERNAL_SERVER_ERROR]: "サーバーエラーが発生しました",
  [ERROR_CODES.NOT_FOUND]: "リソースが見つかりません"
} as const

// API 設定
export const API_CONFIG = {
  maxRequestSize: '10mb',
  timeout: 30000, // 30秒
  retryAttempts: 3,
  retryDelay: 1000 // 1秒
} as const

// 開発環境での設定
export const DEV_CONFIG = {
  useAiMock: process.env.USE_AI_MOCK === 'true',
  debugMode: process.env.DEBUG === 'true',
  logLevel: process.env.LOG_LEVEL || 'info'
} as const