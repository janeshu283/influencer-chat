'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { FaInstagram, FaTiktok, FaArrowLeft } from 'react-icons/fa'
import { FaXTwitter } from 'react-icons/fa6'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

interface SignupData {
  nickname: string
  instagram: string
  x: string
  tiktok: string
  email: string
  userId: string
  password: string
  profileImage: File | null
  isInfluencer: boolean
}

export default function SignupStepper() {
  console.log('Initializing SignupStepper component');
  const [step, setStep] = useState(1)
  const [data, setData] = useState<SignupData>({
    nickname: '',
    instagram: '',
    x: '',
    tiktok: '',
    email: '',
    userId: '',
    password: '',
    profileImage: null,
    isInfluencer: true, // 初期状態でON
  })
  const maxStep = 4 // ウィザードのステップは常に4
  const [imagePreview, setImagePreview] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [showSharing, setShowSharing] = useState(false)
  const [loading, setLoading] = useState(false) // Add loading state
  const { signUp } = useAuth()
  const router = useRouter()
  
  console.log('SignupStepper state initialized with loading state:', { loading })

  const validateStep = async () => {
    setError('')
    switch (step) {
      case 1:
        if (!data.nickname.trim()) {
          setError('ニックネームを入力してください。')
          return false
        }
        break
      case 2:
        if (!data.instagram && !data.x && !data.tiktok) {
          setError('少なくとも一つのSNSアカウントを入力してください。')
          return false
        }
        break
      case 3:
        if (data.password.length < 8) {
          setError('パスワードは8文字以上で入力してください。')
          return false
        }
        // ユーザーIDの重複チェック
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', data.userId)
          .single()
        if (existingUser) {
          setError('このユーザーIDは既に使用されています。')
          return false
        }
        break
    }
    return true
  }

  // 非インフルエンサーの場合、またはSNS共有画面で「終了」ボタンを押したときに実際の登録を行う
  const handleFinalSubmit = async () => {
    console.log('handleFinalSubmit called with data:', {
      email: data.email,
      nickname: data.nickname,
      userId: data.userId,
      isInfluencer: data.isInfluencer,
      // Omitting password for security
    });
    
    try {
      console.log('Setting error state to empty and loading state to true');
      setError('');
      setLoading(true);
      console.log('Current loading state:', loading);
      
      console.log('Calling signUp function...');
      await signUp(data.email, data.password, {
        nickname: data.nickname,
        userId: data.userId,
        instagram: data.instagram,
        x: data.x,
        tiktok: data.tiktok,
        profileImage: data.profileImage,
        isInfluencer: data.isInfluencer, // Pass the isInfluencer flag
      });
      console.log('signUp completed successfully');
      
      // Note: router.push is now handled in the signUp function
      // to properly direct users based on whether they're new or existing
    } catch (error: any) {
      console.error('Signup error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code
      });
      // Display a user-friendly error message
      setError(error.message || '登録中にエラーが発生しました。もう一度お試しください。');
    } finally {
      console.log('Setting loading state to false');
      setLoading(false);
      console.log('Final loading state:', loading);
    }
  }

  const handleNext = async () => {
    const isValid = await validateStep()
    if (!isValid) return

    if (step < maxStep) {
      setStep(step + 1)
    } else {
      // 最終ステップの場合
      if (data.isInfluencer) {
        // インフルエンサーは登録前にSNS共有画面を表示
        setShowSharing(true)
      } else {
        await handleFinalSubmit()
      }
    }
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setData({ ...data, profileImage: file })
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div key="step1" variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">ニックネームを入力してください。</h2>
            <p className="text-sm text-gray-500">（あとで変更OK）</p>
            <input
              type="text"
              value={data.nickname}
              onChange={(e) => setData({ ...data, nickname: e.target.value })}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 text-gray-900 placeholder-gray-400"
              placeholder="ニックネーム"
            />
            <div className="mt-8 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">インフルエンサーとして登録</span>
              <button
                onClick={() => setData({ ...data, isInfluencer: !data.isInfluencer })}
                className={`${data.isInfluencer ? 'bg-pink-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2`}
              >
                <span className={`${data.isInfluencer ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`} />
              </button>
            </div>
          </motion.div>
        )
      case 2:
        return (
          <motion.div key="step2" variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">あなたのSNSのアカウントID、またはURLリンクを教えてください。</h2>
            <p className="text-sm text-gray-500">（最低１つ必要です）</p>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <FaInstagram className="text-2xl text-pink-600" />
                <input
                  type="text"
                  value={data.instagram}
                  onChange={(e) => setData({ ...data, instagram: e.target.value })}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 text-gray-900 placeholder-gray-400"
                  placeholder="Instagramのアカウント"
                />
              </div>
              <div className="flex items-center space-x-3">
                <FaXTwitter className="text-2xl text-pink-600" />
                <input
                  type="text"
                  value={data.x}
                  onChange={(e) => setData({ ...data, x: e.target.value })}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 text-gray-900 placeholder-gray-400"
                  placeholder="Xのアカウント"
                />
              </div>
              <div className="flex items-center space-x-3">
                <FaTiktok className="text-2xl text-pink-600" />
                <input
                  type="text"
                  value={data.tiktok}
                  onChange={(e) => setData({ ...data, tiktok: e.target.value })}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 text-gray-900 placeholder-gray-400"
                  placeholder="TikTokのアカウント"
                />
              </div>
            </div>
          </motion.div>
        )
      case 3:
        return (
          <motion.div key="step3" variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">メールアドレスを入力してください。</label>
                <input
                  type="email"
                  value={data.email}
                  onChange={(e) => setData({ ...data, email: e.target.value })}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 text-gray-900 placeholder-gray-400"
                  placeholder="例）info@meetstar.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">ユーザーIDを設定してください。</label>
                <input
                  type="text"
                  value={data.userId}
                  onChange={(e) => setData({ ...data, userId: e.target.value })}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 text-gray-900 placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">ログインパスワードを設定してください。</label>
                <input
                  type="password"
                  value={data.password}
                  onChange={(e) => setData({ ...data, password: e.target.value })}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 text-gray-900 placeholder-gray-400"
                />
              </div>
            </div>
          </motion.div>
        )
      case 4:
        return (
          <motion.div key="step4" variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">プロフィールアイコンを設定してください。</h2>
            <div className="flex flex-col items-center space-y-4">
              <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-100">
                {imagePreview ? (
                  <Image src={imagePreview} alt="Profile preview" fill className="object-cover" />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-gray-400">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="profile-image" />
              <label htmlFor="profile-image" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 cursor-pointer">
                画像をアップロード
              </label>
            </div>
          </motion.div>
        )
    }
  }

  // SNS共有画面（インフルエンサー向け、ウィザード外）
  if (showSharing) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <h2 className="text-2xl font-bold text-gray-900">SNS共有の投稿をお願いします！</h2>
            <p className="text-sm text-gray-500">以下をコピーしてすぐに投稿できます（編集OK）</p>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="whitespace-pre-line text-gray-900">
                  こちらでDMを受け付けています！

https://giftalk.co/

ギフトが必要ですが、100%返信します😊
                </p>
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(
                      "こちらでDMを受け付けています！\n\nhttps://giftalk.co/\n\nギフトが必要ですが、100%返信します😊"
                    )
                  }
                  className="mt-2 px-3 py-1 text-sm text-pink-600 hover:text-pink-700"
                >
                  コピー
                </button>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="whitespace-pre-line text-gray-900">
                  ギフトを受け付けています！

ここでのDMは100％返信します😊

https://giftalk.co/
                </p>
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(
                      "ギフトを受け付けています！\n\nここでのDMは100％返信します😊\n\nhttps://giftalk.co/"
                    )
                  }
                  className="mt-2 px-3 py-1 text-sm text-pink-600 hover:text-pink-700"
                >
                  コピー
                </button>
              </div>
            </div>
            <div className="mt-6">
              {error && <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 text-sm">{error}</div>}
              <button
                onClick={handleFinalSubmit}
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:bg-pink-300 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    処理中...
                  </>
                ) : (
                  '終了'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="mb-8">
            <div className="relative pt-1">
              <div className="flex items-center justify-between mb-2">
                <button onClick={handleBack} className={`p-2 rounded-full ${step === 1 ? 'text-gray-300' : 'text-pink-600 hover:text-pink-700'}`} disabled={step === 1}>
                  <FaArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-8" />
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                <div style={{ width: `${(step / maxStep) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-pink-600 transition-all duration-500" />
              </div>
            </div>
          </div>
          {error && <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 text-sm">{error}</div>}
          <AnimatePresence mode="wait" initial={false}>
            {renderStep()}
          </AnimatePresence>
          <div className="mt-6">
            <button
              onClick={handleNext}
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:bg-pink-300 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  処理中...
                </>
              ) : (
                step === maxStep ? '登録する' : '次へ→'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}