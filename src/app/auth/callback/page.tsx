'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function AuthCallback({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (!error && session) {
        const redirectPath = (searchParams?.redirect as string) || '/chat'
        router.push(redirectPath)
      } else {
        router.push('/auth?error=authentication_failed')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Verifying your email...</h2>
          <p className="mt-2 text-sm text-gray-600">Please wait while we confirm your email address.</p>
        </div>
      </div>
    </div>
  )
}
