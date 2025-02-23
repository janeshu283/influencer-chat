import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Message, Profile } from '@/types/supabase'

interface ChatRoomProps {
  roomId: string
  currentUserId: string
}

export default function ChatRoom({ roomId, currentUserId }: ChatRoomProps) {
  const [messages, setMessages] = useState<(Message & { sender: Profile })[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  // Using the imported supabase instance

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // メッセージの初期読み込み
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*, sender:profiles(*)')
        .eq('room_id', roomId)
        .order('created_at')

      if (error) {
        console.error('Error loading messages:', error)
        return
      }

      setMessages(data || [])
      setLoading(false)
    }

    loadMessages()

    // リアルタイムサブスクリプション
    const subscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          // 送信者の情報を取得
          const { data: senderData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', payload.new.sender_id)
            .single()

          if (senderData) {
            const newMessage: Message & { sender: Profile } = {
              id: payload.new.id,
              created_at: payload.new.created_at,
              chat_room_id: payload.new.room_id,
              user_id: payload.new.sender_id,
              content: payload.new.content,
              sender: senderData
            }
            setMessages((current) => [...current, newMessage])
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [roomId])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const message = {
      chat_room_id: roomId,
      user_id: currentUserId,
      content: newMessage.trim(),
    }

    const { error } = await supabase.from('messages').insert([message])

    if (error) {
      console.error('Error sending message:', error)
      return
    }

    setNewMessage('')
  }

  if (loading) {
    return <div className="flex justify-center p-4">Loading...</div>
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => {
          // メッセージの日付をフォーマット
          const messageDate = new Date(message.created_at)
          const formattedTime = messageDate.toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
          })

          // 日付の変更をチェック
          const showDate = index === 0 || (
            index > 0 && 
            new Date(messages[index - 1].created_at).toDateString() !== messageDate.toDateString()
          )

          const formattedDate = messageDate.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })

          return (
            <div key={message.id}>
              {showDate && (
                <div className="flex justify-center my-4">
                  <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                    {formattedDate}
                  </div>
                </div>
              )}
              <div className={`flex ${message.user_id === currentUserId ? 'justify-end' : 'justify-start'}`}>
                <div className="flex flex-col max-w-xs lg:max-w-md">
                  <div
                    className={`px-4 py-2 rounded-lg ${message.user_id === currentUserId
                      ? 'bg-pink-600 text-white ml-auto'
                      : 'bg-white text-gray-900 border border-gray-200 mr-auto'
                    } shadow-sm`}
                  >
                    <div className="text-sm font-semibold mb-1">
                      {message.sender.username || 'Anonymous'}
                    </div>
                    <div>{message.content}</div>
                  </div>
                  <div className={`text-xs mt-1 ${message.user_id === currentUserId ? 'text-right' : 'text-left'} text-gray-500`}>
                    {formattedTime}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-colors duration-200"
          >
            送信
          </button>
        </div>
      </form>
    </div>
  )
}
