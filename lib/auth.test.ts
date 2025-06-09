/**
 * 認証システムテスト
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { authOptions } from './auth'

// モック設定
jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(() => ({
    from: jest.fn(() => ({
      upsert: jest.fn(() => Promise.resolve({ error: null }))
    }))
  }))
}))

describe('Authentication Configuration', () => {
  beforeEach(() => {
    // 環境変数をモック
    process.env.GITHUB_ID = 'test_github_id'
    process.env.GITHUB_SECRET = 'test_github_secret'
    process.env.GOOGLE_CLIENT_ID = 'test_google_id'
    process.env.GOOGLE_CLIENT_SECRET = 'test_google_secret'
  })

  it('should have correct provider configuration', () => {
    expect(authOptions.providers).toHaveLength(2)
    
    const githubProvider = authOptions.providers.find((p: any) => p.id === 'github')
    const googleProvider = authOptions.providers.find((p: any) => p.id === 'google')
    
    expect(githubProvider).toBeDefined()
    expect(googleProvider).toBeDefined()
  })

  it('should have JWT session strategy', () => {
    expect(authOptions.session.strategy).toBe('jwt')
  })

  it('should have custom pages configured', () => {
    expect(authOptions.pages.signIn).toBe('/auth/signin')
    expect(authOptions.pages.error).toBe('/auth/error')
  })

  describe('Callbacks', () => {
    it('should handle signIn callback successfully', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        image: 'https://example.com/avatar.jpg'
      }

      const result = await authOptions.callbacks.signIn({
        user: mockUser,
        account: {},
        profile: {}
      })

      expect(result).toBe(true)
    })

    it('should handle session callback correctly', async () => {
      const mockSession = {
        user: { email: 'test@example.com' }
      }
      const mockToken = { sub: 'test-user-id' }

      const result = await authOptions.callbacks.session({
        session: mockSession,
        token: mockToken
      })

      expect(result.user.id).toBe('test-user-id')
    })

    it('should handle JWT callback correctly', async () => {
      const mockUser = { id: 'test-user-id' }
      const mockToken = {}

      const result = await authOptions.callbacks.jwt({
        user: mockUser,
        token: mockToken
      })

      expect(result.sub).toBe('test-user-id')
    })
  })
})

describe('Authentication Error Handling', () => {
  it('should handle signIn errors gracefully', async () => {
    // Supabaseエラーをモック
    const mockSupabase = {
      from: jest.fn(() => ({
        upsert: jest.fn(() => Promise.resolve({ error: new Error('Database error') }))
      }))
    }

    jest.doMock('@/lib/supabase/server', () => ({
      createServerSupabaseClient: () => mockSupabase
    }))

    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com'
    }

    // エラーが発生してもサインインは成功する（graceful degradation）
    const result = await authOptions.callbacks.signIn({
      user: mockUser,
      account: {},
      profile: {}
    })

    expect(result).toBe(true)
  })
})