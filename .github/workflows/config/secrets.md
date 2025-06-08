# GitHub Secrets 設定ガイド

AI駆動開発ワークフローを動作させるために必要なSecrets設定について説明します。

## 必須Secrets

### 1. CLAUDE_CODE_API_KEY
Claude Code APIのアクセスキー

```bash
# GitHub Secrets設定
CLAUDE_CODE_API_KEY=your_claude_code_api_key_here
```

**取得方法:**
1. Claude Code APIにアクセス
2. APIキーを生成
3. GitHub Settings > Secrets and variables > Actions で設定

### 2. GITHUB_TOKEN
GitHub APIアクセス用トークン（自動設定されるが、必要に応じてカスタム設定）

```bash
# 通常は自動設定される
GITHUB_TOKEN=${{ secrets.GITHUB_TOKEN }}
```

**カスタム設定が必要な場合:**
1. GitHub Settings > Developer settings > Personal access tokens
2. 以下の権限を付与:
   - `repo` (フルアクセス)
   - `write:packages`
   - `read:org`

## オプションSecrets

### 3. SLACK_WEBHOOK
Slack通知用Webhook URL

```bash
SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
```

### 4. DISCORD_WEBHOOK
Discord通知用Webhook URL

```bash
DISCORD_WEBHOOK=https://discord.com/api/webhooks/YOUR/DISCORD/WEBHOOK
```

### 5. CLAUDE_CODE_API_URL
Claude Code APIのエンドポイント（デフォルト使用時は不要）

```bash
CLAUDE_CODE_API_URL=https://api.claude.ai/code
```

## 設定手順

### 1. リポジトリ設定
```bash
# リポジトリのSettings > Secrets and variables > Actions
1. "New repository secret" をクリック
2. Name: CLAUDE_CODE_API_KEY
3. Secret: [あなたのAPIキー]
4. "Add secret" をクリック
```

### 2. Organization設定（オプション）
```bash
# Organization全体で共有する場合
1. Organization Settings > Secrets and variables > Actions
2. "New organization secret" をクリック
3. 必要なSecretsを追加
4. Repository accessを設定
```

### 3. 環境別設定（オプション）
```bash
# 環境ごとに異なるAPIキーを使用する場合
1. Settings > Environments
2. "New environment" で環境を作成
3. Environment secretsを設定
```

## セキュリティベストプラクティス

### APIキー管理
- ✅ **推奨**: 定期的なローテーション（月1回）
- ✅ **推奨**: 最小権限の原則
- ❌ **禁止**: コードにハードコーディング
- ❌ **禁止**: ログへの出力

### アクセス制御
```yaml
# ワークフロー例：ブランチ制限
on:
  workflow_dispatch:
    branches: [main, develop]  # 特定ブランチのみ
```

### 監査ログ
```bash
# Secrets使用状況の確認
1. Settings > Actions > General
2. "Audit log" で使用履歴を確認
```

## トラブルシューティング

### よくあるエラー

#### 1. API認証エラー
```
Error: Claude Code API authentication failed
```

**解決方法:**
- APIキーの有効性を確認
- キーの権限設定を確認
- APIクォータの残量を確認

#### 2. GitHub権限エラー
```
Error: Resource not accessible by integration
```

**解決方法:**
- GITHUB_TOKENの権限を確認
- リポジトリの権限設定を確認

#### 3. Secrets未設定エラー
```
Error: Required secret not found
```

**解決方法:**
- Secrets設定を確認
- 環境変数名のスペルチェック

### デバッグ方法

#### 1. Secrets確認
```yaml
# ワークフロー内でSecrets存在確認
- name: Check secrets
  run: |
    if [ -z "${{ secrets.CLAUDE_CODE_API_KEY }}" ]; then
      echo "❌ CLAUDE_CODE_API_KEY not set"
      exit 1
    fi
    echo "✅ Required secrets are configured"
```

#### 2. API接続テスト
```yaml
# API接続テスト
- name: Test API connection
  run: |
    curl -f -H "Authorization: Bearer ${{ secrets.CLAUDE_CODE_API_KEY }}" \
         https://api.claude.ai/code/health || exit 1
```

## 設定検証チェックリスト

- [ ] CLAUDE_CODE_API_KEY が設定されている
- [ ] GITHUB_TOKEN の権限が適切
- [ ] ワークフローがトリガーされる
- [ ] API接続が成功する
- [ ] Issue作成権限がある
- [ ] PR作成権限がある
- [ ] レビュー投稿権限がある

## 参考リンク

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Claude Code API Documentation](https://docs.anthropic.com/claude-code)
- [GitHub Actions Permissions](https://docs.github.com/en/actions/security-guides/automatic-token-authentication)