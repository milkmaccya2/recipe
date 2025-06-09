/**
 * NextAuth.js認証設定
 */

import NextAuth, { type NextAuthConfig } from "next-auth"
import GitHubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"
import type { Account, Profile, User } from "next-auth"
import type { AdapterUser } from "@auth/core/adapters"
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const authOptions: NextAuthConfig = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID || '',
      clientSecret: process.env.GITHUB_SECRET || '',
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }: { 
      user: User | AdapterUser; 
      account: Account | null; 
      profile?: Profile 
    }) {
      // ユーザー情報をSupabaseに保存
      if (user.email) {
        try {
          const supabase = createServerSupabaseClient()
          
          // プロファイルの作成または更新
          const { error } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              email: user.email,
              name: user.name || '',
              avatar_url: user.image || '',
            })
            
          if (error) {
            console.error('Error saving user profile:', error)
          }
        } catch (error) {
          console.error('Error in signIn callback:', error)
        }
      }
      return true
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session?.user && token?.sub) {
        session.user.id = token.sub
      }
      return session
    },
    async jwt({ user, token }: { user?: User; token: any }) {
      if (user) {
        token.sub = user.id
      }
      return token
    },
  },
  session: {
    strategy: "jwt" as const,
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions)