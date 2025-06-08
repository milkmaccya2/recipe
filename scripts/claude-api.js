/**
 * Claude Code API連携スクリプト
 * 
 * このスクリプトはClaude Code APIとの統合を管理します。
 * 現在はモック実装ですが、実際のAPIが利用可能になったときに
 * 簡単に置き換えられるように設計されています。
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class ClaudeCodeAPI {
  constructor() {
    this.apiKey = process.env.CLAUDE_CODE_API_KEY;
    this.baseUrl = process.env.CLAUDE_CODE_API_URL || 'https://api.claude.ai/code';
    this.sessions = new Map();
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  /**
   * 新しいClaude Codeセッションを作成
   */
  async createSession(config = {}) {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const defaultConfig = {
      model: 'claude-sonnet-4',
      temperature: 0.1,
      maxTokens: 4000,
      timeout: 300000, // 5分
      workingDirectory: process.cwd(),
      projectContext: await this.getProjectContext()
    };

    const sessionConfig = { ...defaultConfig, ...config };
    
    console.log(`🔧 Creating Claude Code session: ${sessionId}`);
    
    // Mock実装 - 実際のAPIに置き換え予定
    if (!this.apiKey) {
      console.warn('⚠️ Claude Code API key not found. Using mock session.');
      this.sessions.set(sessionId, {
        id: sessionId,
        config: sessionConfig,
        mock: true,
        created: new Date()
      });
      return { id: sessionId, mock: true };
    }

    try {
      // 実際のAPI呼び出し（未実装）
      const response = await this.makeAPICall('/sessions', {
        method: 'POST',
        body: sessionConfig
      });

      this.sessions.set(sessionId, {
        id: sessionId,
        config: sessionConfig,
        apiSessionId: response.id,
        created: new Date()
      });

      return { id: sessionId, apiSessionId: response.id };
    } catch (error) {
      console.error(`❌ Failed to create session: ${error.message}`);
      throw error;
    }
  }

  /**
   * タスクをセッションで実行
   */
  async executeTask(sessionId, task) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    console.log(`⚙️ Executing task in session ${sessionId}`);
    console.log(`📝 Task: ${task.description || 'No description'}`);

    if (session.mock) {
      return this.executeMockTask(session, task);
    }

    try {
      const response = await this.makeAPICall(`/sessions/${session.apiSessionId}/execute`, {
        method: 'POST',
        body: {
          prompt: task.prompt,
          context: task.context,
          files: task.files
        }
      });

      return this.processResponse(response);
    } catch (error) {
      console.error(`❌ Task execution failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * 並行タスク実行
   */
  async executeParallelTasks(tasks, maxConcurrency = 3) {
    console.log(`🚀 Starting parallel execution of ${tasks.length} tasks`);
    console.log(`📊 Max concurrency: ${maxConcurrency}`);

    const results = [];
    const executing = [];

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      
      const promise = this.executeTaskWithSession(task)
        .then(result => {
          console.log(`✅ Task ${i + 1}/${tasks.length} completed: ${task.description}`);
          return { index: i, result, task };
        })
        .catch(error => {
          console.error(`❌ Task ${i + 1}/${tasks.length} failed: ${error.message}`);
          return { index: i, error, task };
        });

      executing.push(promise);

      // 並行数制限
      if (executing.length >= maxConcurrency) {
        const completed = await Promise.race(executing);
        const index = executing.findIndex(p => p === completed);
        executing.splice(index, 1);
        results.push(completed);
      }
    }

    // 残りのタスクを完了まで待機
    const remaining = await Promise.all(executing);
    results.push(...remaining);

    // インデックス順にソート
    results.sort((a, b) => a.index - b.index);

    const successful = results.filter(r => !r.error).length;
    const failed = results.filter(r => r.error).length;

    console.log(`📊 Parallel execution completed: ${successful} successful, ${failed} failed`);

    return results;
  }

  /**
   * 単一タスクを新セッションで実行
   */
  async executeTaskWithSession(task) {
    const session = await this.createSession(task.sessionConfig);
    
    try {
      return await this.executeTask(session.id, task);
    } finally {
      await this.closeSession(session.id);
    }
  }

  /**
   * セッションを閉じる
   */
  async closeSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }

    console.log(`🔚 Closing session: ${sessionId}`);

    if (!session.mock && session.apiSessionId) {
      try {
        await this.makeAPICall(`/sessions/${session.apiSessionId}`, {
          method: 'DELETE'
        });
      } catch (error) {
        console.warn(`⚠️ Failed to close session: ${error.message}`);
      }
    }

    this.sessions.delete(sessionId);
  }

  /**
   * プロジェクトコンテキストを取得
   */
  async getProjectContext() {
    try {
      const context = {
        claudemd: this.readFileIfExists('CLAUDE.md'),
        requirements: this.readFileIfExists('docs/requirements.md'),
        packageJson: this.readFileIfExists('package.json'),
        tsconfig: this.readFileIfExists('tsconfig.json'),
        gitStatus: this.getGitStatus(),
        projectStructure: this.getProjectStructure()
      };

      return context;
    } catch (error) {
      console.warn(`⚠️ Failed to get project context: ${error.message}`);
      return {};
    }
  }

  /**
   * Mock実装でのタスク実行
   */
  async executeMockTask(session, task) {
    console.log('🎭 Executing mock task...');
    
    // タスクタイプに応じた模擬実行
    switch (task.type) {
      case 'implement':
        return this.mockImplementation(task);
      case 'review':
        return this.mockReview(task);
      case 'test':
        return this.mockTestGeneration(task);
      case 'fix':
        return this.mockCodeFix(task);
      default:
        return this.mockGenericTask(task);
    }
  }

  /**
   * Mock実装生成
   */
  async mockImplementation(task) {
    const files = task.files || [];
    const results = [];

    for (const filePath of files) {
      const content = this.generateMockFileContent(filePath, task);
      
      // ディレクトリ作成
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // ファイル作成
      fs.writeFileSync(filePath, content);
      results.push({
        file: filePath,
        action: 'created',
        content: content
      });

      console.log(`📁 Created mock file: ${filePath}`);
    }

    return {
      success: true,
      files: results,
      message: `Mock implementation created for ${task.description}`,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Mock レビュー
   */
  async mockReview(task) {
    const score = Math.floor(Math.random() * 20) + 80; // 80-100のスコア
    
    return {
      success: true,
      review: {
        overall: score >= 95 ? 'approve' : score >= 80 ? 'comment' : 'request_changes',
        score: score,
        issues: [
          {
            severity: 'minor',
            file: task.files?.[0] || 'unknown',
            line: 42,
            message: 'Consider adding error handling here',
            suggestion: 'Wrap this in try-catch block'
          }
        ],
        summary: `Code quality score: ${score}/100. Generally good implementation with minor improvements suggested.`
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Mock テスト生成
   */
  async mockTestGeneration(task) {
    const testFiles = (task.files || []).map(file => {
      const testPath = file.replace(/\.(ts|tsx|js|jsx)$/, '.test.$1');
      return {
        file: testPath,
        content: this.generateMockTestContent(file),
        type: 'unit-test'
      };
    });

    return {
      success: true,
      tests: testFiles,
      coverage: Math.floor(Math.random() * 20) + 80, // 80-100%
      message: `Generated ${testFiles.length} test files`,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Mockファイルコンテンツ生成
   */
  generateMockFileContent(filePath, task) {
    const ext = path.extname(filePath);
    const fileName = path.basename(filePath, ext);
    
    switch (ext) {
      case '.ts':
      case '.tsx':
        return this.generateMockTypeScriptContent(fileName, task);
      case '.js':
      case '.jsx':
        return this.generateMockJavaScriptContent(fileName, task);
      case '.md':
        return this.generateMockMarkdownContent(fileName, task);
      default:
        return this.generateMockGenericContent(fileName, task);
    }
  }

  /**
   * Mock TypeScriptコンテンツ
   */
  generateMockTypeScriptContent(fileName, task) {
    return `/**
 * ${task.description || 'Auto-generated by AI Development Workflow'}
 * 
 * This is a mock implementation that will be replaced with actual code
 * when Claude Code API integration is completed.
 * 
 * Generated: ${new Date().toISOString()}
 */

export interface ${fileName}Config {
  // TODO: Define configuration interface
}

export class ${fileName} {
  private config: ${fileName}Config;

  constructor(config: ${fileName}Config) {
    this.config = config;
  }

  /**
   * Main functionality - to be implemented
   */
  async execute(): Promise<void> {
    // TODO: Implement actual functionality
    console.log('Mock implementation of ${fileName}');
  }
}

export default ${fileName};
`;
  }

  /**
   * API呼び出し（実装予定）
   */
  async makeAPICall(endpoint, options = {}) {
    if (!this.apiKey) {
      throw new Error('Claude Code API key not configured');
    }

    // 実際のAPI実装はここに記述
    // 現在はmock
    throw new Error('Claude Code API integration not yet implemented');
  }

  /**
   * ユーティリティメソッド
   */
  readFileIfExists(filePath) {
    try {
      return fs.readFileSync(filePath, 'utf-8');
    } catch {
      return null;
    }
  }

  getGitStatus() {
    try {
      return execSync('git status --porcelain', { encoding: 'utf-8' });
    } catch {
      return null;
    }
  }

  getProjectStructure() {
    try {
      return execSync('find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | head -20', { encoding: 'utf-8' });
    } catch {
      return null;
    }
  }

  generateMockTestContent(sourceFile) {
    return `/**
 * Tests for ${sourceFile}
 * Generated by AI Development Workflow
 */

import { describe, test, expect } from '@jest/globals';

describe('${path.basename(sourceFile)}', () => {
  test('should exist', () => {
    expect(true).toBe(true);
  });

  // TODO: Add actual tests when implementation is complete
});
`;
  }

  generateMockMarkdownContent(fileName, task) {
    return `# ${fileName}

${task.description || 'Auto-generated documentation'}

## Overview

This document was automatically generated by the AI Development Workflow.

## TODO

- [ ] Add actual content
- [ ] Review and update
- [ ] Add examples

Generated: ${new Date().toISOString()}
`;
  }

  generateMockGenericContent(fileName, task) {
    return `// ${fileName}
// Generated by AI Development Workflow
// ${task.description || 'No description provided'}
// Created: ${new Date().toISOString()}

// TODO: Implement actual functionality
`;
  }

  async mockGenericTask(task) {
    return {
      success: true,
      message: `Mock execution of task: ${task.description}`,
      result: 'Mock result - replace with actual implementation',
      timestamp: new Date().toISOString()
    };
  }

  async mockCodeFix(task) {
    return {
      success: true,
      fixes: [
        {
          file: task.files?.[0] || 'unknown',
          changes: ['Added error handling', 'Fixed TypeScript types', 'Improved performance'],
          linesChanged: Math.floor(Math.random() * 20) + 5
        }
      ],
      message: 'Mock code fixes applied',
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = ClaudeCodeAPI;

// CLI使用例
if (require.main === module) {
  const api = new ClaudeCodeAPI();
  
  const task = {
    type: 'implement',
    description: 'Test implementation',
    files: ['test-output.ts'],
    prompt: 'Create a test file'
  };

  api.executeTaskWithSession(task)
    .then(result => {
      console.log('✅ Task completed:', JSON.stringify(result, null, 2));
    })
    .catch(error => {
      console.error('❌ Task failed:', error.message);
      process.exit(1);
    });
}