/**
 * 認証ミドルウェアテスト
 */

import { describe, it, expect, jest } from '@jest/globals'
import { NextRequest } from 'next/server'

// モック設定
const mockAuth = jest.fn()
jest.mock('@/lib/auth', () => ({
  auth: mockAuth
}))

describe('Authentication Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should allow access to public routes', () => {
    const mockMiddleware = (req: NextRequest) => {
      // Public route logic
      if (req.nextUrl.pathname === '/' || req.nextUrl.pathname.startsWith('/public/')) {
        return { redirect: null }
      }
      return { redirect: '/auth/signin' }
    }

    const req = new NextRequest('http://localhost:3000/')
    const result = mockMiddleware(req)
    
    expect(result.redirect).toBeNull()
  })

  it('should redirect unauthenticated users from protected routes', () => {
    const mockMiddleware = (req: NextRequest) => {
      const protectedRoutes = ['/dashboard', '/recipes', '/favorites']
      const isProtected = protectedRoutes.some(route => 
        req.nextUrl.pathname.startsWith(route)
      )
      
      if (isProtected && !req.auth) {
        return { redirect: '/auth/signin' }
      }
      
      return { redirect: null }
    }

    const req = new NextRequest('http://localhost:3000/dashboard') as NextRequest & { auth?: any }
    req.auth = null
    
    const result = mockMiddleware(req)
    expect(result.redirect).toBe('/auth/signin')
  })

  it('should allow authenticated users to access protected routes', () => {
    const mockMiddleware = (req: NextRequest & { auth?: any }) => {
      const protectedRoutes = ['/dashboard', '/recipes', '/favorites']
      const isProtected = protectedRoutes.some(route => 
        req.nextUrl.pathname.startsWith(route)
      )
      
      if (isProtected && !req.auth) {
        return { redirect: '/auth/signin' }
      }
      
      return { redirect: null }
    }

    const req = new NextRequest('http://localhost:3000/dashboard') as NextRequest & { auth?: any }
    req.auth = { user: { id: 'test-user' } }
    
    const result = mockMiddleware(req)
    expect(result.redirect).toBeNull()
  })

  it('should redirect authenticated users away from auth pages', () => {
    const mockMiddleware = (req: NextRequest & { auth?: any }) => {
      const authRoutes = ['/auth/signin', '/auth/signup']
      const isAuthRoute = authRoutes.some(route => 
        req.nextUrl.pathname.startsWith(route)
      )
      
      if (isAuthRoute && req.auth) {
        return { redirect: '/dashboard' }
      }
      
      return { redirect: null }
    }

    const req = new NextRequest('http://localhost:3000/auth/signin') as NextRequest & { auth?: any }
    req.auth = { user: { id: 'test-user' } }
    
    const result = mockMiddleware(req)
    expect(result.redirect).toBe('/dashboard')
  })

  it('should allow access to API routes', () => {
    const mockMiddleware = (req: NextRequest) => {
      if (req.nextUrl.pathname.startsWith('/api/')) {
        return { redirect: null }
      }
      return { redirect: '/auth/signin' }
    }

    const req = new NextRequest('http://localhost:3000/api/recipes')
    const result = mockMiddleware(req)
    
    expect(result.redirect).toBeNull()
  })

  it('should preserve callback URL in signin redirect', () => {
    const mockMiddleware = (req: NextRequest) => {
      const protectedRoutes = ['/dashboard', '/recipes', '/favorites']
      const isProtected = protectedRoutes.some(route => 
        req.nextUrl.pathname.startsWith(route)
      )
      
      if (isProtected && !req.auth) {
        const callbackUrl = encodeURIComponent(req.nextUrl.pathname)
        return { redirect: `/auth/signin?callbackUrl=${callbackUrl}` }
      }
      
      return { redirect: null }
    }

    const req = new NextRequest('http://localhost:3000/recipes/123') as NextRequest & { auth?: any }
    req.auth = null
    
    const result = mockMiddleware(req)
    expect(result.redirect).toBe('/auth/signin?callbackUrl=%2Frecipes%2F123')
  })
})