/**
 * 認証ミドルウェア
 * 保護されたルートへのアクセス制御
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'

const protectedRoutes = [
  '/dashboard',
  '/recipes',
  '/favorites',
  '/history',
  '/profile',
]

const authRoutes = [
  '/auth/signin',
  '/auth/signup',
  '/auth/error',
]

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  // API routes are handled by individual route handlers
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Allow public routes
  if (pathname === '/' || pathname.startsWith('/public/')) {
    return NextResponse.next()
  }

  // Handle auth routes
  if (authRoutes.some(route => pathname.startsWith(route))) {
    // Redirect logged-in users away from auth pages
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  // Handle protected routes
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    // Redirect unauthenticated users to signin
    if (!isLoggedIn) {
      const callbackUrl = encodeURIComponent(pathname)
      return NextResponse.redirect(
        new URL(`/auth/signin?callbackUrl=${callbackUrl}`, req.url)
      )
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}