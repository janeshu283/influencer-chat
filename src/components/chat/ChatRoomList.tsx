import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { ChatRoom } from '@/types/supabase'

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
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const loadRooms = async () => {
      // ここでは、チャットルームテーブルに加えて、
      // profilesテーブルから user と influencer の情報を取得する
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          id,
          user_id,
          influencer_id,
          last_message,
          last_message_time,
          user:profiles!chat_rooms_user_id_fkey(*),
          influencer:profiles!chat_rooms_influencer_id_fkey(*)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading chat rooms:', error)
      } else if (data) {
        setRooms(data)
      }
      setLoading(false)
    }

    loadRooms()
  }, [currentUserId])

  const filteredRooms = rooms.filter(room => {
    // 例として、一般ユーザーの場合は相手（influencer）のニックネームでフィルターする
    const partnerName = room.influencer?.username ?? ''
    return partnerName.toLowerCase().includes(searchTerm.toLowerCase())
  })

  if (loading) {
    return <div className="p-4">Loading...</div>
  }

  return (
    <div>
      <div className="p-4 border-b">
        <input
          type="text"
          placeholder="検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
      </div>
      {filteredRooms.length === 0 ? (
        <div className="p-4 text-gray-500 text-center">トークがありません</div>
      ) : (
        filteredRooms.map(room => (
          <button
            key={room.id}
            onClick={() => onSelectRoom(room.id)}
            className={`w-full p-4 text-left hover:bg-pink-50 ${selectedRoomId === room.id ? 'bg-pink-100' : ''}`}
          >
            <div className="flex items-center space-x-3">
              {/* 例えば、相手（influencer）のプロフィール画像を表示 */}
              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-100">
                {room.influencer?.avatar_url && (
                  <img
                    src={room.influencer.avatar_url}
                    alt={room.influencer.username || 'Profile'}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">
                  {room.influencer?.username || 'インフルエンサー'}
                </div>
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