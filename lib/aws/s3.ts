/**
 * AWS S3 画像アップロード機能
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { nanoid } from 'nanoid';
import { base64ToBlob } from '@/lib/utils/image';

// S3クライアントの初期化
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;
const PRESIGNED_URL_EXPIRES = 3600; // 1時間

/**
 * S3へ画像をアップロード（Base64）
 */
export async function uploadImageToS3(
  base64Data: string,
  filename: string,
  userId: string = 'anonymous'
): Promise<{ imageUrl: string; key: string }> {
  try {
    // Base64データをBlobに変換
    // Base64データからMIMEタイプを抽出
    const mimeMatch = base64Data.match(/^data:(.+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    
    const blob = base64ToBlob(base64Data, mimeType);
    const buffer = Buffer.from(await blob.arrayBuffer());

    return await uploadBufferToS3(buffer, filename, mimeType, userId);
  } catch (error) {
    console.error('Base64アップロードエラー:', error);
    throw new Error(`画像のアップロードに失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * S3へ画像をアップロード（Buffer）
 */
export async function uploadBufferToS3(
  buffer: Buffer,
  filename: string,
  mimeType: string = 'image/jpeg',
  userId: string = 'anonymous'
): Promise<{ imageUrl: string; s3Key: string }> {
  try {
    // S3のキー（パス）を生成
    const timestamp = Date.now();
    const s3Key = `uploads/${userId}/${timestamp}-${nanoid()}.jpg`;
    
    // S3にアップロード
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: buffer,
      ContentType: mimeType,
      Metadata: {
        originalFilename: filename,
        uploadedAt: new Date().toISOString(),
        userId,
      },
    });
    
    await s3Client.send(command);
    
    // CloudFront URLまたはS3 URLを生成
    const imageUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
    
    return { imageUrl, s3Key };
  } catch (error) {
    console.error('Bufferアップロードエラー:', error);
    throw new Error(`画像のアップロードに失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Presigned URLを生成（クライアントサイドアップロード用）
 */
export async function generatePresignedUrl(
  filename: string,
  contentType: string,
  userId: string = 'anonymous'
): Promise<{ uploadUrl: string; key: string }> {
  try {
    const timestamp = Date.now();
    const key = `uploads/${userId}/${timestamp}-${nanoid()}.jpg`;
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      Metadata: {
        originalFilename: filename,
        uploadedAt: new Date().toISOString(),
        userId,
      },
    });
    
    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: PRESIGNED_URL_EXPIRES,
    });
    
    return { uploadUrl, key };
  } catch (error) {
    console.error('Presigned URL生成エラー:', error);
    throw new Error('アップロードURLの生成に失敗しました');
  }
}

/**
 * S3のオブジェクトURLを取得
 */
export function getS3ObjectUrl(key: string): string {
  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}