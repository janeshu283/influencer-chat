'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { ChatRoom, Message, Profile } from '@/types/supabase'

type ChatRoomWithDetails = ChatRoom & {
  influencer: Profile
  user: Profile
  messages: Message[]
  message_count: number
}

export default function ChatManagement() {
  const [chatRooms, setChatRooms] = useState<ChatRoomWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalRooms, setTotalRooms] = useState(0)
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null)
  const roomsPerPage = 10

  const fetchChatRooms = async (page: number, search: string = '') => {
    try {
      setLoading(true)
      let query = supabase
        .from('chat_rooms')
        .select(`
          *,
          influencer:profiles!chat_rooms_influencer_id_fkey(*),
          user:profiles!chat_rooms_user_id_fkey(*),
          messages(count),
          message_count:messages(count)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * roomsPerPage, page * roomsPerPage - 1)

      if (search) {
        query = query.or(
          `influencer.username.ilike.%${search}%,user.username.ilike.%${search}%`
        )
      }

      const { data, count, error } = await query

      if (error) throw error

      setChatRooms(data || [])
      setTotalRooms(count || 0)
    } catch (error) {
      console.error('Error fetching chat rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChatRooms(currentPage, searchTerm)
  }, [currentPage, searchTerm])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm('Are you sure you want to delete this chat room? This action cannot be undone.')) {
      return
    }

    try {
      // まずメッセージを削除
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('chat_room_id', roomId)

      if (messagesError) throw messagesError

      // チャットルームを削除
      const { error: roomError } = await supabase
        .from('chat_rooms')
        .delete()
        .eq('id', roomId)

      if (roomError) throw roomError

      // 画面を更新
      setChatRooms(chatRooms.filter(room => room.id !== roomId))
      setSelectedRoom(null)
    } catch (error) {
      console.error('Error deleting chat room:', error)
    }
  }

  const totalPages = Math.ceil(totalRooms / roomsPerPage)

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Chat Management</h2>
        <input
          type="text"
          placeholder="Search chats..."
          value={searchTerm}
          onChange={handleSearch}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="text-center py-4">Loading...</div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Influencer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Messages
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {chatRooms.map((room) => (
                  <tr key={room.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {room.influencer.avatar_url && (
                          <img
                            src={room.influencer.avatar_url}
                            alt=""
                            className="h-10 w-10 rounded-full mr-3"
                          />
                        )}
                        <div className="text-sm font-medium text-gray-900">
                          {room.influencer.username || 'Anonymous'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {room.user.avatar_url && (
                          <img
                            src={room.user.avatar_url}
                            alt=""
                            className="h-10 w-10 rounded-full mr-3"
                          />
                        )}
                        <div className="text-sm font-medium text-gray-900">
                          {room.user.username || 'Anonymous'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {room.message_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(room.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedRoom(room.id === selectedRoom ? null : room.id)}
                          className="px-3 py-1 rounded-md text-white text-sm bg-blue-500 hover:bg-blue-600"
                        >
                          {room.id === selectedRoom ? 'Hide Details' : 'View Details'}
                        </button>
                        <button
                          onClick={() => handleDeleteRoom(room.id)}
                          className="px-3 py-1 rounded-md text-white text-sm bg-red-500 hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ページネーション */}
          <div className="mt-4 flex justify-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border rounded-md disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border rounded-md disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  )
}
