import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface SuperChatProps {
  influencerId?: string
  influencerName?: string
  roomId?: string
}

export default function SuperChat({ influencerId, influencerName }: SuperChatProps) {
  const [amount, setAmount] = useState<number>(500)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const router = useRouter()

  const predefinedAmounts = [100, 500, 2000, 5000, 10000]

  const handleSuperChat = async () => {
    try {
      setLoading(true)

      // デバッグ: 送信データを確認
      console.log('Sending superchat data:', {
        amount,
        message
      })

      // 必須パラメータのチェック
      if (!amount) {
        throw new Error('金額が指定されていません')
      }

      // 支払い処理を開始
      const response = await fetch('/api/stripe/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount,
          message
        })
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('API response error:', data)
        throw new Error(data.error || '支払い処理中にエラーが発生しました')
      }

      if (!data.sessionUrl) {
        throw new Error('Stripeの支払いURLが見つかりません')
      }

      // Stripeのチェックアウトページに遷移
      window.location.href = data.sessionUrl

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
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {influencerName ? `${influencerName}にスーパーチャットを送る` : 'スーパーチャットを送る'}
            </h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                金額 (円)
              </label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {predefinedAmounts.map((presetAmount) => (
                  <button
                    key={presetAmount}
                    type="button"
                    onClick={() => setAmount(presetAmount)}
                    className={`py-2 px-3 rounded-md text-sm ${
                      amount === presetAmount
                        ? 'bg-pink-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    ¥{presetAmount.toLocaleString()}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="100"
                max="50000"
                value={amount}
                onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                100円から50,000円まで指定できます
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                メッセージ (任意)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
                placeholder="応援メッセージを入力してください"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleSuperChat}
                disabled={loading || amount < 100}
                className="px-4 py-2 text-sm font-medium text-white bg-pink-500 rounded-md hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '処理中...' : '送信する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
