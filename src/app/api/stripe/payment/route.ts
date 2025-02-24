import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createServerClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

interface PaymentRequestBody {
  amount: number;
  influencerId: string;
  roomId: string;
}

export async function POST(request: Request) {
  try {
    const json = await request.json() as PaymentRequestBody;
    const { amount, influencerId, roomId } = json;

    const supabase = createServerClient();

    // セッショントークンを取得
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.error('Authentication error:', sessionError);
      return NextResponse.json(
        { error: 'ユーザー認証が必要です' },
        { status: 401 }
      );
    }

    const user = session.user;
    if (!user) {
      return NextResponse.json(
        { error: 'ユーザー情報が見つかりません' },
        { status: 401 }
      );
    }

    if (!amount || !influencerId || !roomId) {
      return NextResponse.json({ error: '必要な情報が不足しています' }, { status: 400 })
    }

    if (amount < 100 || amount > 50000) {
      return NextResponse.json(
        { error: '金額は100円から50,000円の間で指定してください' },
        { status: 400 }
      )
    }

    // ユーザー情報を取得
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'カード情報が見つかりません' },
        { status: 400 }
      )
    }

    // 支払い方法を取得
    const paymentMethods = await stripe.paymentMethods.list({
      customer: profile.stripe_customer_id,
      type: 'card',
    })

    if (paymentMethods.data.length === 0) {
      return NextResponse.json(
        { error: 'クレジットカードが登録されていません' },
        { status: 400 }
      )
    }

    // 支払いを実行
    // スーパーチャットをデータベースに保存
    const { data: superChat, error: insertError } = await supabase
      .from('super_chats')
      .insert({
        user_id: user.id,
        influencer_id: influencerId,
        room_id: roomId,
        amount: amount,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create super chat:', insertError);
      return NextResponse.json(
        { error: 'スーパーチャットの作成に失敗しました' },
        { status: 500 }
      );
    }

    // 支払いを実行
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'jpy',
      customer: profile.stripe_customer_id,
      payment_method: paymentMethods.data[0].id,
      off_session: true,
      confirm: true,
      metadata: {
        superChatId: superChat.id,
        userId: user.id,
        influencerId,
        roomId,
        type: 'superchat'
      }
    })

    // スーパーチャットのステータスを更新
    const { error: updateError } = await supabase
      .from('super_chats')
      .update({
        status: paymentIntent.status,
        payment_intent_id: paymentIntent.id
      })
      .eq('id', superChat.id);

    if (updateError) {
      console.error('Failed to update super chat status:', updateError);
      // 支払いは成功しているので、エラーはログに記録するだけ
    }

    return NextResponse.json({
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status
      },
      superChat: {
        id: superChat.id,
        amount: superChat.amount
      }
    })

  } catch (err) {
    console.error('Payment error:', err);
    if (err instanceof stripe.errors.StripeError) {
      return NextResponse.json(
        { error: err.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: '支払い処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
