// /src/app/api/stripe/webhook/route.ts
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe } from '../../../lib/stripe'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  console.log('Webhook received')

  const body = await req.text()
  const signature = (await headers()).get('stripe-signature') || ''

  // webhook secretが設定されていない場合のエラーハンドリング
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('Missing STRIPE_WEBHOOK_SECRET environment variable')
    return NextResponse.json(
      { error: 'Webhook secret is not configured' },
      { status: 500 }
    )
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
    console.log('Webhook event type:', event.type)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  // チェックアウトセッション完了イベントを処理
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    console.log('Session data:', JSON.stringify(session, null, 2))
    
    // メタデータからスーパーチャット情報を取得
    // ※ この実装では、metadataに influencerId も設定している前提です
    const superChatId = session.metadata?.superChatId  // （必要に応じて使用）
    const userId = session.metadata?.userId
    const influencerId = session.metadata?.influencerId
    const message = session.metadata?.message || 'スーパーチャットありがとうございます！'
    const amount = session.amount_total

    if (!userId || !influencerId) {
      console.error('Missing required metadata in session', session.metadata)
      return NextResponse.json({ received: true })
    }

    // 支払い完了をログに記録
    console.log('Payment completed:', {
      superChatId,
      userId,
      influencerId,
      message,
      amount,
      paymentStatus: session.payment_status
    })

    try {
      // Supabaseクライアントの初期化
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error('Supabase credentials are not configured')
      }
      
      console.log('Initializing Supabase client with:', {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL
      })
      
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
      
      // super_chats テーブルへ直接挿入する
      const superChatData = {
        user_id: userId,
        influencer_id: influencerId,
        room_id: null,  // チャットルームとの紐付けを解除
        amount: amount ? amount / 100 : 0, // 必要に応じて単位変換
        message: message,
        stripe_session_id: session.id,
      }
      
      console.log('Inserting super chat data:', superChatData)
      
      const { error: insertError } = await supabase
        .from('super_chats')
        .insert(superChatData)
      
      if (insertError) {
        console.error('Failed to insert super chat:', insertError)
        return NextResponse.json({ error: 'Failed to insert super chat' }, { status: 500 })
      }

      console.log('Successfully inserted super chat')
      return NextResponse.json({ success: true })
    } catch (error: any) {
      console.error('Error processing webhook:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  // その他のイベントは正常に受信したことを返す
  return NextResponse.json({ received: true })
}