import { NextRequest, NextResponse } from 'next/server'
import { Worker } from 'bullmq'
import { connection } from '@/lib/queue'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { decrypt } from '@/lib/encryption'
import { refreshInstagramToken } from '@/lib/refresh-token'

export async function POST(request: NextRequest) {
  
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.WORKER_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  let processed = 0

  try {
    const worker = new Worker('send-dm', async (job) => {
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
        replyEnabled,
        replyMessages,
      } = job.data

      let accessTokenEnc = initialTokenEnc

      const supabase = createServiceSupabaseClient()

      // Step 1 — Check for duplicate
      const { data: existingLog } = await supabase
        .from('dm_logs')
        .select('id')
        .eq('automation_id', automationId)
        .eq('commenter_ig_id', commenterId)
        .maybeSingle()

      if (existingLog) {
        console.log(`Already sent DM to ${commenterUsername} — skipping`)
        return
      }

      // Step 1b — Check opt-out list
      const { data: isOptedOut } = await supabase
        .from('dm_optouts')
        .select('id')
        .eq('ig_account_id', igAccountId)
        .eq('blocked_commenter_ig_id', commenterId)
        .maybeSingle()

      if (isOptedOut) {
        console.log(`User ${commenterId} is on opt-out list — skipping DM`)
        return
      }

      // Step 2 — Check DM limit
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (!subscription) {
        console.error('No subscription found for user:', userId)
        return
      }

      if (subscription.dms_used_this_month >= subscription.dm_limit_monthly) {
        console.log(`User ${userId} has hit their DM limit — skipping`)
        await supabase.from('dm_logs').insert({
          automation_id: automationId,
          user_id: userId,
          commenter_ig_id: commenterId,
          commenter_username: commenterUsername,
          status: 'limit_reached'
        })
        return
      }

      // Step 3 — Check if token needs refresh
      if (tokenExpiresAtStr) {
        const tokenExpiresAt = new Date(tokenExpiresAtStr)
        const daysUntilExpiry = Math.floor(
          (tokenExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )

        if (daysUntilExpiry < 10) {
          console.log(`Token expiring in ${daysUntilExpiry} days — refreshing now`)
          await refreshInstagramToken(igDbAccountId)

          // Re-fetch updated token
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

      // Step 5 — Send the DM
      const dmRes = await fetch(
        `https://graph.instagram.com/v21.0/${igAccountId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            recipient: { id: commenterId },
            message: { text: dmMessage }
          })
        }
      )

      const dmResult = await dmRes.json()
      console.log('DM send result:', dmResult)

      const success = !dmResult.error

      // Step 6 — Log the result
      await supabase.from('dm_logs').insert({
        automation_id: automationId,
        user_id: userId,
        commenter_ig_id: commenterId,
        commenter_username: commenterUsername,
        status: success ? 'sent' : 'failed',
        error_message: dmResult.error?.message ?? null
      })

      if (!success) {
        console.error('DM send failed:', dmResult.error)
        throw new Error(dmResult.error?.message)
      }

      // Step 7 — Increment DM counter
      await supabase
        .from('subscriptions')
        .update({ 
          dms_used_this_month: subscription.dms_used_this_month + 1 
        })
        .eq('user_id', userId)

      console.log(`✅ DM sent to @${commenterUsername}`)

      // Step 8 — Public comment reply (paid plans only)
      if (replyEnabled && subscription.allows_comment_reply) {
        const replyText = replyMessages[
          Math.floor(Math.random() * replyMessages.length)
        ]

        const replyRes = await fetch(
          `https://graph.instagram.com/v21.0/${commentId}/replies`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ message: replyText })
          }
        )

        const replyResult = await replyRes.json()
        if (replyResult.error) {
          console.error('Comment reply failed:', replyResult.error)
        } else {
          console.log(`✅ Public reply posted: "${replyText}"`)
        }
      }

      processed++

    }, { connection, concurrency: 5 })

    // Give worker 25 seconds to process jobs
    await new Promise(resolve => setTimeout(resolve, 25000))
    await worker.close()

  } catch (err) {
    console.error('Worker error:', err)
  }

  return NextResponse.json({ processed })
}