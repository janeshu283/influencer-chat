import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface SuperChatProps {
  influencerId: string
  influencerName: string
}

export default function SuperChat({ influencerId, influencerName }: SuperChatProps) {
  const [amount, setAmount] = useState<number>(500)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasCard, setHasCard] = useState<boolean | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  // カード情報の有無をチェック
  useEffect(() => {
    const checkCard = async () => {
      if (!user) return

      try {
        const response = await fetch(`/api/stripe/check-card?userId=${user.id}`)
        const data = await response.json()
        setHasCard(data.hasCard)
      } catch (error) {
        console.error('Failed to check card:', error)
        setHasCard(false)
      }
    }

    checkCard()
  }, [user])

  const handleSuperChat = async () => {
    if (!user) {
      alert('スーパーチャットを送るにはログインが必要です')
      return
    }

    if (!hasCard) {
      const shouldSetup = window.confirm('送信にはクレジットカードの登録が必要です。登録ページに移動しますか？')
      if (shouldSetup) {
        router.push('/settings/payment')
      }
      setIsModalOpen(false)
      return
    }

    try {
      setLoading(true)
      const requestData = {
        amount,
        influencerId,
        message,
        userId: user.id,
      }
      console.log('Sending superchat request:', requestData)

      console.log('Request URL:', `${window.location.origin}/api/stripe/payment`)
      const url = `${window.location.origin}/api/stripe/payment`
      console.log('Making request to:', url)
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          amount,
          influencerId,
          message,
          userId: user.id,
        }),
      })

      console.log('Response status:', response.status)
      // レスポンスの詳細をログ出力
      console.log('Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      })

      const contentType = response.headers.get('content-type')
      console.log('Content-Type:', contentType)

      // レスポンスの内容をクローンして両方のケースで読めるようにする
      const responseClone = response.clone()

      if (contentType && contentType.includes('application/json')) {
        const data = await response.json()
        console.log('Response data:', {
          status: response.status,
          ok: response.ok,
          data,
          headers: Object.fromEntries(response.headers.entries())
        })

        if (data.url) {
          window.location.href = data.url
          return
        }

        if (!response.ok) {
          throw new Error(data.error || data.details || 'エラーが発生しました')
        }

        if (!data.url) {
          console.error('Missing URL in response:', data)
          throw new Error('StripeのチェックアウトURLが見つかりません')
        }

        // Stripeのチェックアウトページにリダイレクト
        window.location.href = data.url
      } else {
        // JSONでない場合は生のテキストを試す
        try {
          const text = await responseClone.text()
          console.error('Non-JSON response details:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            contentType,
            body: text,
            url: response.url
          })
        } catch (textError) {
          console.error('Failed to read response text:', textError)
        }
        throw new Error('サーバーからの応答が不正です')
      }
    } catch (error) {
      console.error('SuperChat error:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      alert(`スーパーチャットの処理中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
    } finally {
      setLoading(false)
    }
  }

  const predefinedAmounts = [100, 500, 2000, 5000, 10000]

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
            <p className="text-sm text-gray-600 mb-6">メンバーシップやスーパーチャットでサポートできます。</p>

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
                    className={`px-4 py-3 rounded-lg border-2 transition-all ${amount === value
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
                メッセージ
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-pink-500 focus:ring-0 text-gray-900 placeholder-gray-400"
                rows={3}
                maxLength={100}
                placeholder="応援しています！"
              />
              <p className="text-xs text-gray-500 mt-1">最大100文字まで</p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                キャンセル
              </button>
              <button
                onClick={handleSuperChat}
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '処理中...' : '送信'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
