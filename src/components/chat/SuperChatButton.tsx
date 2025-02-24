'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface SuperChatButtonProps {
  onSendSuperChat: (amount: number, message: string) => void;
}

export default function SuperChatButton({ onSendSuperChat }: SuperChatButtonProps) {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState(500); // デフォルト金額
  const [message, setMessage] = useState('');

  const amounts = [100, 500, 1000, 5000, 10000]; // 選択可能な金額

  const handleSend = () => {
    onSendSuperChat(amount, message);
    setIsModalOpen(false);
    setMessage('');
  };

  return (
    <>
      {/* スーパーチャットボタン */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white px-4 py-2.5 rounded-full flex items-center space-x-2 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 font-medium text-sm"
      >
        <span className="text-lg">💗</span>
        <span>スーパーチャット</span>
      </button>

      {/* モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="absolute top-2 right-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-2"
              >
                ✕
              </button>
            </div>
            <h3 className="text-xl font-bold mb-4">スーパーチャットを送る</h3>
            
            {/* 金額選択 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                金額を選択
              </label>
              <div className="grid grid-cols-3 gap-2">
                {amounts.map((value) => (
                  <button
                    key={value}
                    onClick={() => setAmount(value)}
                    className={`px-4 py-2 rounded ${
                      amount === value
                        ? 'bg-pink-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    ¥{value.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* メッセージ入力 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メッセージ（任意）
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                rows={3}
                maxLength={200}
                placeholder="応援メッセージを入力（200文字まで）"
              />
            </div>

            {/* ボタン */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                キャンセル
              </button>
              <button
                onClick={handleSend}
                className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600"
              >
                送信
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
