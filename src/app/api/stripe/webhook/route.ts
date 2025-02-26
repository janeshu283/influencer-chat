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

      // チャットメッセージとして保存
      const { error: insertError } = await supabase
        .from('messages')
        .insert({
          room_id: session.metadata.roomId,
          user_id: session.metadata.userId,
          content: `スーパーチャット: ${session.amount_total}円`,
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
