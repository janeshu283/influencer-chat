import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { OnlineStatus as OnlineStatusType } from '@/types/supabase'

interface OnlineStatusProps {
  userId: string
  className?: string
}

export default function OnlineStatus({ userId, className = '' }: OnlineStatusProps) {
  const [status, setStatus] = useState<OnlineStatusType | null>(null)
  // Using the imported supabase instance

  useEffect(() => {
    // 初期ステータスを取得
    const fetchStatus = async () => {
      const { data, error } = await supabase
        .from('online_status')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (!error && data) {
        setStatus(data)
      }
    }

    fetchStatus()

    // リアルタイム更新をサブスクライブ
    const subscription = supabase
      .channel(`online_status:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'online_status',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setStatus(payload.new as OnlineStatusType)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userId])

  if (!status) return null

  const getStatusText = () => {
    if (status.is_online) return 'Online'
    
    const lastSeen = new Date(status.last_seen)
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / 1000 / 60)
    
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div
        className={`w-2.5 h-2.5 rounded-full ${
          status.is_online ? 'bg-green-500' : 'bg-gray-400'
        }`}
      />
      <span className="text-sm text-gray-600">{getStatusText()}</span>
    </div>
  )
}
