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

    // チェックアウトセッションを作成
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'jpy',
            product_data: {
              name: 'スーパーチャット',
              description: `${amount}円のスーパーチャット`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/chat/${roomId}?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/chat/${roomId}?canceled=true`,
      metadata: {
        userId: user.id,
        influencerId,
        roomId,
        type: 'superchat'
      },
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
      sessionId: checkoutSession.id,
      sessionUrl: checkoutSession.url
    });

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
