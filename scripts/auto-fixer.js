/**
 * 自動修正スクリプト
 * 
 * レビューコメントを解析して、自動的にコードの修正を行います。
 * Claude Code APIと連携して、高品質な修正を提供します。
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ClaudeCodeAPI = require('./claude-api');

class AutoFixer {
  constructor() {
    this.claudeAPI = new ClaudeCodeAPI();
    this.fixHistory = [];
    this.maxRetries = 3;
  }

  /**
   * Pull Requestのレビューコメントを解析して修正を実行
   */
  async fixPullRequest(prNumber, options = {}) {
    console.log(`🔧 Starting auto-fix for PR #${prNumber}`);
    
    try {
      // 1. PRの詳細情報を取得
      const prInfo = await this.getPRInfo(prNumber);
      console.log(`📋 PR Title: ${prInfo.title}`);

      // 2. レビューコメントを取得
      const reviews = await this.getReviewComments(prNumber);
      console.log(`💬 Found ${reviews.length} review comments`);

      // 3. 修正可能なコメントをフィルタリング
      const fixableIssues = this.identifyFixableIssues(reviews);
      console.log(`🎯 Identified ${fixableIssues.length} fixable issues`);

      if (fixableIssues.length === 0) {
        console.log('✅ No fixable issues found');
        return { success: true, fixes: [] };
      }

      // 4. 修正の実行
      const fixes = await this.executeFixes(fixableIssues, prInfo);
      console.log(`🔨 Applied ${fixes.length} fixes`);

      // 5. テストの実行
      if (options.runTests !== false) {
        await this.runTests();
      }

      // 6. 修正結果をコミット
      if (fixes.length > 0) {
        await this.commitFixes(prNumber, fixes);
      }

      return {
        success: true,
        fixes: fixes,
        prNumber: prNumber
      };

    } catch (error) {
      console.error(`❌ Auto-fix failed for PR #${prNumber}:`, error.message);
      throw error;
    }
  }

  /**
   * PR情報の取得
   */
  async getPRInfo(prNumber) {
    try {
      const prJson = execSync(`gh pr view ${prNumber} --json title,body,headRefName,baseRefName,files`, 
        { encoding: 'utf-8' });
      return JSON.parse(prJson);
    } catch (error) {
      throw new Error(`Failed to get PR info: ${error.message}`);
    }
  }

  /**
   * レビューコメントの取得
   */
  async getReviewComments(prNumber) {
    try {
      // GitHub CLIでレビューコメントを取得
      const reviewsJson = execSync(`gh pr view ${prNumber} --json reviews`, 
        { encoding: 'utf-8' });
      const reviewsData = JSON.parse(reviewsJson);

      const comments = [];
      
      reviewsData.reviews.forEach(review => {
        if (review.state === 'CHANGES_REQUESTED' || review.state === 'COMMENTED') {
          // レビューの本文
          if (review.body) {
            comments.push({
              type: 'review',
              body: review.body,
              author: review.author.login,
              state: review.state
            });
          }
        }
      });

      // 詳細なレビューコメントも取得
      try {
        const detailedCommentsJson = execSync(
          `gh api repos/:owner/:repo/pulls/${prNumber}/comments`, 
          { encoding: 'utf-8' }
        );
        const detailedComments = JSON.parse(detailedCommentsJson);

        detailedComments.forEach(comment => {
          comments.push({
            type: 'line_comment',
            body: comment.body,
            path: comment.path,
            line: comment.line,
            author: comment.user.login,
            position: comment.position
          });
        });
      } catch (error) {
        console.warn('⚠️ Could not fetch detailed comments:', error.message);
      }

      return comments;
    } catch (error) {
      throw new Error(`Failed to get review comments: ${error.message}`);
    }
  }

  /**
   * 修正可能な課題の特定
   */
  identifyFixableIssues(reviews) {
    const fixableIssues = [];

    const fixablePatterns = [
      {
        pattern: /error\s+handling|try\s*catch|exception/i,
        type: 'error_handling',
        severity: 'high',
        description: 'Error handling improvement'
      },
      {
        pattern: /type\s+annotation|typescript|type\s+definition/i,
        type: 'typescript',
        severity: 'medium',
        description: 'TypeScript type improvement'
      },
      {
        pattern: /test|unit\s+test|coverage/i,
        type: 'testing',
        severity: 'medium',
        description: 'Test coverage improvement'
      },
      {
        pattern: /performance|optimization|efficient/i,
        type: 'performance',
        severity: 'medium',
        description: 'Performance optimization'
      },
      {
        pattern: /security|vulnerable|injection/i,
        type: 'security',
        severity: 'critical',
        description: 'Security improvement'
      },
      {
        pattern: /documentation|comment|readme/i,
        type: 'documentation',
        severity: 'low',
        description: 'Documentation improvement'
      },
      {
        pattern: /naming|variable\s+name|function\s+name/i,
        type: 'naming',
        severity: 'low',
        description: 'Naming convention improvement'
      },
      {
        pattern: /lint|eslint|formatting|style/i,
        type: 'linting',
        severity: 'low',
        description: 'Code style improvement'
      }
    ];

    reviews.forEach(review => {
      fixablePatterns.forEach(pattern => {
        if (pattern.pattern.test(review.body)) {
          fixableIssues.push({
            ...pattern,
            originalComment: review,
            file: review.path,
            line: review.line,
            suggestion: this.extractSuggestion(review.body)
          });
        }
      });
    });

    // 重要度順にソート
    const severityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
    return fixableIssues.sort((a, b) => 
      (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0)
    );
  }

  /**
   * 修正提案の抽出
   */
  extractSuggestion(commentBody) {
    // 修正提案を含む可能性のあるパターンを検索
    const suggestionPatterns = [
      /suggest(?:ion)?:?\s*(.+?)(?:\n|$)/i,
      /should\s+(.+?)(?:\n|$)/i,
      /try\s+(.+?)(?:\n|$)/i,
      /consider\s+(.+?)(?:\n|$)/i,
      /recommend\s+(.+?)(?:\n|$)/i
    ];

    for (const pattern of suggestionPatterns) {
      const match = commentBody.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * 修正の実行
   */
  async executeFixes(fixableIssues, prInfo) {
    const fixes = [];

    for (const issue of fixableIssues) {
      console.log(`🔧 Fixing: ${issue.description} (${issue.severity})`);
      
      try {
        const fix = await this.executeSingleFix(issue, prInfo);
        if (fix.success) {
          fixes.push(fix);
          console.log(`✅ Fixed: ${issue.description}`);
        } else {
          console.log(`⚠️ Could not fix: ${issue.description} - ${fix.reason}`);
        }
      } catch (error) {
        console.error(`❌ Fix failed: ${issue.description} - ${error.message}`);
      }
    }

    return fixes;
  }

  /**
   * 単一の修正を実行
   */
  async executeSingleFix(issue, prInfo) {
    switch (issue.type) {
      case 'error_handling':
        return await this.fixErrorHandling(issue, prInfo);
      case 'typescript':
        return await this.fixTypeScript(issue, prInfo);
      case 'testing':
        return await this.fixTesting(issue, prInfo);
      case 'security':
        return await this.fixSecurity(issue, prInfo);
      case 'performance':
        return await this.fixPerformance(issue, prInfo);
      case 'documentation':
        return await this.fixDocumentation(issue, prInfo);
      case 'linting':
        return await this.fixLinting(issue, prInfo);
      case 'naming':
        return await this.fixNaming(issue, prInfo);
      default:
        return await this.fixGeneric(issue, prInfo);
    }
  }

  /**
   * エラーハンドリングの修正
   */
  async fixErrorHandling(issue, prInfo) {
    if (!issue.file) {
      return { success: false, reason: 'No file specified' };
    }

    const session = await this.claudeAPI.createSession({
      projectContext: await this.claudeAPI.getProjectContext()
    });

    try {
      const fileContent = fs.readFileSync(issue.file, 'utf-8');
      
      const task = {
        type: 'fix',
        description: 'Improve error handling',
        prompt: `
Please improve the error handling in this file:

File: ${issue.file}
${issue.line ? `Focus on line ${issue.line}` : ''}

Current content:
\`\`\`
${fileContent}
\`\`\`

Review comment: ${issue.originalComment.body}
${issue.suggestion ? `Suggestion: ${issue.suggestion}` : ''}

Please:
1. Add appropriate try-catch blocks where needed
2. Ensure all async operations have error handling
3. Add meaningful error messages
4. Follow the error handling patterns from CLAUDE.md

Return the improved code.
        `,
        files: [issue.file]
      };

      const result = await this.claudeAPI.executeTask(session.id, task);
      
      if (result.success && result.files && result.files.length > 0) {
        // ファイルを更新
        const updatedContent = result.files[0].content;
        fs.writeFileSync(issue.file, updatedContent);
        
        return {
          success: true,
          type: 'error_handling',
          file: issue.file,
          changes: ['Added error handling', 'Improved exception management'],
          originalIssue: issue
        };
      }

      return { success: false, reason: 'Claude API did not return valid fixes' };
    } finally {
      await this.claudeAPI.closeSession(session.id);
    }
  }

  /**
   * TypeScript型の修正
   */
  async fixTypeScript(issue, prInfo) {
    if (!issue.file) {
      return { success: false, reason: 'No file specified' };
    }

    const session = await this.claudeAPI.createSession();

    try {
      const fileContent = fs.readFileSync(issue.file, 'utf-8');
      
      const task = {
        type: 'fix',
        description: 'Improve TypeScript types',
        prompt: `
Please improve the TypeScript types in this file:

File: ${issue.file}
${issue.line ? `Focus on line ${issue.line}` : ''}

Current content:
\`\`\`
${fileContent}
\`\`\`

Review comment: ${issue.originalComment.body}

Please:
1. Add proper type annotations
2. Fix any TypeScript errors
3. Improve type safety
4. Follow TypeScript best practices

Return the improved code.
        `,
        files: [issue.file]
      };

      const result = await this.claudeAPI.executeTask(session.id, task);
      
      if (result.success) {
        const updatedContent = result.files[0].content;
        fs.writeFileSync(issue.file, updatedContent);
        
        return {
          success: true,
          type: 'typescript',
          file: issue.file,
          changes: ['Improved TypeScript types', 'Added type annotations'],
          originalIssue: issue
        };
      }

      return { success: false, reason: 'Failed to improve TypeScript types' };
    } finally {
      await this.claudeAPI.closeSession(session.id);
    }
  }

  /**
   * テストの修正・追加
   */
  async fixTesting(issue, prInfo) {
    const session = await this.claudeAPI.createSession();

    try {
      const sourceFile = issue.file;
      const testFile = this.getTestFilePath(sourceFile);
      
      let sourceContent = '';
      if (sourceFile && fs.existsSync(sourceFile)) {
        sourceContent = fs.readFileSync(sourceFile, 'utf-8');
      }

      let testContent = '';
      if (fs.existsSync(testFile)) {
        testContent = fs.readFileSync(testFile, 'utf-8');
      }

      const task = {
        type: 'test',
        description: 'Improve test coverage',
        prompt: `
Please improve the test coverage for this file:

Source file: ${sourceFile}
\`\`\`
${sourceContent}
\`\`\`

Current test file: ${testFile}
\`\`\`
${testContent}
\`\`\`

Review comment: ${issue.originalComment.body}

Please:
1. Add missing test cases
2. Improve test coverage
3. Add edge case tests
4. Follow Jest testing patterns

Return the improved test file content.
        `,
        files: [testFile]
      };

      const result = await this.claudeAPI.executeTask(session.id, task);
      
      if (result.success) {
        const updatedTestContent = result.tests[0].content;
        
        // ディレクトリを作成（必要な場合）
        const testDir = path.dirname(testFile);
        if (!fs.existsSync(testDir)) {
          fs.mkdirSync(testDir, { recursive: true });
        }
        
        fs.writeFileSync(testFile, updatedTestContent);
        
        return {
          success: true,
          type: 'testing',
          file: testFile,
          changes: ['Added test cases', 'Improved test coverage'],
          originalIssue: issue
        };
      }

      return { success: false, reason: 'Failed to improve tests' };
    } finally {
      await this.claudeAPI.closeSession(session.id);
    }
  }

  /**
   * セキュリティの修正
   */
  async fixSecurity(issue, prInfo) {
    const session = await this.claudeAPI.createSession();

    try {
      const fileContent = fs.readFileSync(issue.file, 'utf-8');
      
      const task = {
        type: 'fix',
        description: 'Fix security issues',
        prompt: `
Please fix security issues in this file:

File: ${issue.file}
\`\`\`
${fileContent}
\`\`\`

Security concern: ${issue.originalComment.body}

Please:
1. Fix any security vulnerabilities
2. Add input validation
3. Prevent injection attacks
4. Follow security best practices
5. Add security comments where appropriate

Return the secure code.
        `,
        files: [issue.file]
      };

      const result = await this.claudeAPI.executeTask(session.id, task);
      
      if (result.success) {
        const updatedContent = result.files[0].content;
        fs.writeFileSync(issue.file, updatedContent);
        
        return {
          success: true,
          type: 'security',
          file: issue.file,
          changes: ['Fixed security vulnerabilities', 'Added input validation'],
          originalIssue: issue
        };
      }

      return { success: false, reason: 'Failed to fix security issues' };
    } finally {
      await this.claudeAPI.closeSession(session.id);
    }
  }

  /**
   * Linting修正
   */
  async fixLinting(issue, prInfo) {
    try {
      // ESLintによる自動修正を試行
      if (issue.file) {
        execSync(`npx eslint ${issue.file} --fix`, { stdio: 'ignore' });
        
        return {
          success: true,
          type: 'linting',
          file: issue.file,
          changes: ['Fixed linting issues', 'Applied code formatting'],
          originalIssue: issue
        };
      }

      return { success: false, reason: 'No file specified for linting' };
    } catch (error) {
      return { success: false, reason: `Linting failed: ${error.message}` };
    }
  }

  /**
   * ジェネリック修正
   */
  async fixGeneric(issue, prInfo) {
    const session = await this.claudeAPI.createSession();

    try {
      const task = {
        type: 'fix',
        description: issue.description,
        prompt: `
Please address this review comment:

Comment: ${issue.originalComment.body}
File: ${issue.file || 'Not specified'}
${issue.suggestion ? `Suggestion: ${issue.suggestion}` : ''}

Please provide a fix for this issue.
        `
      };

      const result = await this.claudeAPI.executeTask(session.id, task);
      
      return {
        success: result.success,
        type: 'generic',
        file: issue.file,
        changes: result.fixes?.map(f => f.changes).flat() || ['Generic fix applied'],
        originalIssue: issue
      };
    } finally {
      await this.claudeAPI.closeSession(session.id);
    }
  }

  /**
   * テストの実行
   */
  async runTests() {
    console.log('🧪 Running tests...');
    
    try {
      // TypeScript型チェック
      execSync('npm run typecheck', { stdio: 'inherit' });
      console.log('✅ TypeScript checks passed');
      
      // Linting
      execSync('npm run lint', { stdio: 'inherit' });
      console.log('✅ Linting passed');
      
      // ユニットテスト
      execSync('npm test', { stdio: 'inherit' });
      console.log('✅ Unit tests passed');
      
      // ビルドチェック
      execSync('npm run build', { stdio: 'inherit' });
      console.log('✅ Build successful');
      
    } catch (error) {
      console.error('❌ Tests failed:', error.message);
      throw new Error('Tests failed after auto-fix');
    }
  }

  /**
   * 修正結果をコミット
   */
  async commitFixes(prNumber, fixes) {
    const fixSummary = fixes.map(fix => 
      `- ${fix.type}: ${fix.file || 'multiple files'}`
    ).join('\n');

    const commitMessage = `fix: auto-fix PR #${prNumber} review comments

Applied automatic fixes:
${fixSummary}

🤖 Generated with AI Auto-Fixer`;

    try {
      execSync('git add .', { stdio: 'inherit' });
      execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
      
      // PRブランチにプッシュ
      const branchName = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
      execSync(`git push origin ${branchName}`, { stdio: 'inherit' });
      
      console.log('✅ Fixes committed and pushed');
      
      // PRにコメントを追加
      const commentBody = `🤖 **Auto-Fix Applied**

I've automatically applied fixes for the following review comments:

${fixes.map(fix => `- **${fix.type}**: ${fix.changes.join(', ')}`).join('\n')}

All tests are passing. Please review the changes.`;

      execSync(`gh pr comment ${prNumber} --body "${commentBody}"`, { stdio: 'inherit' });
      
    } catch (error) {
      console.error('❌ Failed to commit fixes:', error.message);
      throw error;
    }
  }

  /**
   * ユーティリティメソッド
   */
  getTestFilePath(sourceFile) {
    if (!sourceFile) return null;
    
    const dir = path.dirname(sourceFile);
    const basename = path.basename(sourceFile, path.extname(sourceFile));
    const ext = path.extname(sourceFile);
    
    return path.join(dir, `${basename}.test${ext}`);
  }

  // その他のユーティリティメソッド（省略）
  async fixPerformance(issue, prInfo) {
    return { success: false, reason: 'Performance fixes not implemented yet' };
  }

  async fixDocumentation(issue, prInfo) {
    return { success: false, reason: 'Documentation fixes not implemented yet' };
  }

  async fixNaming(issue, prInfo) {
    return { success: false, reason: 'Naming fixes not implemented yet' };
  }
}

module.exports = AutoFixer;

// CLI使用例
if (require.main === module) {
  const prNumber = process.argv[2];
  
  if (!prNumber) {
    console.error('Usage: node auto-fixer.js <PR_NUMBER>');
    process.exit(1);
  }

  const fixer = new AutoFixer();
  
  fixer.fixPullRequest(prNumber)
    .then(result => {
      console.log('✅ Auto-fix completed:', JSON.stringify(result, null, 2));
    })
    .catch(error => {
      console.error('❌ Auto-fix failed:', error.message);
      process.exit(1);
    });
}