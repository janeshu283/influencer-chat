'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { FaInstagram, FaTiktok, FaCamera } from 'react-icons/fa'
import { FaXTwitter } from 'react-icons/fa6'
import { v4 as uuidv4 } from 'uuid'

interface Profile {
  id: string
  nickname: string
  bio: string
  instagram: string
  x: string
  tiktok: string
  profile_image_url?: string
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingBio, setEditingBio] = useState(false)
  const [tempBio, setTempBio] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return
    
    const file = e.target.files[0]
    setUploading(true)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${uuidv4()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('profile_images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('profile_images')
        .getPublicUrl(filePath)

      await updateProfile('profile_image_url', publicUrl)
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('画像のアップロードに失敗しました')
    } finally {
      setUploading(false)
    }
  }

  const updateProfile = async (field: string, value: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ [field]: value })
        .eq('id', user.id)

      if (error) throw error

      setProfile(prev => prev ? { ...prev, [field]: value } : null)
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('プロフィールの更新に失敗しました')
    }
  }

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) throw error
        setProfile(data)
      } catch (error) {
        console.error('Error fetching profile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user])

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center">
        <div className="text-gray-600 bg-white p-8 rounded-2xl shadow-lg border border-pink-100">ログインが必要です</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-300 border-t-transparent"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center">
        <div className="text-gray-600 bg-white p-8 rounded-2xl shadow-lg border border-pink-100">プロフィールが見つかりません</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-2xl overflow-hidden border border-pink-100">
          <div className="p-6 sm:p-8">
            <div className="pb-6 border-b border-pink-100">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">プロフィール</h2>
              <p className="mt-1 text-sm text-gray-500">あなたのプロフィール情報を編集できます。</p>
            </div>

            <div className="flex justify-center py-8">
              <div
                className="w-32 h-32 relative rounded-full overflow-hidden bg-gradient-to-r from-pink-100 to-purple-100 mb-4 group cursor-pointer shadow-md hover:shadow-lg transition-shadow duration-300"
                onClick={() => fileInputRef.current?.click()}
              >
                {profile.profile_image_url ? (
                  <>
                    <img
                      src={profile.profile_image_url}
                      alt={profile.nickname}
                      className="object-cover w-full h-full"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <FaCamera className="w-8 h-8 text-white" />
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center group-hover:bg-pink-50 transition-colors duration-300">
                    {uploading ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" />
                    ) : (
                      <FaCamera className="w-12 h-12 text-pink-300 group-hover:text-pink-400 transition-colors duration-300" />
                    )}
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
              </div>
            </div>
            <div className="space-y-6 mt-6">
              <div>
                <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">ニックネーム</label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="nickname"
                    value={profile.nickname}
                    onChange={(e) => updateProfile('nickname', e.target.value)}
                    className="shadow-sm focus:ring-pink-500 focus:border-pink-500 block w-full sm:text-sm border-gray-300 rounded-lg bg-white hover:bg-pink-50 transition-colors duration-300"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700">自己紹介</label>
                <div className="mt-1">
                  <textarea
                    id="bio"
                    rows={4}
                    value={profile.bio || ''}
                    onChange={(e) => updateProfile('bio', e.target.value)}
                    className="shadow-sm focus:ring-pink-500 focus:border-pink-500 block w-full sm:text-sm border-gray-300 rounded-lg bg-white hover:bg-pink-50 transition-colors duration-300"
                  />
                </div>
              </div>
            </div>

            <div className="pt-8 mt-8 border-t border-pink-100">
              <h3 className="text-lg font-medium text-gray-900">SNSアカウント連携</h3>
              <p className="mt-1 text-sm text-gray-500">あなたのSNSアカウントを連携して、フォロワーに共有できます。</p>
              
              <div className="mt-6 space-y-6">
                <div className="flex items-center">
                  <FaXTwitter className="text-xl text-gray-900 mr-3" />
                  <input
                    type="text"
                    value={profile.x || ''}
                    onChange={(e) => updateProfile('x', e.target.value)}
                    placeholder="X ID または URL"
                    className="shadow-sm focus:ring-pink-500 focus:border-pink-500 block w-full sm:text-sm border-gray-300 rounded-lg bg-white hover:bg-pink-50 transition-colors duration-300"
                  />
                </div>

                <div className="flex items-center">
                  <FaInstagram className="text-xl text-[#E4405F] mr-3" />
                  <input
                    type="text"
                    value={profile.instagram || ''}
                    onChange={(e) => updateProfile('instagram', e.target.value)}
                    placeholder="Instagram ID または URL"
                    className="shadow-sm focus:ring-pink-500 focus:border-pink-500 block w-full sm:text-sm border-gray-300 rounded-lg bg-white hover:bg-pink-50 transition-colors duration-300"
                  />
                </div>

                <div className="flex items-center">
                  <FaTiktok className="text-xl text-black mr-3" />
                  <input
                    type="text"
                    value={profile.tiktok || ''}
                    onChange={(e) => updateProfile('tiktok', e.target.value)}
                    placeholder="TikTok ID または URL"
                    className="shadow-sm focus:ring-pink-500 focus:border-pink-500 block w-full sm:text-sm border-gray-300 rounded-lg bg-white hover:bg-pink-50 transition-colors duration-300"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
