import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Message, Profile } from '@/types/supabase'
import SuperChat from '@/components/chat/SuperChat'

interface ChatRoomProps {
  roomId: string
  currentUserId: string
}

interface CombinedMessage {
  id: string
  created_at: string
  user_id: string
  content: string
  type: 'text' | 'superchat'
  amount?: number
  sender?: Profile
}

export default function ChatRoom({ roomId, currentUserId }: ChatRoomProps) {
  const [messages, setMessages] = useState<CombinedMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [influencer, setInfluencer] = useState<Profile | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // 通常のメッセージを取得
  const loadMessages = async (): Promise<CombinedMessage[]> => {
    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:profiles(*)')
      .eq('chat_room_id', roomId)
      .order('created_at')
    if (error) {
      console.error('Error loading messages:', error)
      return []
    }
    return data.map((msg: any) => ({
      id: msg.id,
      created_at: msg.created_at,
      user_id: msg.sender_id,
      content: msg.content,
      type: msg.type || 'text',
      amount: msg.amount,
      sender: msg.sender
    }))
  }

  // super_chats を取得（会話の参加者同士の組み合わせでフィルタ）
  const loadSuperChats = async (): Promise<CombinedMessage[]> => {
    if (!influencer) return []
    const { data, error } = await supabase
      .from('super_chats')
      .select('*')
      .eq('user_id', currentUserId)
      .eq('influencer_id', influencer.id)
      .order('created_at')
    if (error) {
      console.error('Error loading super chats:', error)
      return []
    }
    return data.map((sc: any) => {
      const formattedAmount = new Intl.NumberFormat('ja-JP', {
        style: 'currency',
        currency: 'JPY'
      }).format(sc.amount)
      return {
        id: sc.id,
        created_at: sc.created_at,
        user_id: sc.user_id,
        content: `💰 ${formattedAmount} スーパーチャット: ${sc.message}`,
        type: 'superchat',
        amount: sc.amount
      }
    })
  }

  // データ全体をロードする
  useEffect(() => {
    const loadData = async () => {
      // チャットルームからインフルエンサー情報を取得
      const { data: roomData, error: roomError } = await supabase
        .from('chat_rooms')
        .select('influencer_id')
        .eq('id', roomId)
        .single()
      if (roomError) {
        console.error('Error fetching chat room:', roomError)
        return
      }
      if (roomData?.influencer_id) {
        const { data: influencerData, error: influencerError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', roomData.influencer_id)
          .single()
        if (influencerError) {
          console.error('Error fetching influencer profile:', influencerError)
          return
        }
        setInfluencer(influencerData)
      }

      // 両方のメッセージを取得してマージ
      const msgs = await loadMessages()
      const superChats = await loadSuperChats()
      const combined = [...msgs, ...superChats].sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      setMessages(combined)
      setLoading(false)
      scrollToBottom()
    }
    loadData()
  }, [roomId, currentUserId, influencer])

  // 通常メッセージ送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const messageObj = {
      chat_room_id: roomId,
      sender_id: currentUserId,
      content: newMessage.trim(),
      type: 'text'
    }
    const { data, error } = await supabase
      .from('messages')
      .insert([messageObj])
      .select()
      .single()
    if (error) {
      console.error('Error sending message:', error)
      return
    }
    setMessages(prev => [
      ...prev,
      {
        id: data.id,
        created_at: data.created_at,
        user_id: data.sender_id,
        content: data.content,
        type: data.type,
        sender: undefined
      }
    ])
    scrollToBottom()
    setNewMessage('')
  }

  if (loading || !influencer) {
    return <div className="flex justify-center p-4">Loading...</div>
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* ヘッダー（SuperChat送信用コンポーネント） */}
      <div className="sticky top-0 z-10">
        <SuperChat
          influencerId={influencer.id}
          influencerName={influencer.username || 'Anonymous'}
          roomId={roomId}
        />
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
        <div className="max-w-3xl mx-auto">
          {messages.map((msg, index) => {
            const messageDate = new Date(msg.created_at)
            const formattedTime = messageDate.toLocaleTimeString('ja-JP', {
              hour: '2-digit',
              minute: '2-digit'
            })
            const showDate =
              index === 0 ||
              new Date(messages[index - 1].created_at).toDateString() !==
                messageDate.toDateString()
            const formattedDate = messageDate.toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="flex justify-center my-4">
                    <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                      {formattedDate}
                    </div>
                  </div>
                )}
                <div className={`flex ${msg.user_id === currentUserId ? 'justify-end' : 'justify-start'}`}>
                  <div className="flex flex-col max-w-xs lg:max-w-md">
                    {msg.type === 'superchat' ? (
                      <div className="px-4 py-3 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 shadow-lg border-2 border-pink-300 w-full">
                        <p className="text-white mt-2 font-medium">{msg.content}</p>
                      </div>
                    ) : (
                      <div className={`px-4 py-2 rounded-lg ${msg.user_id === currentUserId ? 'bg-pink-600 text-white ml-auto' : 'bg-white text-gray-900 border border-gray-200 mr-auto'} shadow-sm`}>
                        <div className="text-sm font-semibold mb-1">
                          {/* 任意で送信者名などを表示 */}
                        </div>
                        <div>{msg.content}</div>
                      </div>
                    )}
                    <div className={`text-xs mt-1 ${msg.user_id === currentUserId ? 'text-right' : 'text-left'} text-gray-500`}>
                      {formattedTime}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t bg-white shadow-md">
        <div className="max-w-3xl mx-auto">
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
        </div>
      </form>
    </div>
  )
}