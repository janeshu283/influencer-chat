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
    const supabase = createMiddlewareClient({ req, res })
    const { data: { session } } = await supabase.auth.getSession()

    const pathname = req.nextUrl.pathname

    // 認証が必要なルートへのアクセスをチェック
    if (!session && protectedRoutes.some(route => pathname.startsWith(route))) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/auth'
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // 認証済みユーザーの認証ページへのアクセスをチェック
    if (session && authRoutes.some(route => pathname.startsWith(route))) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/chat'
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
    // Skip all internal paths (_next)
    '/((?!_next).*)',
    // Auth and protected routes
    '/auth/:path*',
    '/chat/:path*',
    '/profile/:path*',
    '/admin/:path*'
  ]
}
