'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { FaInstagram, FaTwitter, FaTiktok } from 'react-icons/fa'

interface Influencer {
  id: string
  nickname: string
  instagram: string
  twitter: string
  tiktok: string
  profile_image_url: string
  bio: string
}

export default function InfluencersPage() {
  const [influencers, setInfluencers] = useState<Influencer[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchInfluencers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            id,
            nickname,
            instagram,
            twitter,
            tiktok,
            profile_image_url,
            bio
          `)
          .eq('is_influencer', true)

        if (error) throw error
        setInfluencers(data || [])
      } catch (error) {
        console.error('Error fetching influencers:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInfluencers()
  }, [])

  const startChat = async (influencerId: string) => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }

      // チャットルームが既に存在するか確認
      console.log('Starting chat with influencer:', influencerId)
      console.log('Current user:', user.user.id)

      const { data: existingRoom, error: fetchError } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('influencer_id', influencerId)
        .eq('user_id', user.user.id)
        .maybeSingle()

      if (fetchError) {
        console.error('Error fetching chat room:', fetchError)
        return
      }

      let roomId

      if (existingRoom) {
        roomId = existingRoom.id
      } else {
        // 新しいチャットルームを作成
        console.log('Creating new chat room with:', {
          influencer_id: influencerId,
          user_id: user.user.id
        })

        const { data: newRoom, error: createError } = await supabase
          .from('chat_rooms')
          .insert([
            {
              influencer_id: influencerId,
              user_id: user.user.id,
              last_message: '',
              last_message_time: new Date().toISOString(),
            },
          ])
          .select()
          .single()

        console.log('Chat room creation result:', { newRoom, createError })

        if (createError) {
          console.error('Error creating chat room:', createError)
          return
        }
        
        if (!newRoom) {
          console.error('No room created')
          return
        }
        
        roomId = newRoom.id
      }

      if (!roomId) {
        console.error('No room ID available')
        return
      }

      // チャットページに遷移
      router.push(`/chat/${roomId}`)
    } catch (error) {
      console.error('Error starting chat:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">インフルエンサー一覧</h1>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {influencers.map((influencer) => (
          <div
            key={influencer.id}
            className="bg-white rounded-lg shadow overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 w-16 h-16 relative rounded-full overflow-hidden bg-gray-100">
                  {influencer.profile_image_url && (
                    <img
                      src={influencer.profile_image_url}
                      alt={influencer.nickname}
                      className="object-cover w-full h-full"
                    />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-medium text-gray-900">
                    {influencer.nickname}
                  </h2>
                  <div className="mt-2 flex space-x-3">
                    {influencer.instagram && (
                      <a
                        href={`https://instagram.com/${influencer.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-500 hover:text-pink-600"
                      >
                        <FaInstagram className="text-xl" />
                      </a>
                    )}
                    {influencer.twitter && (
                      <a
                        href={`https://twitter.com/${influencer.twitter}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-500 hover:text-pink-600"
                      >
                        <FaTwitter className="text-xl" />
                      </a>
                    )}
                    {influencer.tiktok && (
                      <a
                        href={`https://tiktok.com/@${influencer.tiktok}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-500 hover:text-pink-600"
                      >
                        <FaTiktok className="text-xl" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <p className="mt-4 text-gray-600 text-sm line-clamp-3">
                {influencer.bio || '自己紹介文がありません'}
              </p>

              <div className="mt-6">
                <button
                  onClick={() => startChat(influencer.id)}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                >
                  チャットを始める
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
