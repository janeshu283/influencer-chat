import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe/config'
import { supabase } from '@/lib/supabase/client'

export async function POST(req: Request) {
  // Webhook handling is temporarily disabled
  return NextResponse.json({ received: true })
}
