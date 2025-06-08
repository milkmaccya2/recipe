/**
 * Amazon Rekognition 画像解析機能
 */

import { RekognitionClient, DetectLabelsCommand } from '@aws-sdk/client-rekognition';

// Rekognitionクライアントの初期化
const rekognitionClient = new RekognitionClient({
  region: process.env.REKOGNITION_REGION || process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// 信頼度の閾値
const CONFIDENCE_THRESHOLD = 70; // 70%以上の信頼度

// 食材として認識するラベルのマッピング
const FOOD_LABEL_MAPPING: Record<string, string> = {
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
  'Mushroom': 'きのこ',
  'Chicken': '鶏肉',
  'Beef': '牛肉',
  'Pork': '豚肉',
  'Fish': '魚',
  'Egg': '卵',
  'Milk': '牛乳',
  'Cheese': 'チーズ',
  'Rice': '米',
  'Bread': 'パン',
  'Pasta': 'パスタ',
  'Tofu': '豆腐',
  'Food': '食材', // 汎用的な食材
  'Vegetable': '野菜',
  'Meat': '肉',
  'Fruit': 'フルーツ',
};

export interface DetectedIngredient {
  name: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface AnalysisResult {
  ingredients: DetectedIngredient[];
  confidence: number; // 全体の信頼度
  processingTime: number;
  rawLabels?: any[]; // デバッグ用の生データ
}

/**
 * S3の画像URLから食材を解析
 */
export async function analyzeImageWithRekognition(
  s3Key: string,
  includeRawData: boolean = false
): Promise<AnalysisResult> {
  const startTime = Date.now();
  
  try {
    // Rekognition APIを呼び出し
    const command = new DetectLabelsCommand({
      Image: {
        S3Object: {
          Bucket: process.env.AWS_S3_BUCKET_NAME!,
          Name: s3Key,
        },
      },
      MaxLabels: 50,
      MinConfidence: CONFIDENCE_THRESHOLD,
    });
    
    const response = await rekognitionClient.send(command);
    const labels = response.Labels || [];
    
    // 食材として認識されたラベルを抽出
    const ingredients: DetectedIngredient[] = [];
    const processedNames = new Set<string>(); // 重複を避ける
    
    for (const label of labels) {
      if (!label.Name || !label.Confidence) continue;
      
      // 食材マッピングに存在するか確認
      const japaneseName = FOOD_LABEL_MAPPING[label.Name];
      if (japaneseName && !processedNames.has(japaneseName)) {
        processedNames.add(japaneseName);
        
        const ingredient: DetectedIngredient = {
          name: japaneseName,
          confidence: label.Confidence / 100, // 0-1の範囲に正規化
        };
        
        // バウンディングボックス情報があれば追加
        if (label.Instances && label.Instances.length > 0) {
          const instance = label.Instances[0];
          if (instance.BoundingBox) {
            ingredient.boundingBox = {
              x: (instance.BoundingBox.Left || 0) * 100,
              y: (instance.BoundingBox.Top || 0) * 100,
              width: (instance.BoundingBox.Width || 0) * 100,
              height: (instance.BoundingBox.Height || 0) * 100,
            };
          }
        }
        
        ingredients.push(ingredient);
      }
      
      // 親カテゴリーも確認（例：特定の野菜が検出されない場合の "Vegetable"）
      if (label.Parents) {
        for (const parent of label.Parents) {
          const parentName = FOOD_LABEL_MAPPING[parent.Name || ''];
          if (parentName && !processedNames.has(parentName)) {
            processedNames.add(parentName);
            ingredients.push({
              name: parentName,
              confidence: (label.Confidence / 100) * 0.8, // 親カテゴリーは少し信頼度を下げる
            });
          }
        }
      }
    }
    
    // 信頼度で降順ソート
    ingredients.sort((a, b) => b.confidence - a.confidence);
    
    // 全体の信頼度を計算（上位3つの平均）
    const topConfidences = ingredients.slice(0, 3).map(i => i.confidence);
    const overallConfidence = topConfidences.length > 0
      ? topConfidences.reduce((sum, conf) => sum + conf, 0) / topConfidences.length
      : 0;
    
    const processingTime = (Date.now() - startTime) / 1000; // 秒単位
    
    return {
      ingredients,
      confidence: overallConfidence,
      processingTime,
      ...(includeRawData && { rawLabels: labels }),
    };
  } catch (error) {
    console.error('Rekognition解析エラー:', error);
    throw new Error(`画像の解析に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Base64画像データから直接解析（開発用）
 */
export async function analyzeImageFromBase64(
  base64Data: string,
  includeRawData: boolean = false
): Promise<AnalysisResult> {
  const startTime = Date.now();
  
  try {
    // Base64データから "data:image/xxx;base64," プレフィックスを削除
    const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const imageBytes = Buffer.from(base64Image, 'base64');
    
    const command = new DetectLabelsCommand({
      Image: {
        Bytes: imageBytes,
      },
      MaxLabels: 50,
      MinConfidence: CONFIDENCE_THRESHOLD,
    });
    
    const response = await rekognitionClient.send(command);
    const labels = response.Labels || [];
    
    // 以下、analyzeImageWithRekognitionと同じ処理
    const ingredients: DetectedIngredient[] = [];
    const processedNames = new Set<string>();
    
    for (const label of labels) {
      if (!label.Name || !label.Confidence) continue;
      
      const japaneseName = FOOD_LABEL_MAPPING[label.Name];
      if (japaneseName && !processedNames.has(japaneseName)) {
        processedNames.add(japaneseName);
        
        const ingredient: DetectedIngredient = {
          name: japaneseName,
          confidence: label.Confidence / 100,
        };
        
        if (label.Instances && label.Instances.length > 0) {
          const instance = label.Instances[0];
          if (instance.BoundingBox) {
            ingredient.boundingBox = {
              x: (instance.BoundingBox.Left || 0) * 100,
              y: (instance.BoundingBox.Top || 0) * 100,
              width: (instance.BoundingBox.Width || 0) * 100,
              height: (instance.BoundingBox.Height || 0) * 100,
            };
          }
        }
        
        ingredients.push(ingredient);
      }
    }
    
    ingredients.sort((a, b) => b.confidence - a.confidence);
    
    const topConfidences = ingredients.slice(0, 3).map(i => i.confidence);
    const overallConfidence = topConfidences.length > 0
      ? topConfidences.reduce((sum, conf) => sum + conf, 0) / topConfidences.length
      : 0;
    
    const processingTime = (Date.now() - startTime) / 1000;
    
    return {
      ingredients,
      confidence: overallConfidence,
      processingTime,
      ...(includeRawData && { rawLabels: labels }),
    };
  } catch (error) {
    console.error('Rekognition Base64解析エラー:', error);
    throw new Error(`画像の解析に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}