/**
 * 統一エラーハンドリングシステム
 */

export enum ErrorCode {
  // 一般的なエラー
  UNKNOWN = 'UNKNOWN',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  
  // API関連
  API_ERROR = 'API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  
  // OpenAI関連
  OPENAI_API_ERROR = 'OPENAI_API_ERROR',
  OPENAI_RATE_LIMIT = 'OPENAI_RATE_LIMIT',
  OPENAI_INVALID_KEY = 'OPENAI_INVALID_KEY',
  
  // AWS関連
  AWS_S3_ERROR = 'AWS_S3_ERROR',
  AWS_REKOGNITION_ERROR = 'AWS_REKOGNITION_ERROR',
  AWS_CREDENTIALS_ERROR = 'AWS_CREDENTIALS_ERROR',
  
  // Database関連
  DATABASE_ERROR = 'DATABASE_ERROR',
  DATABASE_CONNECTION_ERROR = 'DATABASE_CONNECTION_ERROR',
  
  // File/Image関連
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR',
  IMAGE_PROCESSING_ERROR = 'IMAGE_PROCESSING_ERROR',
}

export interface AppErrorContext {
  userId?: string;
  requestId?: string;
  endpoint?: string;
  userAgent?: string;
  ip?: string;
  additionalData?: Record<string, unknown>;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: AppErrorContext;
  public readonly timestamp: Date;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: AppErrorContext
  ) {
    super(message);
    
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;
    this.timestamp = new Date();
    
    // Error.captureStackTrace が利用可能な場合のみ使用
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
    
    this.name = 'AppError';
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack }),
    };
  }
}

/**
 * エラーファクトリー関数
 */
export const createError = {
  validation: (message: string, context?: AppErrorContext) =>
    new AppError(ErrorCode.VALIDATION_ERROR, message, 400, true, context),
    
  notFound: (resource: string, context?: AppErrorContext) =>
    new AppError(ErrorCode.NOT_FOUND, `${resource} not found`, 404, true, context),
    
  unauthorized: (message: string = 'Unauthorized', context?: AppErrorContext) =>
    new AppError(ErrorCode.UNAUTHORIZED, message, 401, true, context),
    
  forbidden: (message: string = 'Forbidden', context?: AppErrorContext) =>
    new AppError(ErrorCode.FORBIDDEN, message, 403, true, context),
    
  apiError: (message: string, context?: AppErrorContext) =>
    new AppError(ErrorCode.API_ERROR, message, 500, true, context),
    
  openaiError: (message: string, context?: AppErrorContext) =>
    new AppError(ErrorCode.OPENAI_API_ERROR, `OpenAI API Error: ${message}`, 500, true, context),
    
  awsError: (service: string, message: string, context?: AppErrorContext) =>
    new AppError(
      service === 's3' ? ErrorCode.AWS_S3_ERROR : ErrorCode.AWS_REKOGNITION_ERROR,
      `AWS ${service} Error: ${message}`,
      500,
      true,
      context
    ),
    
  databaseError: (message: string, context?: AppErrorContext) =>
    new AppError(ErrorCode.DATABASE_ERROR, `Database Error: ${message}`, 500, true, context),
    
  fileError: (type: 'size' | 'type' | 'upload', message: string, context?: AppErrorContext) => {
    const errorCode = type === 'size' ? ErrorCode.FILE_TOO_LARGE :
                     type === 'type' ? ErrorCode.INVALID_FILE_TYPE :
                     ErrorCode.FILE_UPLOAD_ERROR;
    const statusCode = type === 'size' || type === 'type' ? 400 : 500;
    
    return new AppError(errorCode, message, statusCode, true, context);
  },
};

/**
 * エラーロガー
 */
export class ErrorLogger {
  static log(error: Error | AppError, level: 'error' | 'warn' | 'info' = 'error') {
    const logData = {
      timestamp: new Date().toISOString(),
      level,
      message: error.message,
      ...(error instanceof AppError && {
        code: error.code,
        statusCode: error.statusCode,
        context: error.context,
      }),
      stack: error.stack,
    };

    // Development環境では詳細ログ
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 Error Details:', JSON.stringify(logData, null, 2));
    } else {
      // Production環境では構造化ログ
      console.error(JSON.stringify(logData));
    }

    // TODO: 外部ログサービス（Sentry、Datadog等）への送信
    // await sendToExternalLoggingService(logData);
  }

  static logApiError(error: Error | AppError, request: { method?: string; url?: string; userId?: string }) {
    const context: AppErrorContext = {
      endpoint: `${request.method} ${request.url}`,
      userId: request.userId,
      requestId: generateRequestId(),
    };

    if (error instanceof AppError) {
      const updatedError = new AppError(
        error.code,
        error.message,
        error.statusCode,
        error.isOperational,
        { ...error.context, ...context }
      );
      this.log(updatedError);
    } else {
      const appError = new AppError(
        ErrorCode.API_ERROR,
        error.message,
        500,
        true,
        context
      );
      this.log(appError);
    }
  }
}

/**
 * API用エラーレスポンス生成
 */
export function createErrorResponse(error: Error | AppError) {
  if (error instanceof AppError) {
    return {
      error: {
        code: error.code,
        message: error.message,
        timestamp: error.timestamp.toISOString(),
        ...(process.env.NODE_ENV === 'development' && {
          stack: error.stack,
          context: error.context,
        }),
      },
    };
  }

  // 予期しないエラーの場合
  return {
    error: {
      code: ErrorCode.UNKNOWN,
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal Server Error' 
        : error.message,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
      }),
    },
  };
}

/**
 * ユーティリティ関数
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * エラー型ガード
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function isOperationalError(error: unknown): boolean {
  return isAppError(error) ? error.isOperational : false;
}