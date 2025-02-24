import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SuperChatFormProps {
  onSendSuperChat: (amount: number) => Promise<void>;
  isLoading?: boolean;
}

export default function SuperChatForm({ onSendSuperChat, isLoading = false }: SuperChatFormProps) {
  const [amount, setAmount] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (amount < 100) {
      setError('最低金額は100円です');
      return;
    }

    try {
      await onSendSuperChat(amount);
      setAmount(0); // Reset form after successful submission
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('エラーが発生しました');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4 bg-white rounded-lg shadow">
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
          金額 (円)
        </label>
        <div className="mt-1">
          <input
            type="number"
            name="amount"
            id="amount"
            min="100"
            step="100"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
            disabled={isLoading}
          />
        </div>
      </div>

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      <button
        type="submit"
        disabled={isLoading || amount < 100}
        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
          ${isLoading ? 'bg-gray-400' : 'bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500'}`}
      >
        {isLoading ? '処理中...' : 'スーパーチャットを送信'}
      </button>
    </form>
  );
}
