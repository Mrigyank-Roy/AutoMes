import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const supabase = createServiceSupabaseClient()

  // 1) Prune old DM logs (older than 14 days)
  const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  const { error: logsError, count: logsDeleted } = await supabase
    .from('dm_logs')
    .delete({ count: 'exact' })
    .lt('sent_at', cutoff)

  if (logsError) {
    console.error('Log cleanup failed:', logsError)
  } else {
    console.log(`🧹 Deleted ${logsDeleted ?? 0} dm_logs older than 14 days`)
  }

  // 2) Prune expired follow-gate conversations
  const { error: convError, count: convDeleted } = await supabase
    .from('dm_conversations')
    .delete({ count: 'exact' })
    .lt('expires_at', new Date().toISOString())

  if (convError) {
    console.error('Conversation cleanup failed:', convError)
  } else {
    console.log(`🧹 Deleted ${convDeleted ?? 0} expired dm_conversations`)
  }

  return NextResponse.json({
    success: !logsError && !convError,
    logsDeleted: logsDeleted ?? 0,
    conversationsDeleted: convDeleted ?? 0,
  })
}