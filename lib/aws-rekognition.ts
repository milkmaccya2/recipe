/**
 * Amazon Rekognition 画像認識機能
 * 食材の自動識別
 */

import AWS from 'aws-sdk';

// AWS Rekognition設定
const rekognition = new AWS.Rekognition({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// S3設定
const s3 = new AWS.S3({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'recipe-suggester-images';

export interface DetectedIngredient {
  name: string;
  confidence: number;
  category: 'vegetable' | 'fruit' | 'meat' | 'seafood' | 'dairy' | 'grain' | 'other';
  japaneseName?: string;
  boundingBox?: {
    width: number;
    height: number;
    left: number;
    top: number;
  };
}

export interface ImageAnalysisResult {
  ingredients: DetectedIngredient[];
  imageUrl: string;
  s3Key: string;
  analyzedAt: Date;
  confidence: number;
}

/**
 * 画像をS3にアップロード
 */
export async function uploadImageToS3(
  imageBuffer: Buffer,
  filename: string
): Promise<{ s3Key: string; imageUrl: string }> {
  const timestamp = Date.now();
  const s3Key = `images/${timestamp}_${filename}`;

  const params = {
    Bucket: S3_BUCKET_NAME,
    Key: s3Key,
    Body: imageBuffer,
    ContentType: 'image/jpeg',
  };

  try {
    await s3.upload(params).promise();
    const imageUrl = `https://${S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
    
    return { s3Key, imageUrl };
  } catch (error) {
    console.error('S3アップロードエラー:', error);
    throw new Error('画像のアップロードに失敗しました');
  }
}

/**
 * 画像から食材を識別
 */
export async function detectIngredients(imageBuffer: Buffer): Promise<DetectedIngredient[]> {
  try {
    // Rekognition APIパラメータ
    const params = {
      Image: {
        Bytes: imageBuffer,
      },
      MaxLabels: 20,
      MinConfidence: 70,
    };

    // ラベル検出実行
    const response = await rekognition.detectLabels(params).promise();
    
    if (!response.Labels) {
      return [];
    }

    // 食材関連のラベルをフィルタリング・変換
    const ingredients = response.Labels
      .filter(label => isIngredientLabel(label.Name || ''))
      .map(label => ({
        name: label.Name || '',
        confidence: label.Confidence || 0,
        category: categorizeIngredient(label.Name || ''),
        japaneseName: translateToJapanese(label.Name || ''),
        boundingBox: label.Instances?.[0]?.BoundingBox ? {
          width: label.Instances[0].BoundingBox.Width || 0,
          height: label.Instances[0].BoundingBox.Height || 0,
          left: label.Instances[0].BoundingBox.Left || 0,
          top: label.Instances[0].BoundingBox.Top || 0,
        } : undefined,
      }));

    return ingredients;
  } catch (error) {
    console.error('Rekognition分析エラー:', error);
    throw new Error('画像分析に失敗しました');
  }
}

/**
 * 画像を分析して結果を返す（統合関数）
 */
export async function analyzeImage(
  imageBuffer: Buffer,
  filename: string
): Promise<ImageAnalysisResult> {
  try {
    // S3にアップロード
    const { s3Key, imageUrl } = await uploadImageToS3(imageBuffer, filename);
    
    // 食材を検出
    const ingredients = await detectIngredients(imageBuffer);
    
    // 全体の信頼度を計算
    const averageConfidence = ingredients.length > 0
      ? ingredients.reduce((sum, ing) => sum + ing.confidence, 0) / ingredients.length
      : 0;

    return {
      ingredients,
      imageUrl,
      s3Key,
      analyzedAt: new Date(),
      confidence: averageConfidence,
    };
  } catch (error) {
    console.error('画像分析エラー:', error);
    throw error;
  }
}

/**
 * 食材関連のラベルかどうかを判定
 */
function isIngredientLabel(label: string): boolean {
  const foodKeywords = [
    'vegetable', 'fruit', 'meat', 'fish', 'seafood', 'poultry',
    'beef', 'pork', 'chicken', 'lamb', 'shrimp', 'salmon',
    'carrot', 'potato', 'onion', 'tomato', 'lettuce', 'cabbage',
    'apple', 'banana', 'orange', 'grape', 'strawberry',
    'rice', 'bread', 'pasta', 'noodle', 'cheese', 'milk',
    'egg', 'butter', 'oil', 'sauce', 'spice', 'herb',
    'food', 'ingredient', 'produce', 'grocery'
  ];
  
  const lowerLabel = label.toLowerCase();
  return foodKeywords.some(keyword => lowerLabel.includes(keyword));
}

/**
 * 食材をカテゴリ分類
 */
function categorizeIngredient(label: string): DetectedIngredient['category'] {
  const lowerLabel = label.toLowerCase();
  
  const categories = {
    vegetable: ['vegetable', 'carrot', 'potato', 'onion', 'tomato', 'lettuce', 'cabbage', 'broccoli', 'spinach'],
    fruit: ['fruit', 'apple', 'banana', 'orange', 'grape', 'strawberry', 'melon', 'peach'],
    meat: ['meat', 'beef', 'pork', 'chicken', 'lamb', 'poultry'],
    seafood: ['fish', 'seafood', 'shrimp', 'salmon', 'tuna', 'crab', 'lobster'],
    dairy: ['cheese', 'milk', 'butter', 'yogurt', 'cream'],
    grain: ['rice', 'bread', 'pasta', 'noodle', 'wheat', 'flour'],
  };
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowerLabel.includes(keyword))) {
      return category as DetectedIngredient['category'];
    }
  }
  
  return 'other';
}

/**
 * 英語の食材名を日本語に翻訳（簡易版）
 */
function translateToJapanese(englishName: string): string {
  const translations: { [key: string]: string } = {
    // 野菜
    'carrot': 'にんじん',
    'potato': 'じゃがいも',
    'onion': '玉ねぎ',
    'tomato': 'トマト',
    'lettuce': 'レタス',
    'cabbage': 'キャベツ',
    'broccoli': 'ブロッコリー',
    'spinach': 'ほうれん草',
    'cucumber': 'きゅうり',
    'eggplant': 'なす',
    
    // 果物
    'apple': 'りんご',
    'banana': 'バナナ',
    'orange': 'オレンジ',
    'grape': 'ぶどう',
    'strawberry': 'いちご',
    'watermelon': 'スイカ',
    'peach': '桃',
    
    // 肉類
    'beef': '牛肉',
    'pork': '豚肉',
    'chicken': '鶏肉',
    'lamb': 'ラム肉',
    
    // 魚介類
    'fish': '魚',
    'salmon': 'サーモン',
    'tuna': 'まぐろ',
    'shrimp': 'えび',
    'crab': 'かに',
    
    // 乳製品
    'milk': '牛乳',
    'cheese': 'チーズ',
    'butter': 'バター',
    'yogurt': 'ヨーグルト',
    
    // 穀物
    'rice': '米',
    'bread': 'パン',
    'pasta': 'パスタ',
    'noodle': '麺',
    
    // その他
    'egg': '卵',
    'tofu': '豆腐',
    'soy sauce': '醤油',
  };
  
  const lowerName = englishName.toLowerCase();
  return translations[lowerName] || englishName;
}

/**
 * バッチ画像分析（複数画像の一括処理）
 */
export async function analyzeMultipleImages(
  images: Array<{ buffer: Buffer; filename: string }>
): Promise<ImageAnalysisResult[]> {
  const results = await Promise.all(
    images.map(image => analyzeImage(image.buffer, image.filename))
  );
  
  return results;
}

/**
 * 分析履歴の取得（S3から）
 */
export async function getAnalysisHistory(limit: number = 10): Promise<string[]> {
  try {
    const params = {
      Bucket: S3_BUCKET_NAME,
      Prefix: 'images/',
      MaxKeys: limit,
    };
    
    const response = await s3.listObjectsV2(params).promise();
    const keys = response.Contents?.map(item => item.Key || '') || [];
    
    return keys;
  } catch (error) {
    console.error('履歴取得エラー:', error);
    return [];
  }
}