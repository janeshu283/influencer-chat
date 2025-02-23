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

export async function GET(req: Request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: 'ユーザーIDが必要です' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json', ...headers }
        }
      );
    }

    // ユーザーのStripe Customer IDを取得
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return new NextResponse(
        JSON.stringify({ error: 'ユーザー情報の取得に失敗しました' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json', ...headers }
        }
      );
    }

    // Customer IDがない場合
    if (!profile?.stripe_customer_id) {
      return new NextResponse(
        JSON.stringify({ hasCard: false }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json', ...headers }
        }
      );
    }

    // Stripeから支払い方法を取得
    const paymentMethods = await stripe.paymentMethods.list({
      customer: profile.stripe_customer_id,
      type: 'card',
    });

    return new NextResponse(
      JSON.stringify({ 
        hasCard: paymentMethods.data.length > 0,
        cardCount: paymentMethods.data.length
      }),
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
