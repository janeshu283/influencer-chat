import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe } from '../../../lib/stripe'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  console.log('Webhook received')
  
  const body = await req.text()
  const signature = headers().get('stripe-signature') || ''

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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    console.log('Session data:', JSON.stringify(session, null, 2))
    
    // metadata に必要な情報が入っているか確認
    const superChatId = session.metadata?.superChatId
    const userId = session.metadata?.userId
    const influencerId = session.metadata?.influencerId
    const message = session.metadata?.message || 'スーパーチャットありがとうございます！'
    const amount = session.amount_total

    if (!superChatId || !userId || !influencerId) {
      console.error('Missing required metadata in session', session.metadata)
      return NextResponse.json({ received: true })
    }

    console.log('Payment completed:', {
      superChatId,
      userId,
      influencerId,
      message,
      amount,
      paymentStatus: session.payment_status
    })

    try {
      if (
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ) {
        throw new Error('Supabase credentials are not configured')
      }
      
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
      
      // super_chats テーブルへ直接データを挿入する
      const superChatData = {
        id: superChatId, // metadata で生成した一意のID
        user_id: userId,
        influencer_id: influencerId,
        // チャットルームとの紐付けが不要な場合は null または不要にする
        room_id: null,
        amount: amount ? amount / 100 : 0, // 単位は円に変換
        message: message,
        status: session.payment_status, // 例: "paid"
        stripe_session_id: session.id,
        created_at: new Date().toISOString()
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