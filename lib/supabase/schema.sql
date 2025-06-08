-- Supabaseデータベーススキーマ
-- 実行方法: Supabase ダッシュボードのSQL Editorで実行

-- ユーザープロファイルテーブル
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- レシピテーブル
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  thumbnail_url TEXT,
  cooking_time INTEGER, -- 分単位
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  servings INTEGER DEFAULT 2,
  calories INTEGER,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 食材テーブル
CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- レシピと食材の中間テーブル
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id),
  amount TEXT,
  unit TEXT,
  is_optional BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 調味料テーブル
CREATE TABLE IF NOT EXISTS seasonings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- レシピと調味料の中間テーブル
CREATE TABLE IF NOT EXISTS recipe_seasonings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  seasoning_id UUID REFERENCES seasonings(id),
  amount TEXT,
  unit TEXT,
  is_essential BOOLEAN DEFAULT true,
  alternatives TEXT[], -- 代替調味料のリスト
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- レシピの手順テーブル
CREATE TABLE IF NOT EXISTS recipe_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  description TEXT NOT NULL,
  duration INTEGER, -- 分単位
  tips TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 画像アップロード履歴テーブル
CREATE TABLE IF NOT EXISTS upload_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  upload_id TEXT UNIQUE NOT NULL,
  image_url TEXT NOT NULL,
  s3_key TEXT,
  detected_ingredients JSONB, -- 検出された食材のJSON配列
  analysis_confidence FLOAT,
  processing_time FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- お気に入りレシピテーブル
CREATE TABLE IF NOT EXISTS favorite_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, recipe_id)
);

-- レシピ履歴テーブル
CREATE TABLE IF NOT EXISTS recipe_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_seasonings_recipe_id ON recipe_seasonings(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_steps_recipe_id ON recipe_steps(recipe_id);
CREATE INDEX IF NOT EXISTS idx_upload_history_user_id ON upload_history(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_recipes_user_id ON favorite_recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_history_user_id ON recipe_history(user_id);

-- RLS (Row Level Security) ポリシー
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_history ENABLE ROW LEVEL SECURITY;

-- プロファイルのRLSポリシー
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- レシピのRLSポリシー
CREATE POLICY "Public recipes are viewable by everyone" ON recipes
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can create own recipes" ON recipes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recipes" ON recipes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recipes" ON recipes
  FOR DELETE USING (auth.uid() = user_id);

-- アップロード履歴のRLSポリシー
CREATE POLICY "Users can view own upload history" ON upload_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own upload history" ON upload_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- お気に入りのRLSポリシー
CREATE POLICY "Users can manage own favorites" ON favorite_recipes
  FOR ALL USING (auth.uid() = user_id);

-- 履歴のRLSポリシー
CREATE POLICY "Users can manage own history" ON recipe_history
  FOR ALL USING (auth.uid() = user_id);

-- トリガー関数：updated_atの自動更新
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーの作成
CREATE TRIGGER set_timestamp_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_recipes
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();