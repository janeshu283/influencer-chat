'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FaHome, FaComments, FaUser } from 'react-icons/fa'
import { useAuth } from '@/contexts/AuthContext'

export default function BottomNav() {
  const { user, loading } = useAuth()
  const pathname = usePathname()

  // ローディング中またはユーザーがない場合は表示しない
  if (loading || !user) return null

  const isActive = (path: string) => {
    return pathname?.startsWith(path)
      ? 'text-pink-600'
      : 'text-gray-500 hover:text-pink-400 transition-colors duration-200'
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe-area-inset-bottom shadow-lg">
      <div className="max-w-md mx-auto px-4">
        <div className="flex justify-around py-3">
          <Link
            href="/influencers"
            className="flex flex-col items-center w-20 relative group"
          >
            <div className={`absolute inset-0 bg-pink-50 scale-0 group-hover:scale-100 transition-transform duration-200 rounded-lg ${pathname?.startsWith('/influencers') ? 'scale-100' : ''}`} />
            <FaHome className={`text-xl relative ${isActive('/influencers')}`} />
            <span className={`mt-1 text-xs relative ${isActive('/influencers')}`}>ホーム</span>
          </Link>

          <Link
            href="/chat"
            className="flex flex-col items-center w-20 relative group"
          >
            <div className={`absolute inset-0 bg-pink-50 scale-0 group-hover:scale-100 transition-transform duration-200 rounded-lg ${pathname?.startsWith('/chat') ? 'scale-100' : ''}`} />
            <FaComments className={`text-xl relative ${isActive('/chat')}`} />
            <span className={`mt-1 text-xs relative ${isActive('/chat')}`}>トーク</span>
          </Link>

          <Link
            href="/profile"
            className="flex flex-col items-center w-20 relative group"
          >
            <div className={`absolute inset-0 bg-pink-50 scale-0 group-hover:scale-100 transition-transform duration-200 rounded-lg ${pathname?.startsWith('/profile') ? 'scale-100' : ''}`} />
            <FaUser className={`text-xl relative ${isActive('/profile')}`} />
            <span className={`mt-1 text-xs relative ${isActive('/profile')}`}>マイページ</span>
          </Link>
        </div>
      </div>
    </nav>
  )
}
