import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not configured');
}

// シークレットキーから空白や改行を削除
const secretKey = process.env.STRIPE_SECRET_KEY.trim();

// 基本的な形式チェック
if (!secretKey.startsWith('sk_')) {
  throw new Error('Invalid Stripe secret key format');
}

export const stripe = new Stripe(secretKey, {
  apiVersion: '2025-01-27.acacia',
  typescript: true,
  timeout: 20000, // 20秒
  maxNetworkRetries: 2, // ネットワークエラー時の再試行
});
