import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Message, Profile } from '@/types/supabase'
import SuperChatButton from './SuperChatButton'

interface ChatRoomProps {
  roomId: string
  currentUserId: string
}

interface ChatRoomHeader {
  profile: Profile;
  roomId: string;
  currentUserId: string;
  onSendSuperChat: (amount: number, message: string) => Promise<void>;
}

function ChatRoomHeader({ profile, onSendSuperChat }: ChatRoomHeader) {
  return (
    <div className="bg-white border-b shadow-sm">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 ring-2 ring-pink-100">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.username || 'Profile'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
                  👤
                </div>
              )}
            </div>
            <div>
              <h2 className="font-bold text-xl text-gray-900">{profile.username || 'Anonymous'}</h2>
              <div className="flex items-center space-x-2 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <p className="text-sm text-gray-600">オンライン</p>
              </div>
            </div>
          </div>
          <SuperChatButton onSendSuperChat={onSendSuperChat} />
        </div>
      </div>
    </div>
  );
}

export default function ChatRoom({ roomId, currentUserId }: ChatRoomProps) {
  const [messages, setMessages] = useState<(Message & { sender: Profile })[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [influencer, setInfluencer] = useState<Profile | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  // Using the imported supabase instance

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // インフルエンサー情報の読み込み
    const loadInfluencer = async () => {
      const { data: chatRoom } = await supabase
        .from('chat_rooms')
        .select('influencer_id')
        .eq('id', roomId)
        .single();

      if (chatRoom) {
        const { data: influencerData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', chatRoom.influencer_id)
          .single();

        if (influencerData) {
          setInfluencer(influencerData);
        }
      }
    };

    loadInfluencer();

    // メッセージの初期読み込み
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*, type, amount, sender:profiles(*)')
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
              type: payload.new.type,
              amount: payload.new.amount,
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

  if (loading || !influencer) {
    return <div className="flex justify-center p-4">Loading...</div>
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="sticky top-0 z-10">
        <ChatRoomHeader 
          profile={influencer} 
          roomId={roomId} 
          currentUserId={currentUserId}
          onSendSuperChat={async (amount, message) => {
            const { data, error } = await supabase
              .from('messages')
              .insert([
                {
                  chat_room_id: roomId,
                  user_id: currentUserId,
                  content: message,
                  type: 'superchat',
                  amount: amount
                }
              ])
              .select('*, sender:profiles(*)')
              .single()

            if (error) {
              console.error('Error sending superchat:', error)
              return
            }

            setMessages(prev => [...prev, data])
          }}
        />
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
        <div className="max-w-3xl mx-auto">
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
                  {message.type === 'superchat' ? (
                    <div className="px-4 py-3 rounded-lg bg-gradient-to-r from-yellow-400 to-yellow-300 shadow-lg border-2 border-yellow-500 w-full">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-white ring-2 ring-yellow-500">
                            {message.sender.avatar_url ? (
                              <img
                                src={message.sender.avatar_url}
                                alt={message.sender.username || 'Profile'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">👤</div>
                            )}
                          </div>
                          <span className="font-bold text-gray-900">{message.sender.username || 'Anonymous'}</span>
                        </div>
                        <span className="font-bold text-yellow-700 text-lg">¥{message.amount?.toLocaleString()}</span>
                      </div>
                      <p className="text-gray-900 mt-2 font-medium">{message.content}</p>
                    </div>
                  ) : (
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
                  )}
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
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t bg-white shadow-md">
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
