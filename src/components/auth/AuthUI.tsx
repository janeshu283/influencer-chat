'use client'

import { useState } from 'react'
import SignInForm from './SignInForm'
import SignUpForm from './SignUpForm'

export default function AuthUI() {
  const [isSignUp, setIsSignUp] = useState(false)

  return (
    <div className="flex flex-col justify-center py-12">
      <div className="mx-auto w-full max-w-md">
        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          {isSignUp ? 'アカウント作成' : 'ログイン'}
        </h2>
      </div>

      <div className="mt-10 mx-auto w-full max-w-md">
        <div className="bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12">
          {isSignUp ? <SignUpForm /> : <SignInForm />}
          
          <div className="mt-10">
            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm font-medium leading-6">
                <span className="bg-white px-6 text-gray-900">
                  または
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="mt-6 w-full text-center text-sm text-blue-600 hover:text-blue-500"
            >
              {isSignUp ? 'すでにアカウントをお持ちの方' : 'アカウントをお持ちでない方'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
