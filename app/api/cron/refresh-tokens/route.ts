import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { refreshInstagramToken } from '@/lib/refresh-token'
import { sendTokenExpiredEmail } from '@/lib/send-email'

export async function POST(request: NextRequest) {
  // Verify secret
  const secret = request.nextUrl.searchParams.get('secret')
  if (secret !== process.env.WORKER_SECRET) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const supabase = createServiceSupabaseClient()

  // Find all tokens expiring within 10 days
  const tenDaysFromNow = new Date()
  tenDaysFromNow.setDate(tenDaysFromNow.getDate() + 10)

  const { data: expiringAccounts, error } = await supabase
    .from('instagram_accounts')
    .select(`
      id,
      ig_username,
      token_expires_at,
      user_id,
      users!inner(email)
    `)
    .lt('token_expires_at', tenDaysFromNow.toISOString())

  if (error) {
    console.error('Error fetching expiring accounts:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!expiringAccounts || expiringAccounts.length === 0) {
    console.log('✅ No tokens expiring soon')
    return NextResponse.json({ refreshed: 0, failed: 0 })
  }

  console.log(`Found ${expiringAccounts.length} tokens expiring soon`)

  let refreshed = 0
  let failed = 0

  for (const account of expiringAccounts) {
    const success = await refreshInstagramToken(account.id)

    if (success) {
      refreshed++
    } else {
      failed++
      // Send alert email to user
      const userEmail = (account.users as any)?.email
      if (userEmail) {
        await sendTokenExpiredEmail(userEmail, account.ig_username)
      }
    }
  }

  console.log(`Token refresh complete: ${refreshed} refreshed, ${failed} failed`)
  return NextResponse.json({ refreshed, failed })
}