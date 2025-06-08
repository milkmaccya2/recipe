/**
 * 画像分析API
 * POST /api/analyze-image
 * 画像をアップロードして食材を識別
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeImage, analyzeMultipleImages } from '@/lib/aws-rekognition';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('images') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: '画像をアップロードしてください' },
        { status: 400 }
      );
    }

    // 単一画像か複数画像かで処理を分岐
    if (files.length === 1) {
      // 単一画像処理
      const file = files[0];
      const buffer = Buffer.from(await file.arrayBuffer());
      
      const result = await analyzeImage(buffer, file.name);
      
      return NextResponse.json({
        success: true,
        result,
      });
    } else {
      // 複数画像処理
      const images = await Promise.all(
        files.map(async (file) => ({
          buffer: Buffer.from(await file.arrayBuffer()),
          filename: file.name,
        }))
      );
      
      const results = await analyzeMultipleImages(images);
      
      // 全画像の食材を統合
      const allIngredients = results.flatMap(r => r.ingredients);
      
      // 重複を除去（名前が同じものは信頼度が高い方を採用）
      const uniqueIngredients = allIngredients.reduce((acc, curr) => {
        const existing = acc.find(i => i.name === curr.name);
        if (!existing || existing.confidence < curr.confidence) {
          return [...acc.filter(i => i.name !== curr.name), curr];
        }
        return acc;
      }, [] as typeof allIngredients);
      
      return NextResponse.json({
        success: true,
        results,
        combinedIngredients: uniqueIngredients,
      });
    }
  } catch (error) {
    console.error('画像分析API エラー:', error);
    
    if (error instanceof Error && error.message.includes('AWS')) {
      return NextResponse.json(
        { error: 'AWS認証エラー: AWSの設定を確認してください' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: '画像分析に失敗しました' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: '画像分析API',
      usage: 'POST /api/analyze-image with multipart/form-data',
      fields: {
        images: 'File[] - 分析する画像ファイル（複数可）'
      }
    },
    { status: 200 }
  );
}