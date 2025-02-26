import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { createServerClient } from '@/utils/supabase/server'
import Stripe from 'stripe'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = headers().get('stripe-signature') as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error(`Webhook signature verification failed: ${errorMessage}`)
    return NextResponse.json({ error: `Webhook Error: ${errorMessage}` }, { status: 400 })
  }

  const supabase = createServerClient()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    if (session.metadata?.type !== 'superchat') {
      return NextResponse.json({ received: true })
    }

    try {
      const { data: superChat, error: superChatError } = await supabase
        .from('super_chats')
        .select('*')
        .eq('stripe_session_id', session.id)
        .single()

      if (superChatError || !superChat) {
        console.error('Failed to find super chat record:', superChatError)
        return NextResponse.json(
          { error: 'スーパーチャットの記録が見つかりませんでした' },
          { status: 404 }
        )
      }

      // UUIDの形式チェック
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      let validRoomId = superChat.room_id;
      
      // roomIdがUUID形式でない場合の処理
      if (!uuidRegex.test(superChat.room_id)) {
        console.error('Invalid room_id format in webhook:', superChat.room_id)
        
        try {
          const { data: roomData, error: roomError } = await supabase
            .from('chat_rooms')
            .select('id')
            .eq('id', superChat.room_id)
            .single()

          if (roomError || !roomData) {
            console.error('Failed to find room in webhook:', roomError)
            return NextResponse.json(
              { error: 'チャットルームが見つかりません' },
              { status: 404 }
            )
          }
          
          validRoomId = roomData.id
          console.log('Found valid room id in webhook:', validRoomId)
        } catch (error) {
          console.error('Error validating room id in webhook:', error)
          return NextResponse.json(
            { error: 'チャットルームの検証に失敗しました' },
            { status: 500 }
          )
        }
      }

      // スーパーチャットの状態を更新
      const { error: updateError } = await supabase
        .from('super_chats')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('stripe_session_id', session.id)

      if (updateError) {
        console.error('Failed to update super chat status:', updateError)
        return NextResponse.json(
          { error: 'Failed to update super chat status' },
          { status: 500 }
        )
      }

      // メッセージ内容を取得
      const messageContent = session.metadata.message 
        ? `スーパーチャット: ${session.amount_total ? (session.amount_total / 100) : 0}円 - "${session.metadata.message}"`
        : `スーパーチャット: ${session.amount_total ? (session.amount_total / 100) : 0}円`

      // チャットメッセージとして保存
      const { error: insertError } = await supabase
        .from('messages')
        .insert({
          room_id: validRoomId,
          user_id: session.metadata.userId,
          content: messageContent,
          type: 'superchat'
        })

      if (insertError) {
        console.error('Failed to create message:', insertError)
        return NextResponse.json(
          { error: 'Failed to create message' },
          { status: 500 }
        )
      }

      return NextResponse.json({ received: true })
    } catch (err) {
      console.error('Error processing webhook:', err)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ received: true })
}
