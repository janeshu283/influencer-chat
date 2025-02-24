'use client';

import { useState } from 'react';

interface SuperChatButtonProps {
  onSendSuperChat: (amount: number) => Promise<void>;
}

export default function SuperChatButton({ onSendSuperChat }: SuperChatButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState(500); // デフォルト金額

  const amounts = [100, 500, 1000, 5000, 10000]; // 選択可能な金額

  const handleSend = () => {
    onSendSuperChat(amount);
    setIsModalOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-full flex items-center space-x-2 transition-all duration-200"
      >
        <span>投げ銭</span>
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">投げ銭を送る</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
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

              <div className="flex justify-end space-x-3 pt-4">
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
        </div>
      )}
    </>
  );
}
