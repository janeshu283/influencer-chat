import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe } from '../../lib/stripe'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get('stripe-signature') || ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  // チェックアウトセッション完了イベントを処理
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    
    // メタデータからスーパーチャット情報を取得
    const superChatId = session.metadata?.superChatId
    const userId = session.metadata?.userId
    const message = session.metadata?.message
    
    if (!superChatId || !userId) {
      console.error('Missing required metadata in session', session.metadata)
      return NextResponse.json({ received: true })
    }

    // 支払い完了をログに記録
    console.log('Payment completed:', {
      superChatId,
      userId,
      message,
      amount: session.amount_total,
      paymentStatus: session.payment_status
    })

    // ここで必要に応じて支払い情報をデータベースに記録できます
    // 現在のMVPでは単純にログ出力のみ行います

    return NextResponse.json({ success: true })
  }

  // その他のイベントは正常に受信したことを返す
  return NextResponse.json({ received: true })
}
