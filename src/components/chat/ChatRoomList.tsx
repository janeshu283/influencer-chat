import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import OnlineStatus from '@/components/common/OnlineStatus'
import type { ChatRoom, Profile } from '@/types/supabase'

interface ChatRoomListProps {
  currentUserId: string
  onSelectRoom: (roomId: string) => void
  selectedRoomId?: string
}

export default function ChatRoomList({
  currentUserId,
  onSelectRoom,
  selectedRoomId,
}: ChatRoomListProps) {
  const [rooms, setRooms] = useState<(ChatRoom & { influencer: Profile; user: Profile })[]>([])
  const [loading, setLoading] = useState(true)
  const [isInfluencer, setIsInfluencer] = useState(false)
  // Using the imported supabase instance

  useEffect(() => {
    const loadRooms = async () => {
      // まずユーザープロファイルを取得
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('is_influencer')
        .eq('id', currentUserId)
        .single()

      setIsInfluencer(userProfile?.is_influencer || false)

      let query = supabase
        .from('chat_rooms')
        .select(`
          *,
          user:profiles!chat_rooms_user_id_fkey (id, nickname, profile_image_url, is_influencer),
          influencer:profiles!chat_rooms_influencer_id_fkey (id, nickname, profile_image_url, is_influencer)
        `)

      if (userProfile?.is_influencer) {
        // インフルエンサーの場合、自分が参加しているルームを取得
        query = query.eq('influencer_id', currentUserId)
      } else {
        // 一般ユーザーの場合、自分が参加しているルームを取得
        query = query.eq('user_id', currentUserId)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading chat rooms:', error)
        return
      }

      console.log('Loaded rooms:', data)
      console.log('Is influencer:', userProfile?.is_influencer)

      setRooms(data || [])
      setLoading(false)
    }

    loadRooms()

    // リアルタイムサブスクリプション
    const subscription = supabase
      .channel('chat_rooms')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_rooms',
        },
        loadRooms
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [currentUserId])

  if (loading) {
    return <div className="p-4">Loading...</div>
  }

  return (
    <div className="divide-y">
      {rooms.length === 0 ? (
        <div className="p-4 text-gray-500 text-center">
          トークがありません
        </div>
      ) : (
        rooms.map((room) => (
          <button
            key={room.id}
            onClick={() => onSelectRoom(room.id)}
            className={`w-full p-4 text-left hover:bg-pink-50 ${
              selectedRoomId === room.id ? 'bg-pink-100' : ''
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-100">
                <img
                  src={isInfluencer ? room.user.profile_image_url : room.influencer.profile_image_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">
                  <>
                    {isInfluencer
                      ? (room.user.nickname || '一般ユーザー')
                      : (room.influencer.nickname || 'インフルエンサー')
                    }
                    {process.env.NODE_ENV === 'development' && ` (ID: ${isInfluencer ? room.user_id : room.influencer_id})`}
                  </>
                </div>
                <OnlineStatus
                  userId={isInfluencer ? room.user_id : room.influencer_id}
                  className="mt-1"
                />
                <div className="text-sm text-gray-500 truncate">
                  {room.last_message || 'メッセージなし'}
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(room.last_message_time || room.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          </button>
        ))
      )}

    </div>
  )
}
