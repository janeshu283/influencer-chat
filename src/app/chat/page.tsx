'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

interface Profile {
  id: string
  nickname: string
  profile_image_url: string
  is_influencer: boolean
}

interface ChatRoom {
  id: string
  user_id: string
  influencer_id: string
  last_message: string
  last_message_time: string
  user: Profile
  influencer: Profile
  created_at: string
}

export default function ChatPage() {
  const { user } = useAuth()
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  useEffect(() => {
    if (!user && !loading) {
      router.push('/auth/login')
      return
    }

    const fetchChatRooms = async () => {
      if (!user?.id) {
        console.log('No user ID available')
        return
      }

      try {
        console.log('Fetching chat rooms for user:', user.id)

        // まずプロフィールを取得
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Error fetching profile:', profileError)
          return
        }

        if (!profile) {
          console.error('No profile found for user:', user.id)
          return
        }

        setProfile(profile)

        console.log('User profile:', profile)

        // まずチャットルームのベース情報を取得
        const baseQuery = supabase
          .from('chat_rooms')
          .select('id, user_id, influencer_id, last_message, last_message_time, created_at')

        // インフルエンサーの場合と一般ユーザーの場合でクエリを分ける
        const query = profile.is_influencer
          ? baseQuery.eq('influencer_id', user.id)
          : baseQuery.eq('user_id', user.id)

        const { data: rooms, error: roomsError } = await query

        if (roomsError) {
          console.error('Error fetching base rooms:', roomsError)
          return
        }

        console.log('Base rooms:', rooms)

        if (!rooms || rooms.length === 0) {
          console.log('No chat rooms found')
          setChatRooms([])
          return
        }

        // 各チャットルームのユーザー情報を取得
        const enrichedRooms = await Promise.all(
          rooms.map(async (room) => {
            const userId = profile.is_influencer ? room.user_id : room.influencer_id
            const { data: otherUser, error: userError } = await supabase
              .from('profiles')
              .select('id, nickname, profile_image_url')
              .eq('id', userId)
              .single()

            if (userError) {
              console.error('Error fetching user profile:', userError)
              return null
            }

            return {
              ...room,
              user: profile.is_influencer ? otherUser : profile,
              influencer: profile.is_influencer ? profile : otherUser
            }
          })
        )

        const validRooms = enrichedRooms.filter(room => room !== null)
        console.log('Enriched rooms:', validRooms)
        setChatRooms(validRooms)
      } catch (error) {
        console.error('Error fetching chat rooms:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchChatRooms()

      // チャットルームのリアルタイムサブスクリプション
      const roomSubscription = supabase
        .channel('chat_rooms')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'chat_rooms',
          },
          async (payload) => {
            console.log('Chat room change received:', payload)
            fetchChatRooms()
          }
        )
        .subscribe()

      // メッセージのリアルタイムサブスクリプション
      const messageSubscription = supabase
        .channel('messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
          },
          async (payload) => {
            console.log('New message received:', payload)
            fetchChatRooms()
          }
        )
        .subscribe()

      return () => {
        roomSubscription.unsubscribe()
        messageSubscription.unsubscribe()
      }
    }
  }, [user])

  const filteredRooms = chatRooms.filter(room =>
    room.user.nickname.includes(searchQuery) || room.influencer.nickname.includes(searchQuery)
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 mt-16">
      <div className="p-4 border-b">
        <h2 className="text-lg font-bold mb-2">トーク一覧</h2>
        <input
          type="text"
          placeholder="名前で検索"
          className="w-full px-3 py-2 border rounded-md text-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="overflow-y-auto h-[calc(100vh-160px)]">
        {filteredRooms.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">まだトークがありません</p>
          </div>
        ) : (
          filteredRooms.map((room) => (
            <button
              key={room.id}
              onClick={() => router.push(`/chat/${room.id}`)}
              className="w-full flex items-center space-x-4 p-4 bg-white rounded-lg border border-gray-200 hover:border-pink-200 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex-shrink-0 w-12 h-12 relative rounded-full overflow-hidden bg-gray-100">
                {profile?.is_influencer ? (
                  room.user.profile_image_url && (
                    <img
                      src={room.user.profile_image_url}
                      alt={room.user.nickname}
                      className="object-cover w-full h-full"
                    />
                  )
                ) : (
                  room.influencer.profile_image_url && (
                    <img
                      src={room.influencer.profile_image_url}
                      alt={room.influencer.nickname}
                      className="object-cover w-full h-full"
                    />
                  )
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {profile?.is_influencer
                    ? (room.user.nickname || '一般ユーザー')
                    : (room.influencer.nickname || 'インフルエンサー')
                  }
                </p>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-sm text-gray-500 truncate flex-1">
                    {room.last_message || 'メッセージはありません'}
                  </p>
                  <p className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                    {new Date(room.last_message_time || room.created_at).toLocaleString('ja-JP', {
                      month: 'numeric',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
