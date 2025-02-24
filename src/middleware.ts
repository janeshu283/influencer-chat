import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 認証が必要なパス
const protectedRoutes = ['/chat', '/profile', '/admin']

// 認証済みユーザーがアクセスできないパス
const authRoutes = ['/auth', '/auth/signup', '/auth/verify']

export async function middleware(req: NextRequest) {

  const res = NextResponse.next()

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            res.cookies.set({
              name,
              value,
              ...options,
              path: '/',
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production'
            })
          },
          remove(name: string, options: any) {
            res.cookies.delete({
              name,
              ...options,
              path: '/',
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production'
            })
          },
        },
      }
    )

    if (!supabase) {
      throw new Error('Failed to initialize Supabase client')
    }
    const { data: { session }, error } = await supabase.auth.getSession()

    const currentPath = req.nextUrl.pathname
    console.log('[Middleware] Path:', currentPath, 'Session exists:', !!session)

    // 除外パスチェック
    const excludedPaths = ['/auth/callback', '/api/']
    if (excludedPaths.some(path => currentPath.startsWith(path))) {
      return res
    }

    // 未認証ユーザーが保護ルートにアクセス
    if (!session && protectedRoutes.some(route => currentPath.startsWith(route))) {
      console.log('Redirecting unauthenticated user to /auth')
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/auth'
      redirectUrl.searchParams.set('redirect', currentPath)
      return NextResponse.redirect(redirectUrl)
    }

    // 認証済みユーザーが認証ルートにアクセス
    if (session && authRoutes.some(route => currentPath.startsWith(route))) {
      console.log('Redirecting authenticated user to /chat')
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/chat'
      return NextResponse.redirect(redirectUrl)
    }

    if (error) {
      console.error('Failed to get session:', error)
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/auth'
      return NextResponse.redirect(redirectUrl)
    }

    return res
  } catch (error) {
    console.error('Error in middleware:', error)

    // エラーが発生した場合は認証ページにリダイレクト
    if (protectedRoutes.some(route => req.nextUrl.pathname.startsWith(route))) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/auth'
      return NextResponse.redirect(redirectUrl)
    }

    return res
  }
}

export const config = {
  matcher: [
    '/chat/:path*',
    '/profile/:path*',
    '/admin/:path*',
    '/auth/:path*'
  ]
}
