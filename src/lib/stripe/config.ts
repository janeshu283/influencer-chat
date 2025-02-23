import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not configured');
}

// シークレットキーから空白や改行を削除
const secretKey = process.env.STRIPE_SECRET_KEY.trim();

// 基本的な形式チェック
if (!/^sk_test_[A-Za-z0-9]+$/.test(secretKey)) {
  throw new Error('Invalid Stripe secret key format');
}

export const stripe = new Stripe(secretKey, {
  apiVersion: '2023-10-16',
  typescript: true,
  timeout: 20000,
  maxNetworkRetries: 2,
});

