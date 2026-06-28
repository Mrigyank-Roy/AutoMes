import { NextRequest, NextResponse } from 'next/server'
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { decrypt } from '@/lib/encryption'
import { refreshInstagramToken } from '@/lib/refresh-token'

async function handler(request: NextRequest) {
  const workerSecret = request.headers.get('x-worker-secret')
  if (workerSecret !== process.env.WORKER_SECRET) {
    console.error('Unauthorized worker request')
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const job = await request.json()
  const {
    automationId,
    commenterId,
    commenterUsername,
    commentId,
    igAccountId,
    igDbAccountId,
    tokenExpiresAt: tokenExpiresAtStr,
    accessTokenEnc: initialTokenEnc,
    userId,
    dmMessage,
    dmButtons,
    replyEnabled,
    replyMessages,
  } = job

  let accessTokenEnc = initialTokenEnc

  const supabase = createServiceSupabaseClient()

  try {
    // Step 1 — Duplicate check (only block if a DM was ACTUALLY sent before)
    const { data: existingLog } = await supabase
      .from('dm_logs')
      .select('id')
      .eq('automation_id', automationId)
      .eq('commenter_ig_id', commenterId)
      .eq('status', 'sent')
      .maybeSingle()

    if (existingLog) {
      console.log(`Already sent DM to ${commenterUsername} for automation ${automationId} — skipping`)
      return NextResponse.json({ skipped: true, reason: 'duplicate' })
    }

    // Step 1b — Opt-out check
    const { data: isOptedOut } = await supabase
      .from('dm_optouts')
      .select('id')
      .eq('ig_account_id', igAccountId)
      .eq('blocked_commenter_ig_id', commenterId)
      .maybeSingle()

    if (isOptedOut) {
      console.log(`User ${commenterId} is on opt-out list — skipping`)
      return NextResponse.json({ skipped: true, reason: 'opted_out' })
    }

    // Step 2 — DM limit
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!subscription) {
      console.error('No subscription found for user:', userId)
      return new NextResponse('No subscription', { status: 400 })
    }

    if (subscription.dms_used_this_month >= subscription.dm_limit_monthly) {
      console.log(`User ${userId} has hit their DM limit — skipping`)
      await supabase.from('dm_logs').insert({
        automation_id: automationId,
        user_id: userId,
        commenter_ig_id: commenterId,
        commenter_username: commenterUsername,
        status: 'limit_reached',
      })
      return NextResponse.json({ skipped: true, reason: 'limit_reached' })
    }

    // Step 3 — Refresh token if expiring soon
    if (tokenExpiresAtStr) {
      const tokenExpiresAt = new Date(tokenExpiresAtStr)
      const daysUntilExpiry = Math.floor(
        (tokenExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )

      if (daysUntilExpiry < 10) {
        console.log(`Token expiring in ${daysUntilExpiry} days — refreshing now`)
        await refreshInstagramToken(igDbAccountId)

        const { data: updatedAccount } = await supabase
          .from('instagram_accounts')
          .select('access_token_enc')
          .eq('id', igDbAccountId)
          .single()

        if (updatedAccount) {
          accessTokenEnc = updatedAccount.access_token_enc
        }
      }
    }

    // Step 4 — Decrypt token
    const accessToken = decrypt(accessTokenEnc)

    // Step 5 — Build the message.
    // Up to 3 web_url buttons (Meta's max). Falls back to plain text if none.
    const buttons = (Array.isArray(dmButtons) ? dmButtons : [])
      .filter((b: any) => b && b.url && b.label)
      .slice(0, 3)
      .map((b: any) => ({
        type: 'web_url',
        url: String(b.url),
        title: String(b.label).slice(0, 20), // IG limit: 20 chars
      }))

    const messageBody = buttons.length > 0
      ? {
          attachment: {
            type: 'template',
            payload: {
              template_type: 'button',
              text: dmMessage,
              buttons,
            },
          },
        }
      : { text: dmMessage }

    // Step 5b — Send via Private Reply (target the comment, not the user)
    const dmRes = await fetch(
      `https://graph.instagram.com/v21.0/${igAccountId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          recipient: { comment_id: commentId },
          message: messageBody,
        }),
      }
    )

    const dmResult = await dmRes.json()
    console.log('DM send result:', JSON.stringify(dmResult))

    const success = !dmResult.error

    // Step 6 — Log the result
    await supabase.from('dm_logs').insert({
      automation_id: automationId,
      user_id: userId,
      commenter_ig_id: commenterId,
      commenter_username: commenterUsername,
      status: success ? 'sent' : 'failed',
      error_message: dmResult.error?.message ?? null,
    })

    if (!success) {
      console.error('DM send failed:', dmResult.error)
      return new NextResponse(
        JSON.stringify({ error: dmResult.error?.message }),
        { status: 500 }
      )
    }

    // Step 7 — Increment DM counter
    await supabase
      .from('subscriptions')
      .update({ dms_used_this_month: subscription.dms_used_this_month + 1 })
      .eq('user_id', userId)

    console.log(`✅ DM sent to @${commenterUsername}`)

    // Step 8 — Public comment reply (paid plans only)
    if (replyEnabled && subscription.allows_comment_reply && replyMessages?.length > 0) {
      const replyText = replyMessages[Math.floor(Math.random() * replyMessages.length)]

      const replyRes = await fetch(
        `https://graph.instagram.com/v21.0/${commentId}/replies`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ message: replyText }),
        }
      )

      const replyResult = await replyRes.json()
      if (replyResult.error) {
        console.error('Comment reply failed:', replyResult.error)
      } else {
        console.log(`✅ Public reply posted: "${replyText}"`)
      }
    }

    return NextResponse.json({ success: true, commenter: commenterUsername })

  } catch (err: any) {
    console.error('Worker error:', err)
    return new NextResponse(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    )
  }
}

export const POST = verifySignatureAppRouter(handler)