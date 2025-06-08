/**
 * 要件解析スクリプト
 * 
 * プロジェクトの要件定義書、CLAUDE.md、既存コードを解析して
 * 未実装機能を特定し、実装優先度を決定します。
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class RequirementsAnalyzer {
  constructor() {
    this.projectRoot = process.cwd();
    this.analysisResult = {
      unimplementedFeatures: [],
      implementedFeatures: [],
      partiallyImplementedFeatures: [],
      totalFeatures: 0,
      implementationProgress: 0
    };
  }

  /**
   * メイン解析処理
   */
  async analyzeProject() {
    console.log('🔍 Starting comprehensive project analysis...');
    
    try {
      // 1. 要件文書の解析
      const requirements = await this.parseRequirements();
      console.log(`📋 Found ${requirements.length} requirements`);

      // 2. 既存実装のスキャン
      const implementations = await this.scanImplementations();
      console.log(`💻 Found ${implementations.length} implemented features`);

      // 3. ギャップ分析
      const gaps = this.identifyGaps(requirements, implementations);
      console.log(`📊 Identified ${gaps.unimplemented.length} unimplemented features`);

      // 4. 優先度付け
      const prioritized = this.prioritizeFeatures(gaps.unimplemented);
      console.log(`🎯 Prioritized features for implementation`);

      // 5. 実装計画生成
      const plan = this.generateImplementationPlan(prioritized);
      console.log(`📅 Generated implementation plan`);

      this.analysisResult = {
        ...gaps,
        prioritizedFeatures: prioritized,
        implementationPlan: plan,
        totalFeatures: requirements.length,
        implementationProgress: this.calculateProgress(gaps)
      };

      return this.analysisResult;
    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
      throw error;
    }
  }

  /**
   * 要件文書の解析
   */
  async parseRequirements() {
    const requirements = [];

    // CLAUDE.mdの解析
    if (fs.existsSync('CLAUDE.md')) {
      const claudeFeatures = this.parseCLAUDEmd();
      requirements.push(...claudeFeatures);
    }

    // requirements.mdの解析
    if (fs.existsSync('docs/requirements.md')) {
      const reqFeatures = this.parseRequirementsmd();
      requirements.push(...reqFeatures);
    }

    // system-architecture.mdの解析
    if (fs.existsSync('docs/system-architecture.md')) {
      const archFeatures = this.parseArchitecturemd();
      requirements.push(...archFeatures);
    }

    return this.deduplicateFeatures(requirements);
  }

  /**
   * CLAUDE.mdの解析
   */
  parseCLAUDEmd() {
    const content = fs.readFileSync('CLAUDE.md', 'utf-8');
    const features = [];

    // 技術スタック情報を抽出
    const techStackMatch = content.match(/## 技術スタック\n([\s\S]*?)(?=\n##|$)/);
    if (techStackMatch) {
      const techStack = techStackMatch[1];
      const technologies = this.extractTechnologies(techStack);
      
      technologies.forEach(tech => {
        features.push({
          id: `tech-${tech.name.toLowerCase().replace(/\s+/g, '-')}`,
          title: `${tech.name}の実装`,
          description: `${tech.name}を使用した機能の実装`,
          category: 'technology',
          priority: 'high',
          type: 'infrastructure',
          dependencies: tech.dependencies || [],
          files: this.predictFiles(tech.name),
          estimate: this.estimateEffort(tech.name),
          source: 'CLAUDE.md'
        });
      });
    }

    // API設計情報を抽出
    const apiMatch = content.match(/## API レスポンス形式\n([\s\S]*?)(?=\n##|$)/);
    if (apiMatch) {
      features.push({
        id: 'api-standardization',
        title: 'API レスポンス形式の標準化',
        description: '統一されたAPIレスポンス形式の実装',
        category: 'api',
        priority: 'high',
        type: 'backend',
        files: ['lib/api-response.ts', 'types/api.ts'],
        estimate: '1d',
        source: 'CLAUDE.md'
      });
    }

    // エラーハンドリング要件を抽出
    const errorMatch = content.match(/## エラーハンドリング規約\n([\s\S]*?)(?=\n##|$)/);
    if (errorMatch) {
      features.push({
        id: 'error-handling',
        title: 'エラーハンドリングシステム',
        description: '統一されたエラーハンドリングの実装',
        category: 'infrastructure',
        priority: 'high',
        type: 'fullstack',
        files: ['lib/error-handler.ts', 'components/error-boundary.tsx'],
        estimate: '2d',
        source: 'CLAUDE.md'
      });
    }

    return features;
  }

  /**
   * requirements.mdの解析
   */
  parseRequirementsmd() {
    const content = fs.readFileSync('docs/requirements.md', 'utf-8');
    const features = [];

    // 機能要件の抽出
    const functionalMatch = content.match(/### 2\.1 主要機能\n([\s\S]*?)(?=\n###|$)/);
    if (functionalMatch) {
      const functionsSection = functionalMatch[1];
      const functionBlocks = functionsSection.split(/#### \d+\.\d+\.\d+ /);
      
      functionBlocks.slice(1).forEach((block, index) => {
        const lines = block.split('\n');
        const title = lines[0];
        const description = lines.slice(1).filter(line => line.startsWith('- ')).join('\n');
        
        features.push({
          id: `func-${index + 1}`,
          title: title,
          description: description,
          category: 'feature',
          priority: this.determinePriority(title, description),
          type: this.determineType(title, description),
          files: this.predictFilesFromDescription(title, description),
          estimate: this.estimateFromDescription(description),
          source: 'requirements.md'
        });
      });
    }

    // 非機能要件の抽出
    const nonFunctionalMatch = content.match(/## 3\. 非機能要件\n([\s\S]*?)(?=\n##|$)/);
    if (nonFunctionalMatch) {
      const nfSection = nonFunctionalMatch[1];
      
      features.push({
        id: 'performance-requirements',
        title: 'パフォーマンス要件の実装',
        description: 'レスポンス時間、同時接続数などの性能要件',
        category: 'performance',
        priority: 'medium',
        type: 'infrastructure',
        files: ['lib/performance-monitor.ts', 'middleware/rate-limiter.ts'],
        estimate: '3d',
        source: 'requirements.md'
      });

      features.push({
        id: 'security-requirements',
        title: 'セキュリティ要件の実装',
        description: 'HTTPS、認証、XSS対策などのセキュリティ機能',
        category: 'security',
        priority: 'high',
        type: 'fullstack',
        files: ['lib/security.ts', 'middleware/auth.ts'],
        estimate: '4d',
        source: 'requirements.md'
      });
    }

    return features;
  }

  /**
   * 既存実装のスキャン
   */
  async scanImplementations() {
    const implementations = [];

    // ファイルシステムをスキャン
    const files = this.getAllFiles(['.ts', '.tsx', '.js', '.jsx']);
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const features = this.extractFeaturesFromCode(file, content);
      implementations.push(...features);
    }

    // package.jsonから依存関係をチェック
    if (fs.existsSync('package.json')) {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
      const depFeatures = this.extractFeaturesFromDependencies(pkg);
      implementations.push(...depFeatures);
    }

    return implementations;
  }

  /**
   * コードから機能を抽出
   */
  extractFeaturesFromCode(filePath, content) {
    const features = [];
    
    // APIエンドポイントの検出
    if (filePath.includes('/api/') && content.includes('export async function')) {
      const methods = content.match(/export async function (GET|POST|PUT|DELETE|PATCH)/g) || [];
      methods.forEach(method => {
        const httpMethod = method.split(' ')[3];
        features.push({
          id: `api-${filePath.replace(/[^a-zA-Z0-9]/g, '-')}-${httpMethod}`,
          title: `${httpMethod} ${filePath}`,
          description: `${httpMethod} API endpoint implementation`,
          category: 'api',
          type: 'backend',
          file: filePath,
          implemented: true
        });
      });
    }

    // コンポーネントの検出
    if (filePath.includes('/components/') && (content.includes('export function') || content.includes('export const'))) {
      const componentMatch = content.match(/export (?:function|const) (\w+)/);
      if (componentMatch) {
        const componentName = componentMatch[1];
        features.push({
          id: `component-${componentName.toLowerCase()}`,
          title: `${componentName} コンポーネント`,
          description: `React component: ${componentName}`,
          category: 'ui',
          type: 'frontend',
          file: filePath,
          implemented: true
        });
      }
    }

    // フックの検出
    if (filePath.includes('/hooks/') && content.includes('export function use')) {
      const hookMatches = content.match(/export function (use\w+)/g) || [];
      hookMatches.forEach(hookMatch => {
        const hookName = hookMatch.split(' ')[2];
        features.push({
          id: `hook-${hookName.toLowerCase()}`,
          title: `${hookName} フック`,
          description: `Custom React hook: ${hookName}`,
          category: 'hook',
          type: 'frontend',
          file: filePath,
          implemented: true
        });
      });
    }

    return features;
  }

  /**
   * 依存関係から機能を抽出
   */
  extractFeaturesFromDependencies(pkg) {
    const features = [];
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    const keyDependencies = {
      'jotai': { title: '状態管理 (Jotai)', category: 'state-management' },
      'next-auth': { title: '認証システム', category: 'authentication' },
      'prisma': { title: 'データベースORM', category: 'database' },
      '@supabase/supabase-js': { title: 'Supabase統合', category: 'backend' },
      'react-hook-form': { title: 'フォーム管理', category: 'forms' },
      'tailwindcss': { title: 'スタイリングシステム', category: 'styling' },
      'jest': { title: 'ユニットテスト環境', category: 'testing' },
      '@playwright/test': { title: 'E2Eテスト環境', category: 'testing' }
    };

    Object.keys(deps).forEach(dep => {
      if (keyDependencies[dep]) {
        const info = keyDependencies[dep];
        features.push({
          id: `dep-${dep}`,
          title: info.title,
          description: `${dep} dependency integration`,
          category: info.category,
          type: 'infrastructure',
          implemented: true,
          version: deps[dep]
        });
      }
    });

    return features;
  }

  /**
   * ギャップ分析
   */
  identifyGaps(requirements, implementations) {
    const implementedIds = new Set(implementations.map(impl => impl.id));
    const unimplemented = requirements.filter(req => !implementedIds.has(req.id));
    const implemented = requirements.filter(req => implementedIds.has(req.id));
    
    // 部分実装の検出
    const partiallyImplemented = requirements.filter(req => {
      const relatedImpls = implementations.filter(impl => 
        this.isRelated(req, impl)
      );
      return relatedImpls.length > 0 && !implementedIds.has(req.id);
    });

    return {
      unimplemented,
      implemented,
      partiallyImplemented
    };
  }

  /**
   * 機能の優先度付け
   */
  prioritizeFeatures(features) {
    return features.sort((a, b) => {
      // 優先度による並び替え
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // 依存関係による並び替え（依存されている方を先に）
      const aDependents = features.filter(f => f.dependencies?.includes(a.id)).length;
      const bDependents = features.filter(f => f.dependencies?.includes(b.id)).length;
      
      return bDependents - aDependents;
    });
  }

  /**
   * 実装計画の生成
   */
  generateImplementationPlan(features) {
    const plan = {
      phases: [],
      totalEstimate: '0d',
      critical: [],
      recommended: []
    };

    // フェーズ分け
    const phases = [
      {
        name: 'Phase 1: Core Infrastructure',
        features: features.filter(f => f.category === 'infrastructure' || f.priority === 'high'),
        maxDuration: 7 // days
      },
      {
        name: 'Phase 2: Main Features', 
        features: features.filter(f => f.category === 'feature' && f.priority !== 'low'),
        maxDuration: 14
      },
      {
        name: 'Phase 3: Enhancement & Polish',
        features: features.filter(f => f.priority === 'low' || f.category === 'enhancement'),
        maxDuration: 7
      }
    ];

    plan.phases = phases.map(phase => ({
      ...phase,
      estimatedDays: this.calculatePhaseEstimate(phase.features),
      dependencies: this.getPhaseDepenencies(phase.features)
    }));

    // クリティカル機能の特定
    plan.critical = features.filter(f => 
      f.priority === 'high' && (f.category === 'security' || f.category === 'infrastructure')
    );

    return plan;
  }

  /**
   * ユーティリティメソッド
   */
  getAllFiles(extensions) {
    const files = [];
    
    function scanDir(dir) {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          scanDir(fullPath);
        } else if (stat.isFile()) {
          const ext = path.extname(item);
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    }
    
    scanDir(this.projectRoot);
    return files;
  }

  determinePriority(title, description) {
    const highPriorityKeywords = ['認証', 'セキュリティ', 'AI', 'API', 'データベース'];
    const lowPriorityKeywords = ['デザイン', 'アニメーション', '最適化'];
    
    const text = `${title} ${description}`.toLowerCase();
    
    if (highPriorityKeywords.some(keyword => text.includes(keyword.toLowerCase()))) {
      return 'high';
    }
    if (lowPriorityKeywords.some(keyword => text.includes(keyword.toLowerCase()))) {
      return 'low';
    }
    return 'medium';
  }

  determineType(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    
    if (text.includes('api') || text.includes('データベース')) return 'backend';
    if (text.includes('ui') || text.includes('コンポーネント')) return 'frontend';
    return 'fullstack';
  }

  predictFiles(techName) {
    const predictions = {
      'jotai': ['stores/*.ts'],
      'nextauth': ['app/api/auth/[...nextauth]/route.ts', 'lib/auth.ts'],
      'prisma': ['prisma/schema.prisma', 'lib/database.ts'],
      'tailwind': ['tailwind.config.ts', 'app/globals.css']
    };
    
    return predictions[techName.toLowerCase()] || [`lib/${techName.toLowerCase()}.ts`];
  }

  estimateEffort(techName) {
    const estimates = {
      'nextauth': '3d',
      'prisma': '4d', 
      'jotai': '2d',
      'api': '2d'
    };
    
    return estimates[techName.toLowerCase()] || '1d';
  }

  predictFilesFromDescription(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    const files = [];
    
    if (text.includes('api')) {
      files.push(`app/api/${title.toLowerCase().replace(/\s+/g, '-')}/route.ts`);
    }
    if (text.includes('コンポーネント') || text.includes('ui')) {
      files.push(`components/${title.toLowerCase().replace(/\s+/g, '-')}.tsx`);
    }
    if (text.includes('フック') || text.includes('hook')) {
      files.push(`hooks/use-${title.toLowerCase().replace(/\s+/g, '-')}.ts`);
    }
    
    return files.length > 0 ? files : [`lib/${title.toLowerCase().replace(/\s+/g, '-')}.ts`];
  }

  estimateFromDescription(description) {
    const complexity = description.split('-').length;
    if (complexity <= 3) return '1d';
    if (complexity <= 6) return '2d';
    if (complexity <= 10) return '3d';
    return '4d';
  }

  deduplicateFeatures(features) {
    const seen = new Set();
    return features.filter(feature => {
      const key = feature.id || feature.title;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  extractTechnologies(techStack) {
    const technologies = [];
    const lines = techStack.split('\n').filter(line => line.trim().startsWith('-'));
    
    lines.forEach(line => {
      const match = line.match(/\*\*([^*]+)\*\*:\s*([^-]+)/);
      if (match) {
        technologies.push({
          name: match[1],
          description: match[2].trim()
        });
      }
    });
    
    return technologies;
  }

  isRelated(requirement, implementation) {
    const reqText = `${requirement.title} ${requirement.description}`.toLowerCase();
    const implText = `${implementation.title} ${implementation.description || ''}`.toLowerCase();
    
    const reqWords = reqText.split(/\s+/);
    const implWords = implText.split(/\s+/);
    
    const commonWords = reqWords.filter(word => 
      word.length > 3 && implWords.includes(word)
    );
    
    return commonWords.length >= 2;
  }

  calculateProgress(gaps) {
    const total = gaps.unimplemented.length + gaps.implemented.length + gaps.partiallyImplemented.length;
    if (total === 0) return 100;
    
    const implemented = gaps.implemented.length + (gaps.partiallyImplemented.length * 0.5);
    return Math.round((implemented / total) * 100);
  }

  calculatePhaseEstimate(features) {
    let totalDays = 0;
    features.forEach(feature => {
      const estimate = feature.estimate || '1d';
      const days = parseInt(estimate.replace('d', '')) || 1;
      totalDays += days;
    });
    return totalDays;
  }

  getPhaseDepenencies(features) {
    const deps = new Set();
    features.forEach(feature => {
      if (feature.dependencies) {
        feature.dependencies.forEach(dep => deps.add(dep));
      }
    });
    return Array.from(deps);
  }

  /**
   * 結果の出力
   */
  generateReport() {
    const report = {
      summary: {
        totalFeatures: this.analysisResult.totalFeatures,
        implemented: this.analysisResult.implemented.length,
        unimplemented: this.analysisResult.unimplemented.length,
        partiallyImplemented: this.analysisResult.partiallyImplemented.length,
        progress: this.analysisResult.implementationProgress
      },
      prioritizedFeatures: this.analysisResult.prioritizedFeatures?.slice(0, 10) || [],
      implementationPlan: this.analysisResult.implementationPlan,
      timestamp: new Date().toISOString()
    };

    return report;
  }
}

module.exports = RequirementsAnalyzer;

// CLI実行
if (require.main === module) {
  const analyzer = new RequirementsAnalyzer();
  
  analyzer.analyzeProject()
    .then(result => {
      const report = analyzer.generateReport();
      console.log('\n📊 Analysis Report:');
      console.log('==================');
      console.log(JSON.stringify(report, null, 2));
      
      // GitHub Actions用の出力
      if (process.env.GITHUB_ACTIONS) {
        console.log(`\nissues-matrix=${JSON.stringify(result.unimplemented)}`);
        console.log(`total-issues=${result.unimplemented.length}`);
      }
    })
    .catch(error => {
      console.error('❌ Analysis failed:', error.message);
      process.exit(1);
    });
}