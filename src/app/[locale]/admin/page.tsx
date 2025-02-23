import { Suspense } from 'react'
import AdminDashboard from '@/components/admin/Dashboard'

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Suspense fallback={<div>Loading...</div>}>
        <AdminDashboard />
      </Suspense>
    </div>
  )
}
