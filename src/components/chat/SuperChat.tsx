import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

interface SuperChatProps {
  influencerId: string
  influencerName: string
  roomId: string
}

export default function SuperChat({ influencerId, influencerName, roomId }: SuperChatProps) {
  const [amount, setAmount] = useState<number>(500)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  const predefinedAmounts = [100, 500, 2000, 5000, 10000]

  const handleSuperChat = async () => {
    if (!user) {
      alert('スーパーチャットを送るにはログインが必要です')
      return
    }

    try {
      setLoading(true)

      // セッションからアクセストークンを取得
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('認証エラー: セッションが無効です')
      }

      // デバッグ: 送信データを確認
      console.log('Sending superchat data:', {
        amount,
        message,
        influencerId,
        roomId
      })

      // 必須パラメータのチェック
      if (!influencerId) {
        throw new Error('インフルエンサーIDが不足しています')
      }
      if (!roomId) {
        throw new Error('ルームIDが不足しています')
      }
      if (!amount) {
        throw new Error('金額が指定されていません')
      }

      // 支払い処理を開始
      const response = await fetch('/api/stripe/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          amount,
          message,
          influencerId,
          roomId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('API response error:', data)
        throw new Error(data.error || '支払い処理中にエラーが発生しました')
      }

      if (!data.url) {
        throw new Error('Stripeの支払いURLが見つかりません')
      }

      // Stripeのチェックアウトページに遷移
      window.location.href = data.url

    } catch (error) {
      console.error('SuperChat error:', error)
      alert(error instanceof Error ? error.message : '予期せぬエラーが発生しました')
    } finally {
      setLoading(false)
      setIsModalOpen(false)
    }
  }

  return (
    <div>
      <button
        onClick={() => setIsModalOpen(true)}
        disabled={loading}
        className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white px-4 py-2.5 rounded-full flex items-center space-x-2 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="text-lg">💗</span>
        <span>スーパーチャット</span>
        {loading && (
          <svg className="animate-spin h-4 w-4 text-white ml-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl relative">
            <div className="absolute top-2 right-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-2"
              >
                ✕
              </button>
            </div>

            <h2 className="text-xl font-bold mb-2">{influencerName}さんをサポート</h2>
            <p className="text-sm text-gray-600 mb-6">スーパーチャットでサポートできます。</p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                金額を選択
              </label>
              <div className="grid grid-cols-3 gap-2">
                {predefinedAmounts.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setAmount(value)}
                    className={`px-4 py-3 rounded-lg border-2 transition-all ${
                      amount === value
                        ? 'border-pink-500 bg-pink-50 text-pink-700'
                        : 'border-gray-200 hover:border-pink-200 hover:bg-pink-50 text-gray-900'
                    }`}
                  >
                    ¥{value.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メッセージ (任意)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="応援メッセージを入力（最大100文字）"
                maxLength={100}
                className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-pink-500 focus:ring-0 text-gray-900 placeholder-gray-400"
                rows={3}
              />
              <div className="text-right text-xs text-gray-500 mt-1">
                {message.length}/100
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleSuperChat}
                disabled={loading}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '処理中...' : 'スーパーチャットを送信'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
