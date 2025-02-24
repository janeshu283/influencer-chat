import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-01-27.acacia',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

export async function POST(req: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'サービスの初期化に失敗しました' }, { status: 500 })
    }

    const body = await req.json()
    const { amount, influencerId, userId, roomId } = body

    if (!amount || !influencerId || !userId || !roomId) {
      return NextResponse.json({ error: '必要な情報が不足しています' }, { status: 400 })
    }

    if (amount < 100 || amount > 50000) {
      return NextResponse.json(
        { error: '金額は100円から50,000円の間で指定してください' },
        { status: 400 }
      )
    }

    const { data: influencer, error: influencerError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', influencerId)
      .single()

    if (influencerError || !influencer) {
      return NextResponse.json(
        { error: 'インフルエンサーが見つかりません' },
        { status: 404 }
      )
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'jpy',
            product_data: {
              name: `${influencer.nickname || 'インフルエンサー'}さんへの投げ銭`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/chat/${roomId}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/chat/${roomId}`,
      metadata: {
        influencerId,
        userId,
        roomId,
      },
    })

    return NextResponse.json({ url: session.url })

  } catch (error) {
    console.error('Error in payment process:', error)
    return NextResponse.json(
      { error: '決済処理に失敗しました' },
      { status: 500 }
    )
  }
}
