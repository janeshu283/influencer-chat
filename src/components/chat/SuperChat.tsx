import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface SuperChatProps {
  influencerId: string
  influencerName: string
}

export default function SuperChat({ influencerId, influencerName }: SuperChatProps) {
  const [amount, setAmount] = useState<number>(500)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const handleSuperChat = async () => {
    if (!user) {
      alert('スーパーチャットを送るにはログインが必要です')
      return
    }

    try {
      setLoading(true)
      console.log('Sending superchat request:', {
        amount,
        influencerId,
        message,
        userId: user.id,
      })

      const response = await fetch('/api/stripe/payment', {
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

      let errorData
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json()
        if (!response.ok) {
          errorData = data
          throw new Error(data.error || 'エラーが発生しました')
        }
        return data
      } else {
        const text = await response.text()
        console.error('Unexpected response:', text)
        throw new Error('サーバーからの応答が不正です')
      }

      // Stripeのチェックアウトページにリダイレクト
      window.location.href = data.url
    } catch (error) {
      console.error('SuperChat error:', error)
      alert('スーパーチャットの処理中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const predefinedAmounts = [500, 1000, 2000, 5000, 10000]

  return (
    <div className="fixed top-20 right-4 bg-white p-4 rounded-lg shadow-lg w-80 z-50">
      <h3 className="text-lg font-bold mb-4">
        {influencerName}さんにスーパーチャットを送る
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            金額を選択
          </label>
          <div className="grid grid-cols-3 gap-2">
            {predefinedAmounts.map((value) => (
              <button
                key={value}
                onClick={() => setAmount(value)}
                className={`px-2 py-1 rounded ${
                  amount === value
                    ? 'bg-pink-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                ¥{value.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            メッセージ（任意）
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
            rows={3}
            maxLength={200}
            placeholder="メッセージを入力（200文字まで）"
          />
        </div>

        <button
          onClick={handleSuperChat}
          disabled={loading}
          className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white py-3 rounded-lg shadow-lg hover:from-pink-600 hover:to-pink-700 font-bold text-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              処理中...
            </span>
          ) : (
            'スーパーチャットを送る'
          )}
        </button>
      </div>
    </div>
  )
}
