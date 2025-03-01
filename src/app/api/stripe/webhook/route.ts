// /src/app/api/stripe/webhook/route.ts

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe } from '../../../lib/stripe'
import { createClient } from '@supabase/supabase-js'
import type { SuperChat } from '@/types/supabase'

export async function POST(req: Request) {
  console.log('Webhook received')
  
  // リクエストボディと署名の取得
  const body = await req.text()
  const signature = (await headers()).get('stripe-signature') || ''
  
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('Missing STRIPE_WEBHOOK_SECRET environment variable')
    return NextResponse.json({ error: 'Webhook secret is not configured' }, { status: 500 })
  }
  
  // Stripe のウェブフックイベントを検証
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
    console.log('Webhook event type:', event.type)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
  
  // チェックアウトセッション完了イベントの場合
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    console.log('Session data:', JSON.stringify(session, null, 2))
    
    // metadata から必要な情報を取得
    const superChatId = session.metadata?.superChatId
    const userId = session.metadata?.userId
    const influencerId = session.metadata?.influencerId
    const roomId = session.metadata?.roomId
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
      // Supabase クライアントの作成
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      // SuperChat 型に合わせたデータ構造
      const superChatData: SuperChat = {
        id: superChatId,
        user_id: userId,
        influencer_id: influencerId,
        room_id: roomId || null, // undefinedの場合はnullを設定
        amount: amount ? amount / 100 : 0, // 金額を円単位に変換（Stripe は最小通貨単位）
        message: message,
        status: session.payment_status, // 例: "paid"
        stripe_session_id: session.id,
        created_at: new Date().toISOString(),
        user: undefined
      }
      
      console.log('Inserting super chat data:', superChatData)
      
      // テーブル名 "super_chats" を使用してデータを挿入
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
  
  // その他のイベントは正常に受け取ったことを返す
  return NextResponse.json({ received: true })
}