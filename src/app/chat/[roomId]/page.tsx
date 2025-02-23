'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import SuperChat from '@/components/chat/SuperChat'

interface Message {
  id: string
  content: string
  created_at: string
  sender_id: string
}

interface Profile {
  id: string
  nickname: string
  profile_image_url: string
  is_influencer: boolean
}

export default function ChatRoomPage() {
  const { roomId } = useParams()
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [profile, setProfile] = useState<Profile | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          sender_id
        `)
        .eq('chat_room_id', roomId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching messages:', error)
        return
      }

      setMessages(data || [])
      scrollToBottom()
    }

    const fetchProfile = async () => {
      if (!user) return

      try {
        // チャットルームの情報を取得して、インフルエンサーのIDを特定
        const { data: roomData, error: roomError } = await supabase
          .from('chat_rooms')
          .select('influencer_id')
          .eq('id', roomId)
          .single()

        if (roomError) {
          console.error('Error fetching chat room:', roomError)
          return
        }

        // インフルエンサーのプロフィールを取得
        const { data: influencerData, error: influencerError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', roomData.influencer_id)
          .single()

        if (influencerError) {
          console.error('Error fetching influencer profile:', influencerError)
          return
        }

        if (influencerData) {
          setProfile(influencerData)
        }

      } catch (error) {
        console.error('Error in fetchProfile:', error)
      }
    }

    fetchMessages()
    fetchProfile()

    // メッセージのリアルタイムサブスクリプション
    const messageSubscription = supabase
      .channel(`messages:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_room_id=eq.${roomId}`,
        },
        (payload) => {
          console.log('Message change received:', payload)
          // 自分が送信したメッセージはすでに表示されているので、
          // 相手からのメッセージのみを追加
          if (payload.new.sender_id !== user?.id) {
            setMessages(messages => [...messages, payload.new as Message])
            scrollToBottom()
          }
        }
      )
      .subscribe()

    return () => {
      messageSubscription.unsubscribe()
    }
  }, [roomId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user) return

    try {
      // ユーザーのプロフィールを取得
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Error fetching user profile:', profileError)
        return
      }

      if (!userProfile) {
        console.error('No profile found for user:', user.id)
        return
      }

      console.log('Sending message as:', userProfile.id)

      // メッセージを送信して、送信したメッセージのデータを取得
      const { data: newMessageData, error: messageError } = await supabase
        .from('messages')
        .insert([
          {
            chat_room_id: roomId,
            content: newMessage,
            sender_id: userProfile.id,
          },
        ])
        .select()
        .single()

      if (messageError) {
        console.error('Error inserting message:', messageError)
        throw messageError
      }

      // メッセージを即座に表示
      if (newMessageData) {
        setMessages(currentMessages => [...currentMessages, newMessageData as Message])
        scrollToBottom()
      }

      // 最後のメッセージを更新
      const { error: updateError } = await supabase
        .from('chat_rooms')
        .update({
          last_message: newMessage,
          last_message_time: new Date().toISOString(),
        })
        .eq('id', roomId)

      if (updateError) {
        console.error('Error updating chat room:', updateError)
      }

      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  return (
    <div className="flex flex-col h-screen relative">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center space-x-3">
          {profile?.profile_image_url && (
            <div className="w-10 h-10 rounded-full overflow-hidden">
              <img
                src={profile.profile_image_url}
                alt={profile.nickname}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="font-medium text-gray-900">{profile?.nickname}</div>
        </div>
      </div>

      {/* スーパーチャット */}
      {user && profile?.is_influencer && user.id !== profile.id && (
        <SuperChat
          influencerId={profile.id}
          influencerName={profile.nickname}
        />
      )}

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender_id === user?.id ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-xs sm:max-w-md px-4 py-2 rounded-lg ${
                message.sender_id === user?.id
                  ? 'bg-pink-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* メッセージ入力 */}
      <form onSubmit={handleSubmit} className="bg-white border-t border-gray-200 p-4">
        <div className="flex space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="メッセージを入力"
            className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 text-gray-900"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
          >
            送信
          </button>
        </div>
      </form>
    </div>
  )
}
