import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import OnlineStatus from '@/components/common/OnlineStatus'
import type { Profile } from '@/types/supabase'

interface InfluencerListProps {
  currentUserId: string
  onSelectInfluencer: (influencer: Profile) => void
}

export default function InfluencerList({
  currentUserId,
  onSelectInfluencer,
}: InfluencerListProps) {
  const [influencers, setInfluencers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  // Using the imported supabase instance

  useEffect(() => {
    const loadInfluencers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_influencer', true)
        .neq('id', currentUserId)

      if (error) {
        console.error('Error loading influencers:', error)
        return
      }

      setInfluencers(data || [])
      setLoading(false)
    }

    loadInfluencers()

    // リアルタイムサブスクリプション
    const subscription = supabase
      .channel('influencers')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: 'is_influencer=eq.true',
        },
        loadInfluencers
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {influencers.map((influencer) => (
        <div
          key={influencer.id}
          className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center space-x-4">
            {influencer.avatar_url && (
              <img
                src={influencer.avatar_url}
                alt={influencer.username || 'Influencer'}
                className="w-12 h-12 rounded-full"
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold">
                {influencer.username || 'Anonymous'}
              </h3>
              <OnlineStatus userId={influencer.id} />
              <p className="text-sm text-gray-500">{influencer.full_name}</p>
            </div>
          </div>
          <button
            onClick={() => onSelectInfluencer(influencer)}
            className="mt-4 w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Start Chat
          </button>
        </div>
      ))}
      {influencers.length === 0 && (
        <div className="col-span-full text-center text-gray-500 py-8">
          No influencers found
        </div>
      )}
    </div>
  )
}
