import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// 初期化関数を作成
const initializeStripe = () => {
  console.log('Initializing Stripe with config:', {
    hasKey: !!process.env.STRIPE_SECRET_KEY,
    keyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 7),
  })

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY is not set')
    return null
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-01-27.acacia',
    })
    console.log('Stripe initialized successfully')
    return stripe
  } catch (error) {
    console.error('Failed to initialize Stripe:', error)
    return null
  }
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
    // 環境変数のチェック
    console.log('Checking environment variables:', {
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
      stripeKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 3),
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    })

    // 初期化チェック
    if (!stripe) {
      console.error('Stripe is not initialized')
      return new NextResponse(
        JSON.stringify({ 
          error: 'Service configuration error', 
          details: 'Stripe is not initialized. Check STRIPE_SECRET_KEY.'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json', ...headers }
        }
      )
    }

    if (!supabase) {
      console.error('Supabase is not initialized')
      return new NextResponse(
        JSON.stringify({ 
          error: 'Service configuration error',
          details: 'Supabase is not initialized. Check Supabase environment variables.'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json', ...headers }
        }
      )
    }
    // リクエストのチェック
    const origin = req.headers.get('origin')
    console.log('Request origin:', origin)
    console.log('Request headers:', Object.fromEntries(req.headers.entries()))

    const body = await req.json()
    console.log('Request body:', body)
    const { amount, influencerId, message, userId, roomId } = body

    if (!amount || !influencerId || !userId || !roomId) {
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
    console.log('Fetching influencer data:', { influencerId })
    const { data: influencer, error: influencerError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', influencerId)
      .single()

    console.log('Influencer data result:', { influencer, error: influencerError })

    if (influencerError || !influencer) {
      return NextResponse.json(
        { error: 'インフルエンサーが見つかりません' },
        { status: 404 }
      )
    }

    console.log('Creating Stripe session with data:', {
      amount,
      influencerId,
      userId,
      message: message || undefined
    })

    // インフルエンサーの情報を取得する前にログ出力
    console.log('About to fetch influencer data:', { influencerId })

    // ユーザーのStripe Customer IDを取得
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single()

    if (profileError || !profile?.stripe_customer_id) {
      return new NextResponse(
        JSON.stringify({ error: 'カード情報が登録されていません' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json', ...headers }
        }
      )
    }

    // Stripeの支払いセッションを作成
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: profile.stripe_customer_id,
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
      success_url: `${req.headers.get('origin')}/chat?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/chat`,
      metadata: {
        influencerId,
        userId,
        roomId,
        message: message || '',
      },
    }

    console.log('Creating Stripe session with config:', sessionConfig)

    try {
      console.log('Attempting to create Stripe session...')
      const session = await stripe.checkout.sessions.create(sessionConfig)
      console.log('Stripe session created successfully:', {
        id: session.id,
        hasUrl: !!session.url
      })

      if (!session.url) {
        console.error('Stripe session created but URL is missing:', session)
        throw new Error('Stripe checkout URL is missing')
      }

      // セッション情報を一時保存
      const { error: sessionError } = await supabase
        .from('stripe_sessions')
        .insert({
          session_id: session.id,
          user_id: userId,
          influencer_id: influencerId,
          amount: amount,
          message: message || '',
          status: 'pending'
        })

      if (sessionError) {
        console.error('Failed to save session info:', sessionError)
      }

      return new NextResponse(
        JSON.stringify({ 
          sessionId: session.id, 
          url: session.url,
          status: 'success'
        }),
        { 
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...headers
          }
        }
      )
    } catch (stripeError) {
      console.error('Stripe session creation error:', stripeError)
      return new NextResponse(
        JSON.stringify({ 
          error: '支払い処理中にエラーが発生しました',
          details: stripeError instanceof Error ? stripeError.message : 'Unknown Stripe error'
        }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...headers
          }
        }
      )
    }
  } catch (error) {
    // 詳細なエラー情報をログ出力
    const errorDetails = {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      raw: error
    }
    console.error('Payment error details:', errorDetails)

    // Stripe特有のエラーの場合
    if (error instanceof Error && 'type' in error) {
      console.error('Stripe specific error:', {
        type: (error as any).type,
        code: (error as any).code,
        decline_code: (error as any).decline_code,
        param: (error as any).param
      })
    }
    return new NextResponse(
      JSON.stringify({
        error: '支払い処理中にエラーが発生しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
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
