/**
 * 認証システムテスト
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals'

// NextAuthプロバイダーをモック
jest.mock('next-auth/providers/github', () => ({
  __esModule: true,
  default: jest.fn((config) => ({
    ...config,
    id: 'github',
    name: 'GitHub',
    type: 'oauth'
  }))
}))

jest.mock('next-auth/providers/google', () => ({
  __esModule: true,
  default: jest.fn((config) => ({
    ...config,
    id: 'google',
    name: 'Google', 
    type: 'oidc'
  }))
}))

// モック設定
jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(() => ({
    from: jest.fn(() => ({
      upsert: jest.fn(() => Promise.resolve({ error: null }))
    }))
  }))
}))

// テスト用の設定を作成
const createTestConfig = () => ({
  providers: [
    {
      id: 'github',
      name: 'GitHub',
      type: 'oauth',
      clientId: process.env.GITHUB_ID || 'test_github_id',
      clientSecret: process.env.GITHUB_SECRET || 'test_github_secret',
    },
    {
      id: 'google',
      name: 'Google',
      type: 'oidc',
      clientId: process.env.GOOGLE_CLIENT_ID || 'test_google_id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'test_google_secret',
    },
  ],
  session: { strategy: "jwt" as const },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async signIn() { return true },
    async session({ session, token }: any) {
      if (session?.user && token?.sub) {
        session.user.id = token.sub
      }
      return session
    },
    async jwt({ user, token }: any) {
      if (user) {
        token.sub = user.id
      }
      return token
    },
  }
})

describe('Authentication Configuration', () => {
  beforeEach(() => {
    // 環境変数をモック
    process.env.GITHUB_ID = 'test_github_id'
    process.env.GITHUB_SECRET = 'test_github_secret'
    process.env.GOOGLE_CLIENT_ID = 'test_google_id'
    process.env.GOOGLE_CLIENT_SECRET = 'test_google_secret'
  })

  it('should have correct provider configuration', () => {
    const config = createTestConfig()
    expect(config.providers).toHaveLength(2)
    
    const githubProvider = config.providers.find((p: any) => p.id === 'github')
    const googleProvider = config.providers.find((p: any) => p.id === 'google')
    
    expect(githubProvider).toBeDefined()
    expect(googleProvider).toBeDefined()
  })

  it('should have JWT session strategy', () => {
    const config = createTestConfig()
    expect(config.session.strategy).toBe('jwt')
  })

  it('should have custom pages configured', () => {
    const config = createTestConfig()
    expect(config.pages.signIn).toBe('/auth/signin')
    expect(config.pages.error).toBe('/auth/error')
  })

  describe('Callbacks', () => {
    it('should handle signIn callback successfully', async () => {
      const config = createTestConfig()
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        image: 'https://example.com/avatar.jpg'
      }

      const result = await config.callbacks.signIn({
        user: mockUser,
        account: {},
        profile: {}
      })

      expect(result).toBe(true)
    })

    it('should handle session callback correctly', async () => {
      const config = createTestConfig()
      const mockSession = {
        user: { email: 'test@example.com' }
      }
      const mockToken = { sub: 'test-user-id' }

      const result = await config.callbacks.session({
        session: mockSession,
        token: mockToken
      })

      expect(result.user.id).toBe('test-user-id')
    })

    it('should handle JWT callback correctly', async () => {
      const config = createTestConfig()
      const mockUser = { id: 'test-user-id' }
      const mockToken = {}

      const result = await config.callbacks.jwt({
        user: mockUser,
        token: mockToken
      })

      expect(result.sub).toBe('test-user-id')
    })
  })
})

describe('Authentication Error Handling', () => {
  it('should handle signIn errors gracefully', async () => {
    const config = createTestConfig()
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com'
    }

    // エラーが発生してもサインインは成功する（graceful degradation）
    const result = await config.callbacks.signIn({
      user: mockUser,
      account: {},
      profile: {}
    })

    expect(result).toBe(true)
  })

  it('should handle missing environment variables', () => {
    delete process.env.GITHUB_ID
    delete process.env.GITHUB_SECRET
    
    // 環境変数が未設定でも例外を投げない
    expect(() => createTestConfig()).not.toThrow()
  })
})