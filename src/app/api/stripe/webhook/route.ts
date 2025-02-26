import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe } from '../../../lib/stripe'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  console.log('Webhook received')
  
  const body = await req.text()
  const signature = headers().get('stripe-signature') || ''

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
    const superChatId = session.metadata?.superChatId
    const userId = session.metadata?.userId
    const message = session.metadata?.message || 'スーパーチャットありがとうございます！'
    const amount = session.amount_total
    
    if (!superChatId || !userId) {
      console.error('Missing required metadata in session', session.metadata)
      return NextResponse.json({ received: true })
    }

    // 支払い完了をログに記録
    console.log('Payment completed:', {
      superChatId,
      userId,
      message,
      amount,
      paymentStatus: session.payment_status
    })

    try {
      // 直接Supabaseクライアントを初期化
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
      
      console.log('Fetching chat rooms')
      const { data: rooms, error: roomsError } = await supabase
        .from('chat_rooms')
        .select('id')
        .limit(1)
      
      if (roomsError) {
        console.error('Error fetching chat rooms:', roomsError)
        return NextResponse.json({ error: 'Failed to fetch chat rooms' }, { status: 500 })
      }
      
      console.log('Fetched rooms:', rooms)
      const roomId = rooms && rooms.length > 0 ? rooms[0].id : null
      
      if (!roomId) {
        console.error('No chat room found')
        return NextResponse.json({ error: 'No chat room found' }, { status: 500 })
      }
      
      // スーパーチャットメッセージをチャットに追加
      const formattedAmount = new Intl.NumberFormat('ja-JP', {
        style: 'currency',
        currency: 'JPY'
      }).format(amount ? amount / 100 : 0)
      
      const superChatMessage = `💰 ${formattedAmount} スーパーチャット: ${message}`
      console.log('Inserting superchat message:', superChatMessage)
      
      const messageData = {
        chat_room_id: roomId,
        user_id: userId,
        content: superChatMessage,
        type: 'superchat',
        amount: amount ? amount / 100 : 0
      }
      
      console.log('Message data:', messageData)
      const { error: insertError } = await supabase
        .from('messages')
        .insert(messageData)

      if (insertError) {
        console.error('Failed to insert superchat message:', insertError)
        return NextResponse.json({ error: 'Failed to insert message' }, { status: 500 })
      }

      console.log('Successfully inserted superchat message')
      return NextResponse.json({ success: true })
    } catch (error: any) {
      console.error('Error processing webhook:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  // その他のイベントは正常に受信したことを返す
  return NextResponse.json({ received: true })
}
