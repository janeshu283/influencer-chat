'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAdmin } from '@/hooks/useAdmin'
import UserManagement from './UserManagement'
import ChatManagement from './ChatManagement'
import type { Profile, ChatRoom, Message, Tip } from '@/types/supabase'

type Stats = {
  totalUsers: number
  totalInfluencers: number
  totalChats: number
  totalMessages: number
  totalTips: number
  totalTipsAmount: number
}

export default function AdminDashboard() {
  const { isAdmin, loading: adminLoading } = useAdmin()
  const [stats, setStats] = useState<Stats | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'chats'>('overview')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAdmin || activeTab !== 'overview') return

    const fetchDashboardData = async () => {
      try {
        // 統計データの取得
        const [
          { count: usersCount },
          { count: influencersCount },
          { count: chatsCount },
          { count: messagesCount },
          { data: tipsData },
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('is_influencer', true),
          supabase.from('chat_rooms').select('*', { count: 'exact', head: true }),
          supabase.from('messages').select('*', { count: 'exact', head: true }),
          supabase.from('tips').select('amount'),
        ])

        const totalTipsAmount = (tipsData || []).reduce(
          (sum, tip) => sum + (tip.amount || 0),
          0
        )

        setStats({
          totalUsers: usersCount || 0,
          totalInfluencers: influencersCount || 0,
          totalChats: chatsCount || 0,
          totalMessages: messagesCount || 0,
          totalTips: tipsData?.length || 0,
          totalTipsAmount,
        })
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [isAdmin, activeTab])

  if (adminLoading || loading) {
    return <div className="p-4">Loading...</div>
  }

  if (!isAdmin) {
    return (
      <div className="p-4 text-red-500">
        You do not have permission to access this page.
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'overview'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'users'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('chats')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'chats'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Chats
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* 統計カード */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <StatCard
              title="Total Users"
              value={stats?.totalUsers || 0}
              subtext={`Including ${stats?.totalInfluencers || 0} influencers`}
            />
            <StatCard
              title="Total Chats"
              value={stats?.totalChats || 0}
              subtext={`${stats?.totalMessages || 0} messages sent`}
            />
            <StatCard
              title="Total Tips"
              value={stats?.totalTips || 0}
              subtext={`¥${stats?.totalTipsAmount.toLocaleString() || 0} total amount`}
            />
          </div>
        </>
      )}

      {activeTab === 'users' && <UserManagement />}
      {activeTab === 'chats' && <ChatManagement />}
    </div>
  )
}

function StatCard({
  title,
  value,
  subtext,
}: {
  title: string
  value: number
  subtext: string
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="text-sm font-medium text-gray-500">{title}</div>
      <div className="mt-2 text-3xl font-semibold text-gray-900">{value}</div>
      <div className="mt-2 text-sm text-gray-600">{subtext}</div>
    </div>
  )
}
