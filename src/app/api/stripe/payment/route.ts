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

    // ユーザー情報を取得
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single()

    if (profileError || !profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'カード情報が見つかりません' },
        { status: 400 }
      )
    }

    // 支払い方法を取得
    const paymentMethods = await stripe.paymentMethods.list({
      customer: profile.stripe_customer_id,
      type: 'card',
    })

    if (paymentMethods.data.length === 0) {
      return NextResponse.json(
        { error: 'クレジットカードが登録されていません' },
        { status: 400 }
      )
    }

    // 支払いを実行
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'jpy',
      customer: profile.stripe_customer_id,
      payment_method: paymentMethods.data[0].id,
      off_session: true,
      confirm: true,
      metadata: {
        userId,
        influencerId,
        roomId,
        type: 'superchat'
      }
    })

    return NextResponse.json({
      success: true,
      paymentIntentId: paymentIntent.id
    })

  } catch (error) {
    console.error('Error in payment process:', error)
    const message = error instanceof Error ? error.message : '決済処理に失敗しました'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
