// Supabase接続テスト - 段階的チェック
const { createClient } = require('@supabase/supabase-js');

// 推測される設定で段階的テスト
const configs = [
  {
    name: "標準設定",
    url: "https://xqubxaoabzaklyvksqzr.supabase.co",
    // anonキーは通常eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9で始まる
  },
  {
    name: "プロジェクト直接",
    url: "https://app.supabase.com/project/xqubxaoabzaklyvksqzr",
  }
];

async function testConfigs() {
  console.log('🔍 Supabaseプロジェクト設定の推測テスト...');
  console.log('プロジェクトID: xqubxaoabzaklyvksqzr');
  console.log('');
  
  // .env.localを読み込み試行
  try {
    require('dotenv').config({ path: '.env.local' });
    console.log('✅ .env.local読み込み成功');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || '未設定');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '設定済み' : '未設定');
  } catch (error) {
    console.log('⚠️ .env.local読み込みエラー:', error.message);
  }
}

testConfigs();