import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { SuperChat, Profile } from '@/types/supabase'

export default function SuperChatList({ roomId }: { roomId: string }) {
  const [superChats, setSuperChats] = useState<SuperChat[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const loadSuperChats = async () => {
    const { data, error } = await supabase
      .from('super_chats')
      .select(`
        *,
        user:profiles(id, username, avatar_url),
        influencer:profiles(id, username, avatar_url)
      `)
      .eq('room_id', roomId) // もし room_id を管理する場合
      .order('created_at', { ascending: true })
    if (error) {
      console.error('Error loading super chats:', error)
      return
    }
    setSuperChats(data || [])
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    loadSuperChats()
    // 必要に応じてリアルタイムサブスクリプションを追加する
  }, [roomId])

  return (
    <div>
      {superChats.map(chat => (
        <div key={chat.id} className="p-2 my-2 border rounded">
          <div className="font-bold">
            {chat.user?.username} → {chat.influencer_id?.user}
          </div>
          <div>
            {chat.amount}円 : {chat.message}
          </div>
          <div className="text-xs text-gray-500">
            {new Date(chat.created_at).toLocaleString()}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  )
}