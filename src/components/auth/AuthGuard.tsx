'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

const publicPaths = ['/auth', '/auth/signup', '/auth/verify']

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading) {
      // セッションがない場合は認証が必要なページからリダイレクト
      if (!session && !publicPaths.includes(pathname)) {
        router.push('/auth')
      }
      // セッションがある場合は認証ページからリダイレクト
      if (session && publicPaths.includes(pathname)) {
        router.push('/chat')
      }
    }
  }, [session, loading, pathname, router])

  // ローディング中は何も表示しない
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return <>{children}</>
}
