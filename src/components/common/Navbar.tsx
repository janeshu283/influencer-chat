'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useAdmin } from '@/hooks/useAdmin'

export default function Navbar() {
  const { user, signOut, loading } = useAuth()
  const pathname = usePathname()
  const { isAdmin } = useAdmin()

  // ローディング中は簡易表示
  if (loading) {
    return (
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <span className="text-pink-600 font-bold text-xl">GifTalk</span>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  // ヘルパー関数: 指定のパスが現在のパスと一致するかどうかを判定
  const isActive = (path: string) => {
    return pathname?.startsWith(path)
      ? 'bg-pink-600 text-white'
      : 'text-gray-600 hover:bg-pink-100 hover:text-pink-600'
  }

  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50" suppressHydrationWarning={true}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href={user ? '/influencers' : '/'} className="text-pink-600 font-bold text-xl">
              GifTalk
            </Link>
            {user && isAdmin && (
              <div className="hidden md:block ml-10">
                <div className="flex items-baseline space-x-4">
                  <Link
                    href="/admin"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/admin')}`}
                  >
                    管理画面
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">{user?.user_metadata?.nickname}</span>
                <button
                  onClick={signOut}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-pink-600 hover:bg-pink-100"
                >
                  ログアウト
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-full text-white bg-pink-600 hover:bg-pink-700"
              >
                ログイン
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}