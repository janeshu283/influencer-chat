'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Stripeの初期化
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
console.log('Stripe publishable key:', {
  exists: !!publishableKey,
  prefix: publishableKey?.substring(0, 8)
});

if (!publishableKey) {
  console.error('Stripe publishable key is not configured');
  throw new Error('Stripe publishable key is not configured');
}

// テストモードのキーであることを確認
if (!publishableKey.startsWith('pk_test_')) {
  console.error('Invalid Stripe publishable key format - not in test mode');
  throw new Error('Invalid Stripe publishable key format - should start with pk_test_');
}

const stripePromise = loadStripe(publishableKey);

stripePromise.then(
  (stripe) => {
    console.log('Stripe initialized successfully:', {
      initialized: !!stripe
    });
  },
  (error) => console.error('Failed to initialize Stripe:', error)
);

function PaymentSection() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSetupCard = async () => {
    console.log('Button clicked');

    console.log('Starting card setup...', { user });
    if (!user) {
      alert('ログインが必要です');
      return;
    }

    try {
      setLoading(true);
      console.log('Sending setup request...');
      const response = await fetch(`${window.location.origin}/api/stripe/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      const data = await response.json();
      console.log('Setup response:', { status: response.status, data });
      if (!response.ok) {
        const errorMessage = data.error || '設定ページの読み込みに失敗しました';
        const errorDetails = data.details ? `\n詳細: ${data.details}` : '';
        throw new Error(`${errorMessage}${errorDetails}`);
      }

      // Stripeの設定ページにリダイレクト
      console.log('Redirecting to Stripe setup page:', data.url);
      window.location.href = data.url;
    } catch (error) {
      console.error('Setup error:', error);
      const errorMessage = error instanceof Error ? error.message : '予期せぬエラーが発生しました';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium">支払い方法</h3>
      <div className="mt-4 p-4 bg-white rounded-lg shadow">
        <p className="text-gray-600 mb-4">
          スーパーチャットを送信するためには、クレジットカードの登録が必要です。
        </p>
        <button
          onClick={handleSetupCard}
          disabled={loading}
          className="mt-4 bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600 disabled:opacity-50"
        >
          {loading ? '処理中...' : '支払い方法を設定'}
        </button>
      </div>
    </div>
  );
}

export default function PaymentSettings() {
  console.log('PaymentSettings rendered');
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">支払い設定</h1>
      <PaymentSection />
    </div>
  );
}
