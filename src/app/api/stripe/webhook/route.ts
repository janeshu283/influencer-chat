import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe/config'
import { supabase } from '@/lib/supabase/client'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get('stripe-signature')!

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any

    // スーパーチャットの記録を保存
    const { error } = await supabase.from('superchat').insert({
      influencer_id: session.metadata.influencerId,
      user_id: session.metadata.userId,
      amount: session.amount_total,
      message: session.metadata.message,
      payment_status: 'completed',
      stripe_session_id: session.id,
    })

    if (error) {
      console.error('Superchat record error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
