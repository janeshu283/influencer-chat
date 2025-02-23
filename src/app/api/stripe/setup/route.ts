import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Supabaseの初期化
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Stripeの初期化
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not configured');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY.trim(), {
  apiVersion: '2023-10-16',
  typescript: true,
});

export async function POST(req: Request) {
  console.log('POST /api/stripe/setup - Start');

  try {
    // リクエストボディのパース
    const body = await req.json();
    const { userId } = body;
    console.log('Request body:', { userId });

    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: 'ユーザーIDが必要です' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // ユーザー情報を取得
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, stripe_customer_id')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return new NextResponse(
        JSON.stringify({ 
          error: 'ユーザー情報の取得に失敗しました',
          details: profileError.message
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!profile?.email) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'メールアドレスが設定されていません'
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    try {
      // 既存のStripeカスタマーIDを確認
      let customerId = profile.stripe_customer_id;
      
      if (!customerId) {
        // 新規カスタマーを作成
        const customer = await stripe.customers.create({
          email: profile.email,
          metadata: { userId }
        });
        customerId = customer.id;
        
        // カスタマーIDを保存
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', userId);
          
        if (updateError) {
          throw new Error(`Failed to save customer ID: ${updateError.message}`);
        }
      }

      // セッションを作成
      const origin = req.headers.get('origin') || 'http://localhost:3000';
      const session = await stripe.checkout.sessions.create({
        mode: 'setup',
        payment_method_types: ['card'],
        customer: customerId,
        success_url: `${origin}/settings/payment?setup=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/settings/payment?setup=canceled`,
      });

      return new NextResponse(
        JSON.stringify({
          url: session.url,
          sessionId: session.id,
          customerId
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );

    } catch (stripeError) {
      console.error('Stripe error:', stripeError);
      return new NextResponse(
        JSON.stringify({ 
          error: 'カード設定の準備中にエラーが発生しました',
          details: stripeError instanceof Error ? stripeError.message : '予期せぬエラーが発生しました'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('Request error:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'リクエストの処理中にエラーが発生しました',
        details: error instanceof Error ? error.message : '予期せぬエラーが発生しました'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
