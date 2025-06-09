/**
 * Amazon Rekognition 画像解析機能
 * 新しいAWS SDK v3を使用した統合実装
 */

import { RekognitionClient, DetectLabelsCommand } from '@aws-sdk/client-rekognition';

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

// Rekognitionクライアントの初期化
const rekognitionClient = new RekognitionClient({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// 信頼度の閾値
const CONFIDENCE_THRESHOLD = 50; // 70から50に下げて、より多くのラベルを検出

// 食材として認識するラベルのマッピング
const FOOD_LABEL_MAPPING: Record<string, string> = {
  // 野菜
  'Tomato': 'トマト',
  'Onion': '玉ねぎ', 
  'Carrot': 'にんじん',
  'Potato': 'じゃがいも',
  'Cucumber': 'きゅうり',
  'Lettuce': 'レタス',
  'Cabbage': 'キャベツ',
  'Spinach': 'ほうれん草',
  'Broccoli': 'ブロッコリー',
  'Pepper': 'ピーマン',
  'Eggplant': 'なす',
  'Zucchini': 'ズッキーニ',
  
  // 果物
  'Apple': 'りんご',
  'Banana': 'バナナ',
  'Orange': 'オレンジ',
  'Grape': 'ぶどう',
  'Strawberry': 'いちご',
  'Watermelon': 'スイカ',
  'Peach': '桃',
  'Lemon': 'レモン',
  
  // 肉類
  'Beef': '牛肉',
  'Pork': '豚肉',
  'Chicken': '鶏肉',
  'Lamb': 'ラム肉',
  'Turkey': '七面鳥',
  
  // 魚介類
  'Fish': '魚',
  'Salmon': 'サーモン',
  'Tuna': 'まぐろ',
  'Shrimp': 'えび',
  'Crab': 'かに',
  'Lobster': 'ロブスター',
  
  // 乳製品
  'Milk': '牛乳',
  'Cheese': 'チーズ',
  'Butter': 'バター',
  'Yogurt': 'ヨーグルト',
  'Cream': 'クリーム',
  
  // 穀物
  'Rice': '米',
  'Bread': 'パン',
  'Pasta': 'パスタ',
  'Noodle': '麺',
  'Wheat': '小麦',
  
  // その他
  'Egg': '卵',
  'Tofu': '豆腐',
  'Mushroom': 'きのこ',
  'Herb': 'ハーブ',
  'Spice': 'スパイス',
  
  // 日本食材（一般的なラベルから推測）
  'Soybean': '大豆製品（納豆・豆腐など）',
  'Beans': '豆類（納豆の可能性）',
  'Fermented Food': '発酵食品（納豆・味噌など）',
  'Seaweed': '海苔・わかめ',
  'Soy Sauce': '醤油',
  'Miso': '味噌',
  'Sake': '日本酒',
  'Tea': 'お茶',
  
  // 容器・パッケージ（中身を推測）
  'Bottle': 'ボトル（飲料・調味料）',
  'Jar': '瓶詰め',
  'Container': '容器入り食品',
  'Box': '箱入り食品',
  'Can': '缶詰',
  'Package': 'パッケージ食品',
  'Plastic Wrap': 'ラップで包まれた食材',
  'Plastic Bag': '袋入り食品',
  'Bowl': 'ボウルに入った食材',
};

/**
 * 画像から食材を検出
 */
export async function detectIngredients(imageBuffer: Buffer): Promise<DetectedIngredient[]> {
  try {
    const command = new DetectLabelsCommand({
      Image: {
        Bytes: imageBuffer,
      },
      MaxLabels: 20,
      MinConfidence: CONFIDENCE_THRESHOLD,
    });

    const response = await rekognitionClient.send(command);
    
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
        japaneseName: FOOD_LABEL_MAPPING[label.Name || ''] || translateToJapanese(label.Name || ''),
        boundingBox: label.Instances?.[0]?.BoundingBox ? {
          width: label.Instances[0].BoundingBox.Width || 0,
          height: label.Instances[0].BoundingBox.Height || 0,
          left: label.Instances[0].BoundingBox.Left || 0,
          top: label.Instances[0].BoundingBox.Top || 0,
        } : undefined,
      }));

    return ingredients;
  } catch (error) {
    throw new Error('画像分析に失敗しました');
  }
}

/**
 * バッチ画像分析（複数画像の一括処理）
 */
export async function analyzeMultipleImages(
  images: Array<{ buffer: Buffer; filename: string }>
): Promise<Array<{ filename: string; ingredients: DetectedIngredient[]; error?: string }>> {
  const results = await Promise.allSettled(
    images.map(async (image) => ({
      filename: image.filename,
      ingredients: await detectIngredients(image.buffer),
    }))
  );
  
  return results.map((result, index) => 
    result.status === 'fulfilled' 
      ? result.value
      : { 
          filename: images[index].filename, 
          ingredients: [], 
          error: result.reason?.message || 'Unknown error' 
        }
  );
}

/**
 * 食材関連のラベルかどうかを判定
 */
function isIngredientLabel(label: string): boolean {
  // 除外する一般的なラベル（冷蔵庫関連も追加）
  const excludeLabels = [
    'food', 'vegetable', 'fruit', 'produce', 'ingredient', 
    'grocery', 'meal', 'dish', 'cuisine', 'cooking',
    'fresh', 'organic', 'healthy', 'nutrition',
    'shelf', 'device', 'appliance', 'refrigerator', 'cabinet',
    'furniture', 'closet', 'cupboard', 'pantry', 'shop',
    'electrical device', 'medicine chest'
  ];
  
  const lowerLabel = label.toLowerCase();
  
  // 除外ラベルに完全一致する場合はfalse
  if (excludeLabels.includes(lowerLabel)) {
    return false;
  }
  
  // 具体的な食材名のマッピングがある場合はtrue
  if (FOOD_LABEL_MAPPING.hasOwnProperty(label)) {
    return true;
  }
  
  // 具体的な食材キーワードのリスト
  const specificFoodKeywords = [
    // 野菜
    'tomato', 'onion', 'carrot', 'potato', 'cucumber', 'lettuce', 
    'cabbage', 'spinach', 'broccoli', 'pepper', 'eggplant', 'zucchini',
    'corn', 'peas', 'beans', 'mushroom', 'garlic', 'celery',
    'radish', 'leek', 'asparagus', 'cauliflower',
    // 果物
    'apple', 'banana', 'orange', 'grape', 'strawberry', 'watermelon',
    'peach', 'lemon', 'cherry', 'mango', 'pineapple', 'kiwi',
    'melon', 'berry', 'citrus', 'pear',
    // 肉類
    'beef', 'pork', 'chicken', 'lamb', 'turkey', 'duck',
    'meat', 'ham', 'bacon', 'sausage',
    // 魚介類
    'fish', 'salmon', 'tuna', 'shrimp', 'crab', 'lobster', 'squid',
    'seafood', 'shellfish',
    // 乳製品・その他
    'egg', 'cheese', 'milk', 'butter', 'yogurt', 'tofu', 'rice', 
    'bread', 'pasta', 'noodle', 'juice', 'bottle', 'jar',
    'container', 'box', 'can', 'package',
    // 日本食材関連
    'soybean', 'soy', 'bean', 'fermented', 'seaweed', 'nori',
    'miso', 'sake', 'tea', 'sauce'
  ];
  
  return specificFoodKeywords.some(keyword => lowerLabel.includes(keyword));
}

/**
 * 食材をカテゴリ分類
 */
function categorizeIngredient(label: string): DetectedIngredient['category'] {
  const lowerLabel = label.toLowerCase();
  
  const categories = {
    vegetable: ['vegetable', 'carrot', 'potato', 'onion', 'tomato', 'lettuce', 'cabbage', 'broccoli', 'spinach', 'pepper', 'eggplant'],
    fruit: ['fruit', 'apple', 'banana', 'orange', 'grape', 'strawberry', 'melon', 'peach', 'watermelon', 'lemon'],
    meat: ['meat', 'beef', 'pork', 'chicken', 'lamb', 'poultry', 'turkey'],
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
 * 英語の食材名を日本語に翻訳（フォールバック）
 */
function translateToJapanese(englishName: string): string {
  return FOOD_LABEL_MAPPING[englishName] || englishName;
}