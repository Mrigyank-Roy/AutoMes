import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { userId, paymentId } = await request.json()

    const supabase = createServiceSupabaseClient()

    // Mark payment as cancelled
    const { error } = await supabase
      .from('payments')
      .update({ status: 'cancelled' })
      .eq('id', paymentId)
      .eq('user_id', userId)
      .eq('is_active', false)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (err: any) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}