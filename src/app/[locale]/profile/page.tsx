import { Suspense } from 'react'
import ProfileForm from '@/components/profile/ProfileForm'

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<div>Loading...</div>}>
          <ProfileForm />
        </Suspense>
      </div>
    </div>
  )
}
