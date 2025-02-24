import { useState } from 'react';
import { Dialog } from '@headlessui/react';

interface SuperChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: number) => Promise<void>;
  isLoading?: boolean;
}

const AMOUNTS = [100, 500, 1000, 2000, 5000, 10000];

export default function SuperChatDialog({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false
}: SuperChatDialogProps) {
  const [amount, setAmount] = useState<number>(500);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const finalAmount = customAmount ? parseInt(customAmount, 10) : amount;

    if (isNaN(finalAmount) || finalAmount < 100 || finalAmount > 50000) {
      setError('金額は100円から50,000円の間で指定してください');
      return;
    }

    try {
      await onSubmit(finalAmount);
      onClose();
      setCustomAmount('');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('エラーが発生しました');
      }
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
          <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
            スーパーチャットを送る
          </Dialog.Title>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {AMOUNTS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setAmount(value);
                    setCustomAmount('');
                  }}
                  className={`py-2 px-4 rounded-lg border ${
                    amount === value && !customAmount
                      ? 'bg-pink-600 text-white border-pink-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  ¥{value.toLocaleString()}
                </button>
              ))}
            </div>

            <div className="mb-4">
              <label htmlFor="customAmount" className="block text-sm font-medium text-gray-700">
                カスタム金額
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">¥</span>
                </div>
                <input
                  type="number"
                  name="customAmount"
                  id="customAmount"
                  className="block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                  placeholder="金額を入力"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setAmount(0);
                  }}
                  min="100"
                  max="50000"
                  step="100"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">円</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-pink-600 hover:bg-pink-700'
                }`}
              >
                {isLoading ? '処理中...' : '送信'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
