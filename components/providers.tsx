'use client'

import { Provider } from 'jotai'
import { SessionProvider } from 'next-auth/react'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Provider>
        {children}
      </Provider>
    </SessionProvider>
  )
}