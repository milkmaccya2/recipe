// .env.localからSupabaseのDATABASE_URLを構築
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const projectId = 'xqubxaoabzaklyvksqzr';
const password = 'Agitonit21';

console.log('🔍 Supabase DATABASE_URL構築中...');
console.log('Project URL:', supabaseUrl);

if (supabaseUrl) {
  // Connection pooling URL (推奨)
  const poolingUrl = `postgresql://postgres.${projectId}:${password}@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`;
  
  // Direct connection URL
  const directUrl = `postgresql://postgres.${projectId}:${password}@db.${projectId}.supabase.co:5432/postgres`;
  
  console.log('\n📋 データベース接続URL:');
  console.log('Connection Pooling (推奨):', poolingUrl);
  console.log('Direct Connection:', directUrl);
  
  // .envファイルに書き込み
  const fs = require('fs');
  const envContent = `# Supabase Database URL for Prisma\nDATABASE_URL="${poolingUrl}"\n\n# Direct connection (if needed)\n# DIRECT_URL="${directUrl}"`;
  
  fs.writeFileSync('.env', envContent);
  console.log('\n✅ .envファイルを更新しました');
} else {
  console.log('❌ NEXT_PUBLIC_SUPABASE_URLが見つかりません');
}