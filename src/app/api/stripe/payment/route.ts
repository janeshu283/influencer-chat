import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { stripe } from '../../lib/stripe'
import { randomUUID } from 'crypto'

export async function POST(request: Request) {
  try {
    // リクエストからデータを受け取る
    const json = await request.json()
    const { amount, message, userId = randomUUID() } = json

    console.log('Received payment request:', json)

    // 必須パラメータのチェック
    if (!amount) {
      console.error('Missing required parameter: amount')
      return NextResponse.json(
        { error: '金額が指定されていません' },
        { status: 400 }
      )
    }

    if (amount < 100 || amount > 50000) {
      return NextResponse.json(
        { error: '金額は100円から50,000円の間で指定してください' },
        { status: 400 }
      )
    }

    // 一意のIDを生成
    const superChatId = randomUUID()

    // Stripeのチェックアウトセッションを作成
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'jpy',
            product_data: {
              name: 'スーパーチャット',
              description: message ? `メッセージ: ${message}` : '応援メッセージ'
            },
            unit_amount: amount
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/chat?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/chat?canceled=true`,
      metadata: {
        superChatId: superChatId,
        userId: userId,
        message: message || ''
      }
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error: any) {
    console.error('Payment processing error:', error)
    return NextResponse.json(
      { error: error.message || '支払い処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
