'use client'

import { useState } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import Link from 'next/link'
import { ChevronDown, User, Heart, Clock, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Header() {
  const { data: session, status } = useSession()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
    setIsDropdownOpen(false)
  }

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            🍽️ Recipe AI
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              href="/" 
              className={cn(
                "text-gray-600 hover:text-gray-900 transition-colors",
                "border-b-2 border-transparent hover:border-orange-500"
              )}
            >
              ホーム
            </Link>
            <Link 
              href="/recipes" 
              className={cn(
                "text-gray-600 hover:text-gray-900 transition-colors",
                "border-b-2 border-transparent hover:border-orange-500"
              )}
            >
              レシピ
            </Link>
            {session && (
              <Link 
                href="/favorites" 
                className={cn(
                  "text-gray-600 hover:text-gray-900 transition-colors",
                  "border-b-2 border-transparent hover:border-orange-500"
                )}
              >
                お気に入り
              </Link>
            )}
          </nav>
          
          <div className="flex items-center space-x-4">
            {status === 'loading' ? (
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            ) : session ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user?.name || ''}
                      className="w-8 h-8 rounded-full border-2 border-orange-200"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-orange-600" />
                    </div>
                  )}
                  <span className="hidden sm:inline font-medium">
                    {session.user?.name?.split(' ')[0] || 'ユーザー'}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {isDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10"
                      onClick={() => setIsDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">
                          {session.user?.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {session.user?.email}
                        </p>
                      </div>
                      
                      <Link
                        href="/profile"
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        <span>プロフィール</span>
                      </Link>
                      
                      <Link
                        href="/favorites"
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <Heart className="w-4 h-4" />
                        <span>お気に入り</span>
                      </Link>
                      
                      <Link
                        href="/history"
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <Clock className="w-4 h-4" />
                        <span>履歴</span>
                      </Link>
                      
                      <div className="border-t border-gray-100 mt-1">
                        <button
                          onClick={handleSignOut}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>ログアウト</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => signIn()}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                ログイン
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}