import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// 初期化関数を作成
const initializeStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY is not set')
    return null
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-01-27.acacia',
  })
}

// 初期化関数を作成
const initializeSupabase = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Supabase environment variables are not set')
    return null
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

// StripeとSupabaseを初期化
const stripe = initializeStripe()
const supabase = initializeSupabase()

if (!stripe || !supabase) {
  throw new Error('Failed to initialize required services')
}



export async function POST(req: Request) {
  const stripe = initializeStripe()
  const supabase = initializeSupabase()

  // CORSヘッダーを設定
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  // OPTIONSリクエストに対応
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { headers })
  }

  try {
    if (!stripe || !supabase) {
      console.error('Required services are not initialized')
      return new NextResponse(
        JSON.stringify({ error: 'Service configuration error' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json', ...headers }
        }
      )
    }
    const body = await req.json()
    const { amount, influencerId, message, userId } = body

    if (!amount || !influencerId || !userId) {
      return new NextResponse(
        JSON.stringify({ error: 'Required fields are missing' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // 支払い金額のバリデーション
    if (amount < 100 || amount > 50000) {
      return NextResponse.json(
        { error: '支払い金額は100円から50,000円の間で指定してください' },
        { status: 400 }
      )
    }

    // インフルエンサーの情報を取得
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

    // Stripeの支払いセッションを作成
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'jpy',
            product_data: {
              name: `${influencer.nickname}さんへのスーパーチャット`,
              description: message || 'スーパーチャットメッセージ',
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/chat?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/chat`,
      metadata: {
        influencerId,
        userId,
        message,
      },
    })

    return new NextResponse(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      }
    )
  } catch (error) {
    console.error('Payment error:', error)
    return new NextResponse(
      JSON.stringify({ error: '支払い処理中にエラーが発生しました' }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      }
    )
  }
}
