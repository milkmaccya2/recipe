'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

export function Header() {
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
            <Link 
              href="/favorites" 
              className={cn(
                "text-gray-600 hover:text-gray-900 transition-colors",
                "border-b-2 border-transparent hover:border-orange-500"
              )}
            >
              お気に入り
            </Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors">
              ログイン
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}