'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface AuthFormProps {
  mode?: 'login' | 'signup'
}

export default function AuthForm({ mode = 'signup' }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Starting auth process...')
    setLoading(true)
    setError(null)

    try {
      if (mode === 'login') {
        // ログインモード
        console.log('Attempting to sign in...')
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          console.error('Sign in error:', error)
          setError(error.message)
          return
        }

        if (data?.user) {
          console.log('Sign in successful, redirecting...')
          router.push('/chat')
          return
        }
      } else {
        // サインアップモード
        console.log('Attempting sign up...')
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        })

        if (signUpError) {
          console.error('Sign up error:', signUpError)
          setError(signUpError.message)
          return
        }

        if (signUpData?.user) {
          console.log('Sign up successful, redirecting...')
          router.push('/chat')
          return
        }
      }


    } catch (error: any) {
      console.error('Unexpected error:', error)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
      console.log('Auth process completed')
    }
  }

  return (
    <form onSubmit={handleSignUp} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-900">
          メールアドレス
        </label>
        <div className="mt-1">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm text-gray-900"
            placeholder="メールアドレスを入力"
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-900">
          パスワード
        </label>
        <div className="mt-1">
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm text-gray-900"
            placeholder="パスワードを入力"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
        >
          {loading ? 'Loading...' : mode === 'login' ? 'ログイン' : 'アカウントを作成'}
        </button>
      </div>
    </form>
  )
}
