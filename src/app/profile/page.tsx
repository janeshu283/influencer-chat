'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { FaInstagram, FaTiktok } from 'react-icons/fa'
import { FaXTwitter } from 'react-icons/fa6'
import { CameraIcon } from '@heroicons/react/24/outline'
import { FaTimes } from 'react-icons/fa';

interface Profile {
  nickname: string
  email: string
  bio: string
  instagram: string
  x: string
  tiktok: string
  profile_image_url: string
  is_influencer: boolean
}

export default function ProfilePage() {
  const { user } = useAuth()

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      const file = event.target.files?.[0]
      if (!file || !user) return

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('ファイルサイズは5MB以下にしてください')
        return
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('画像ファイルを選択してください')
        return
      }

      // Convert file to base64
      const reader = new FileReader()
      reader.readAsDataURL(file)
      
      const imageUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
      })

      // Update the profile with the base64 image
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_image_url: imageUrl })
        .eq('id', user.id)

      if (updateError) {
        console.error('Update error:', updateError)
        throw updateError
      }

      // Update local state
      setProfile(prev => prev ? { ...prev, profile_image_url: imageUrl } : null)
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('画像のアップロードに失敗しました')
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingBio, setEditingBio] = useState(false)
  const [tempBio, setTempBio] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  const updateProfile = async (field: string, value: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ [field]: value })
        .eq('id', user?.id)

      if (error) throw error

      // プロフィールを再取得して最新の状態を反映
      await fetchProfile()

      if (field === 'bio') {
        setEditingBio(false)
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('プロフィールの更新に失敗しました')
    }
  }

  const startEditingBio = () => {
    setTempBio(profile?.bio || '')
    setEditingBio(true)
  }

  const saveBio = () => {
    updateProfile('bio', tempBio)
  }

  const cancelEditBio = () => {
    setEditingBio(false)
    setTempBio(profile?.bio || '')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">プロフィールが見つかりません</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="bg-white rounded-lg overflow-hidden p-6 space-y-8">
        <h2 className="text-2xl font-bold text-gray-900">プロフィール</h2>
        
        <div className="flex flex-col items-center">
          <div
            className="w-32 h-32 relative rounded-full overflow-hidden bg-gray-100 mb-4 group cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            {profile.profile_image_url ? (
              <>
                <img
                  src={profile.profile_image_url}
                  alt={profile.nickname}
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <CameraIcon className="w-8 h-8 text-white" />
                </div>
              </>
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center group-hover:bg-gray-300 transition-colors">
                {uploading ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400" />
                ) : (
                  <CameraIcon className="w-12 h-12 text-gray-400" />
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

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">ニックネーム</label>
            <input
              type="text"
              value={profile.nickname}
              onChange={(e) => updateProfile('nickname', e.target.value)}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">メールアドレス</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 text-gray-900"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-900">自己紹介</label>
              {!editingBio && (
                <button
                  onClick={startEditingBio}
                  className="text-pink-600 text-sm hover:text-pink-700 transition-colors duration-200"
                >
                  編集
                </button>
              )}
            </div>
            {editingBio ? (
              <div className="space-y-2">
                <textarea
                  rows={4}
                  value={tempBio}
                  onChange={(e) => setTempBio(e.target.value)}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 text-gray-900"
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={cancelEditBio}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={saveBio}
                    className="px-3 py-1 text-sm bg-pink-600 text-white rounded hover:bg-pink-700 transition-colors duration-200"
                  >
                    保存
                  </button>
                </div>
              </div>
            ) : (
              <div className="block w-full rounded-lg border border-gray-300 p-3 text-gray-900 bg-gray-50">
                {profile.bio || '自己紹介が未設定です'}
              </div>
            )}
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">SNSアカウント連携</h3>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <FaXTwitter className="text-xl text-gray-900 mr-3" />
              <input
                type="text"
                value={profile.x || ''}
                onChange={(e) => updateProfile('x', e.target.value)}
                placeholder="X ID または URL"
                className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 text-gray-900"
              />
              <span className="ml-3 text-sm text-gray-500">
                {profile.x ? '連携済み' : '未連携'}
              </span>
            </div>

            <div className="flex items-center">
              <FaInstagram className="text-xl text-[#E4405F] mr-3" />
              <input
                type="text"
                value={profile.instagram || ''}
                onChange={(e) => updateProfile('instagram', e.target.value)}
                placeholder="Instagram ID または URL"
                className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 text-gray-900"
              />
              <span className="ml-3 text-sm text-gray-500">
                {profile.instagram ? '連携済み' : '未連携'}
              </span>
            </div>

            <div className="flex items-center">
              <FaTiktok className="text-xl text-black mr-3" />
              <input
                type="text"
                value={profile.tiktok || ''}
                onChange={(e) => updateProfile('tiktok', e.target.value)}
                placeholder="その他のSNS URL"
                className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 text-gray-900"
              />
              <span className="ml-3 text-sm text-gray-500">
                {profile.tiktok ? '連携済み' : '未連携'}
              </span>
            </div>
          </div>
        </div>

        <PaymentSection />
      </div>

      <div className="text-center text-sm text-gray-500 mt-8">
        Copyright 2025 GifTalk
      </div>
    </div>
  )
}
