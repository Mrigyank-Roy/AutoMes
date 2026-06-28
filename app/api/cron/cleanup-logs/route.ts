import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')
  if (secret !== process.env.WORKER_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceSupabaseClient()

  const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

  const { error, count } = await supabase
    .from('dm_logs')
    .delete({ count: 'exact' })
    .lt('sent_at', cutoff)

  if (error) {
    console.error('🧹 Log cleanup failed:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log(`🧹 Deleted ${count ?? 0} dm_logs older than 14 days`)
  return NextResponse.json({ success: true, deleted: count ?? 0, cutoff })
}