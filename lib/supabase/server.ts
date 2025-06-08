/**
 * Supabaseサーバーサイドクライアント
 */

import { createClient } from '@supabase/supabase-js'

// サーバーサイド用Supabaseクライアント（Service Role Key使用）
export function createServerSupabaseClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
  }
  
  // Service Role Keyが設定されていない場合はAnon Keyを使用
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseKey) {
    throw new Error('Missing Supabase key')
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}