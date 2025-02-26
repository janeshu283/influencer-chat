import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServerClient } from '@/utils/supabase/server'

interface PaymentRequestBody {
  amount: number
  influencerId: string
  roomId: string
}

export async function POST(request: Request) {
  try {
    const json = await request.json() as PaymentRequestBody
    const { amount, influencerId, roomId } = json

    // リクエストヘッダーからトークンを取得
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'ユーザー認証が必要です' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const supabase = createServerClient()

    // トークンを使用してユーザー情報を取得
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      console.error('Authentication error:', authError)
      return NextResponse.json(
        { error: 'ユーザー認証が必要です' },
        { status: 401 }
      )
    }

    if (!amount || !influencerId || !roomId) {
      return NextResponse.json(
        { error: '必要な情報が不足しています' },
        { status: 400 }
      )
    }

    if (amount < 100 || amount > 50000) {
      return NextResponse.json(
        { error: '金額は100円から50,000円の間で指定してください' },
        { status: 400 }
      )
    }

    // スーパーチャットの記録を作成
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
      .single()

    if (insertError || !superChat) {
      console.error('Failed to create super chat record:', insertError)
      return NextResponse.json(
        { error: 'スーパーチャットの記録作成に失敗しました' },
        { status: 500 }
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
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/chat/${roomId}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/chat/${roomId}?canceled=true`,
      metadata: {
        userId: user.id,
        influencerId,
        roomId,
        superChatId: superChat.id,
        type: 'superchat'
      },
    })

    // セッションIDを記録
    const { error: updateError } = await supabase
      .from('super_chats')
      .update({
        stripe_session_id: checkoutSession.id
      })
      .eq('id', superChat.id)

    if (updateError) {
      console.error('Failed to update session ID:', updateError)
      // エラーはログに記録するだけ
    }

    return NextResponse.json({
      url: checkoutSession.url
    })

  } catch (err) {
    console.error('Payment error:', err)
    if (err instanceof stripe.errors.StripeError) {
      return NextResponse.json(
        { error: err.message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: '支払い処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
