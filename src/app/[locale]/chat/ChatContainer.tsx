'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import ChatRoom from '@/components/chat/ChatRoom'
import ChatRoomList from '@/components/chat/ChatRoomList'
import InfluencerList from '@/components/chat/InfluencerList'
import OnlineStatus from '@/components/common/OnlineStatus'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/types/supabase'

export default function ChatContainer() {
  const [session, setSession] = useState<any>(null)
  const [selectedRoomId, setSelectedRoomId] = useState<string | undefined>(undefined)
  const [showInfluencers, setShowInfluencers] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Initial session:', session)
        if (!session) {
          router.push('/auth')
          return
        }
        setSession(session)
      } catch (error) {
        console.error('Error getting session:', error)
        router.push('/auth')
      }
    }

    getInitialSession()

    const {
      data: { subscription },
      error
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', session)
      setSession(session)
      if (!session) {
        router.push('/auth')
      }
    })

    if (error) {
      console.error('Error in auth state change:', error)
      router.push('/auth')
    }

    return () => subscription.unsubscribe()
  }, [router])

  const createChatRoom = async (influencer: Profile) => {
    if (!session) return

    setLoading(true)
    try {
      // 既存のチャットルームを確認
      const { data: existingRooms } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('influencer_id', influencer.id)

      if (existingRooms && existingRooms.length > 0) {
        // 既存のルームがある場合はそれを選択
        setSelectedRoomId(existingRooms[0].id)
      } else {
        // 新しいルームを作成
        const { data: newRoom, error } = await supabase
          .from('chat_rooms')
          .insert([{ influencer_id: influencer.id }])
          .select()
          .single()

        if (error) throw error

        if (newRoom) {
          setSelectedRoomId(newRoom.id)
        }
      }
    } catch (error) {
      console.error('Error creating chat room:', error)
    } finally {
      setLoading(false)
      setShowInfluencers(false)
    }
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">チャットを利用するにはログインが必要です</h2>
          <p className="text-gray-600">
            チャット機能を利用するには、ログインしてください。
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-200px)] bg-white rounded-lg shadow-sm overflow-hidden">
      {/* サイドバー: チャットルーム一覧 */}
      <div className="w-64 border-r bg-gray-50">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">チャットルーム</h2>
          <button
            onClick={() => setShowInfluencers(true)}
            className="mt-2 w-full px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            新規チャット
          </button>
        </div>
        <div className="overflow-y-auto h-[calc(100%-80px)]">
          <ChatRoomList
            currentUserId={session.user.id}
            onSelectRoom={(roomId) => {
              setSelectedRoomId(roomId)
              setShowInfluencers(false)
            }}
            selectedRoomId={selectedRoomId}
          />
        </div>
      </div>

      {/* メインコンテンツ: チャットルームまたはインフルエンサー一覧 */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">チャットルームを作成中...</div>
          </div>
        ) : showInfluencers ? (
          <div className="h-full flex flex-col">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">インフルエンサーを選択</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              <InfluencerList
                currentUserId={session.user.id}
                onSelectInfluencer={createChatRoom}
              />
            </div>
          </div>
        ) : selectedRoomId ? (
          <ChatRoom roomId={selectedRoomId} currentUserId={session.user.id} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            チャットルームを選択するか、新規チャットを開始してください
          </div>
        )}
      </div>
    </div>
  )
}
