import { NextRequest, NextResponse } from 'next/server'
import { Worker } from 'bullmq'
import { connection } from '@/lib/queue'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { decrypt } from '@/lib/encryption'

// This endpoint is called by QStash every 30 seconds
export async function POST(request: NextRequest) {
  
  // Verify this is called by QStash or our own system
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
        commentText,
        igAccountId,
        igDbAccountId,
        tokenExpiresAt,
        accessTokenEnc: initialTokenEnc,
        userId,
        dmMessage,
        replyEnabled,
        replyMessages,
      } = job.data

      let accessTokenEnc = initialTokenEnc

      const supabase = createServiceSupabaseClient()

      // Step 1 — Check for duplicate (already sent DM to this person for this automation)
      const { data: existingLog } = await supabase
        .from('dm_logs')
        .select('id')
        .eq('automation_id', automationId)
        .eq('commenter_ig_id', commenterId)
        .maybeSingle()

      if (existingLog) {
        console.log(`Already sent DM to ${commenterUsername} for automation ${automationId} — skipping`)
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
        
        // Log as limit_reached so user can see it in dashboard
        await supabase.from('dm_logs').insert({
          automation_id: automationId,
          user_id: userId,
          commenter_ig_id: commenterId,
          commenter_username: commenterUsername,
          status: 'limit_reached'
        })
        return
      }

      // Step 3 — Check if token needs refresh before using it
      const tokenExpiresAt = new Date(/* we need this from DB */)
      const daysUntilExpiry = Math.floor(
        (tokenExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )

      if (daysUntilExpiry < 10) {
        console.log(`Token expiring in ${daysUntilExpiry} days — refreshing now`)
        await refreshInstagramToken(/* ig account id from DB */)
        
        // Re-fetch the updated token
        const { data: updatedAccount } = await supabase
          .from('instagram_accounts')
          .select('access_token_enc, token_expires_at')
          .eq('ig_account_id', igAccountId)
          .single()
          
        if (updatedAccount) {
          accessTokenEnc = updatedAccount.access_token_enc
        }
      }

      // Decrypt access token
      const accessToken = decrypt(accessTokenEnc)

      // Step 4 — Send the DM
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

      // Step 5 — Log the result
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

      // Step 6 — Increment DM counter
      await supabase
        .from('subscriptions')
        .update({ dms_used_this_month: subscription.dms_used_this_month + 1 })
        .eq('user_id', userId)

      console.log(`✅ DM sent to @${commenterUsername}`)

      // Step 7 — Public comment reply (paid plans only)
      if (replyEnabled && subscription.allows_comment_reply) {
        // Pick a random reply from the array
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