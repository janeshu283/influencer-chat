import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

async function checkCard(userId: string) {
  // ユーザーのStripe Customer IDを取得
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (profileError) {
    console.error('Profile fetch error:', profileError);
    throw new Error('ユーザー情報の取得に失敗しました');
  }

  // Customer IDがない場合
  if (!profile?.stripe_customer_id) {
    return { hasCard: false };
  }

  // Stripeから支払い方法を取得
  const paymentMethods = await stripe.paymentMethods.list({
    customer: profile.stripe_customer_id,
    type: 'card',
  });

  return { 
    hasCard: paymentMethods.data.length > 0,
    cardCount: paymentMethods.data.length,
    defaultPaymentMethod: paymentMethods.data[0]?.id
  };
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url, `https://${req.headers.get('host')}`);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: 'ユーザーIDが必要です' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json', ...headers }
        }
      );
    }

    const result = await checkCard(userId);
    return new NextResponse(
      JSON.stringify(result),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json', ...headers }
      }
    );

  } catch (error) {
    console.error('Check card error:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'カード情報の確認中にエラーが発生しました',
        details: error instanceof Error ? error.message : undefined
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json', ...headers }
      }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: 'ユーザーIDが必要です' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json', ...headers }
        }
      );
    }

    const result = await checkCard(userId);
    return new NextResponse(
      JSON.stringify(result),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json', ...headers }
      }
    );

  } catch (error) {
    console.error('Check card error:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'カード情報の確認中にエラーが発生しました',
        details: error instanceof Error ? error.message : undefined
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json', ...headers }
      }
    );
  }
}
