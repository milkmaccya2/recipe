const { createClient } = require('@supabase/supabase-js');

// テスト用の接続確認スクリプト
async function testSupabaseConnection() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('🔍 Supabase接続テスト開始...');
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseKey ? '設定済み' : '未設定');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase URL または Key が設定されていません');
    return;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // 簡単なクエリでテスト
    const { data, error } = await supabase
      .from('_prisma_migrations')  // システムテーブル
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('⚠️ システムテーブルアクセスエラー（正常な場合があります）:', error.message);
    } else {
      console.log('✅ Supabase接続成功！');
    }
    
    // プロジェクト設定確認
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_schema', { schema_name: 'public' })
      .catch(() => null);
      
    console.log('📊 データベース接続確認完了');
    
  } catch (error) {
    console.error('❌ 接続エラー:', error.message);
  }
}

testSupabaseConnection();