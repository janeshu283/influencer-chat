import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { stripe } from '@/lib/stripe'

export async function POST(request: Request) {
  try {
    // リクエストからデータを受け取る
    const json = await request.json()
    const { amount, message, influencerId, roomId } = json

    console.log('Received payment request:', json)

    // リクエストヘッダーからトークンを取得
    const supabase = createRouteHandlerClient({ cookies })
    
    // ユーザー認証
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Authentication error:', authError)
      return NextResponse.json(
        { error: '認証エラー: ログインしてください' },
        { status: 401 }
      )
    }

    // 必須パラメータのチェック
    if (!amount || !influencerId || !roomId) {
      console.error('Missing required parameters:', { amount, influencerId, roomId })
      return NextResponse.json(
        { error: '必須パラメータが不足しています' },
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
        message: message || null,
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

    // Stripeのチェックアウトセッションを作成
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'jpy',
            product_data: {
              name: 'スーパーチャット',
              description: message ? `メッセージ: ${message}` : '応援メッセージ'
            },
            unit_amount: amount
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/chat/${roomId}?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/chat/${roomId}?canceled=true`,
      metadata: {
        superChatId: superChat.id,
        userId: user.id,
        influencerId: influencerId,
        roomId: roomId,
        message: message || ''
      }
    })

    // セッションIDを保存
    const { error: updateError } = await supabase
      .from('super_chats')
      .update({ stripe_session_id: checkoutSession.id })
      .eq('id', superChat.id)

    if (updateError) {
      console.error('Failed to update super chat with session ID:', updateError)
      // エラーがあっても処理は続行
    }

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error: any) {
    console.error('Payment processing error:', error)
    return NextResponse.json(
      { error: error.message || '支払い処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
