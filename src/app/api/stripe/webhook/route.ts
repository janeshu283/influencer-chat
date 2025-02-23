import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe/config'
import { supabase } from '@/lib/supabase/client'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get('stripe-signature')!

  let event: any

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 })
  }

  console.log('Webhook event received:', event.type);

  switch (event.type as 'checkout.session.completed' | 'setup_intent.succeeded' | 'setup_intent.setup_failed') {
    case 'checkout.session.completed': {
      const session = event.data.object as any;

      // スーパーチャットの記録を保存
      const { error } = await supabase.from('superchat').insert({
        influencer_id: session.metadata.influencerId,
        user_id: session.metadata.userId,
        amount: session.amount_total / 100, // Stripeは金額を最小単位（円）で扱うため100で割る
        message: session.metadata.message || '',
        payment_status: 'completed',
        stripe_session_id: session.id,
      });

      if (error) {
        console.error('Superchat record error:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }
      break;
    }

    case 'setup_intent.succeeded': {
      const setupIntent = event.data.object as any;
      console.log('Card setup succeeded:', {
        customerId: setupIntent.customer,
        paymentMethodId: setupIntent.payment_method,
      });

      // カード情報の更新を記録
      const { error } = await supabase.from('profiles')
        .update({ 
          has_valid_card: true,
          stripe_payment_method_id: setupIntent.payment_method,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_customer_id', setupIntent.customer);

      if (error) {
        console.error('Profile update error:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }
      break;
    }

    case 'setup_intent.setup_failed': {
      const setupIntent = event.data.object as any;
      console.error('Card setup failed:', {
        customerId: setupIntent.customer,
        error: setupIntent.last_setup_error,
      });
      break;
    }
  }

  return NextResponse.json({ received: true })
}
