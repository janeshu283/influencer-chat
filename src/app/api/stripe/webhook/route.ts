import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe } from '../../../lib/stripe'
import { createClient } from '../../../lib/supabase/server'

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
    
    // メタデータからスーパーチャットIDを取得
    const superChatId = session.metadata?.superChatId
    if (!superChatId) {
      console.error('No superChatId found in session metadata')
      return NextResponse.json({ received: true })
    }

    try {
      // Supabaseクライアントを初期化
      const supabase = createClient()
      
      // スーパーチャットのステータスを更新
      const { error: updateError } = await supabase
        .from('super_chats')
        .update({
          status: 'completed',
          stripe_session_id: session.id
        })
        .eq('id', superChatId)

      if (updateError) {
        console.error('Failed to update super chat status:', updateError)
        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
      }

      // メッセージを作成（オプション）
      const messageContent = session.metadata?.message
        ? `スーパーチャット: ${session.metadata.message}`
        : 'スーパーチャットありがとうございます！'

      // メッセージをチャットに追加
      const { error: insertError } = await supabase
        .from('messages')
        .insert({
          room_id: session.metadata?.roomId,
          user_id: session.metadata?.userId,
          content: messageContent,
          type: 'superchat'
        })

      if (insertError) {
        console.error('Failed to insert message:', insertError)
        // メッセージ挿入エラーは無視して処理を続行
      }

      return NextResponse.json({ success: true })
    } catch (error: any) {
      console.error('Error processing webhook:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  // その他のイベントは正常に受信したことを返す
  return NextResponse.json({ received: true })
}
