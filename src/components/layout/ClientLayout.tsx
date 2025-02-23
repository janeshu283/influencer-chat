'use client'

import { usePathname } from 'next/navigation'
import { AuthProvider } from '@/contexts/AuthContext'
import AuthGuard from '@/components/auth/AuthGuard'
import Navbar from '@/components/common/Navbar'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isPublicRoute = [
    '/',
    '/auth',
    '/auth/signup',
    '/auth/verify',
  ].some(route => pathname?.includes(route))

  return (
    <AuthProvider>
      {isPublicRoute ? (
        <div className="min-h-screen bg-white">
          <Navbar />
          {children}
        </div>
      ) : (
        <AuthGuard>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="py-10">
              <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                {children}
              </div>
            </div>
          </div>
        </AuthGuard>
      )}
    </AuthProvider>
  )
}
