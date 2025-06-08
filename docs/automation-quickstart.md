# AI駆動開発ワークフロー クイックスタートガイド

このガイドに従って、AI駆動開発ワークフローを実際に動作させてみましょう。

## 🚀 即座に試す（5分でスタート）

### ステップ1: ワークフローの実行
```bash
# Issue自動生成のみ実行（APIキー不要）
gh workflow run ai-development.yml -f mode=issues-only

# 実行状況確認
gh run list --workflow=ai-development.yml
```

### ステップ2: 結果確認
```bash
# 生成されたIssueを確認
gh issue list --label "ai-generated"

# ワークフロー実行ログを確認
gh run view --log
```

## 📋 事前準備

### 1. 必要なツール
```bash
# GitHub CLI (必須)
brew install gh  # macOS
# または
sudo apt install gh  # Ubuntu

# Node.js (推奨: v18以上)
node --version
npm --version
```

### 2. 認証設定
```bash
# GitHub CLIでログイン
gh auth login

# リポジトリクローン（初回のみ）
gh repo clone milkmaccya2/recipe
cd recipe
```

## 🎯 段階別実行

### レベル1: Issue自動生成（APIキー不要）
```bash
# 要件解析とIssue生成のみ
gh workflow run ai-development.yml -f mode=issues-only

# 結果確認
gh issue list --label "ai-generated" --json number,title,labels
```

**期待結果:**
- 5-10個の自動生成されたIssue
- 優先度ラベル付き
- 実装計画テンプレート

### レベル2: Mock実装（APIキー不要）
```bash
# Mock実装の実行
gh workflow run ai-development.yml -f mode=implement -f max_parallel=2

# 結果確認
gh pr list --label "ai-generated"
```

**期待結果:**
- 複数のPull Request
- Mock実装ファイル
- 実装計画ドキュメント

### レベル3: 自動レビュー（APIキー不要）
```bash
# 自動レビューの実行
gh workflow run ai-development.yml -f mode=review

# 結果確認
gh pr list --json number,title | jq '.[] | select(.title | contains("feat:"))'
```

**期待結果:**
- PRへの自動コメント
- コード品質スコア
- 改善提案

### レベル4: フル自動化（Claude Code API必要）
```bash
# 全自動実行
gh workflow run ai-development.yml -f mode=full -f max_parallel=3
```

## 🔧 高度な設定

### Claude Code API統合

#### 1. APIキー設定
```bash
# GitHub Secretsに設定
gh secret set CLAUDE_CODE_API_KEY
# プロンプトでAPIキーを入力
```

#### 2. API統合テスト
```bash
# 統合テスト実行
node scripts/claude-api.js
```

#### 3. 実際の実装実行
```bash
# リアル実装モード
gh workflow run ai-development.yml -f mode=full
```

### 並行処理の調整
```bash
# 並行数を調整（リソースに応じて）
gh workflow run ai-development.yml -f mode=full -f max_parallel=1  # 軽量
gh workflow run ai-development.yml -f mode=full -f max_parallel=5  # 高速
```

### 特定機能の実装
```bash
# 特定機能のみ実装
gh workflow run ai-development.yml -f mode=implement -f feature_filter="authentication"
```

## 📊 結果の確認

### ダッシュボード確認
```bash
# ワークフロー実行履歴
gh run list --workflow=ai-development.yml --limit=10

# 詳細ログ確認
gh run view [RUN_ID] --log

# Issue/PR統計
gh issue list --label "ai-generated" --json state | jq 'group_by(.state) | map({state: .[0].state, count: length})'
```

### 進捗レポート
```bash
# 自動生成された完了レポートを確認
gh issue list --label "workflow-report" --limit=1
```

## 🐛 トラブルシューティング

### よくある問題

#### 1. ワークフローが開始しない
```bash
# 権限確認
gh auth status

# ワークフロー存在確認
gh workflow list

# 手動でファイル確認
ls -la .github/workflows/
```

#### 2. Issueが生成されない
```bash
# 要件解析スクリプトを直接実行
node scripts/requirements-analyzer.js

# エラーログ確認
gh run view --log | grep "ERROR\|FAILED"
```

#### 3. Mock実装が失敗する
```bash
# ローカルでスクリプトテスト
node scripts/claude-api.js

# 権限確認
ls -la scripts/
chmod +x scripts/*.js
```

### デバッグモード
```bash
# デバッグ出力を有効化
export DEBUG=true
gh workflow run ai-development.yml -f mode=issues-only
```

## 🎉 成功パターン

### 理想的な実行フロー
1. **Issue生成** (1-2分) → 5-10個のタスク作成
2. **並行実装** (5-15分) → 複数PR作成
3. **自動レビュー** (2-5分) → 品質チェック完了
4. **自動修正** (3-10分) → 指摘事項を自動修正
5. **完了報告** → 統計レポート生成

### パフォーマンス指標
- **Issue生成速度**: 10件/分
- **実装速度**: 3件並行で15分以内
- **レビュー速度**: 1件あたり2分以内
- **修正速度**: 80%の指摘を自動修正

## 🔄 継続的な改善

### 1. 週次実行
```bash
# 定期実行のスケジュール設定（.github/workflows/weekly.yml）
gh workflow run ai-development.yml -f mode=full
```

### 2. 品質メトリクス追跡
```bash
# 品質スコア確認
gh issue list --label "workflow-report" | head -5
```

### 3. カスタマイズ
- 要件定義書の更新
- CLAUDE.mdの改善
- カスタムルールの追加

## 📈 次のステップ

### 高度な機能の有効化
1. **Slack/Discord通知の設定**
2. **カスタムレビューパターンの追加**
3. **プロジェクト固有のルール実装**
4. **メトリクス自動収集の設定**

### 運用の最適化
1. **並行数の調整**
2. **実行タイミングの最適化**
3. **エラー処理の改善**
4. **ログ記録の拡充**

---

## 🤖 このワークフローで実現できること

✅ **24時間365日の開発サポート**  
✅ **一貫した品質の実装**  
✅ **高速なレビューサイクル**  
✅ **自動的な技術的負債の削減**  
✅ **開発者の生産性向上**

すぐに始めて、AI駆動開発の威力を体験してください！