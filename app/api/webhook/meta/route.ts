import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { dmQueue } from '@/lib/queue'

const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verified by Meta')
    return new NextResponse(challenge, { status: 200 })
  }

  return new NextResponse('Forbidden', { status: 403 })
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  try {
    const entries = body.entry ?? []

    for (const entry of entries) {
      const changes = entry.changes ?? []

      for (const change of changes) {
        if (change.field !== 'comments') continue

        const value = change.value
        const igAccountId = entry.id        // Instagram account that owns the post
        const postId = value?.media?.id     // The post that was commented on
        const commentText = value?.text     // What they wrote
        const commenterId = value?.from?.id // Who commented (their IG scoped ID)
        const commenterUsername = value?.from?.username
        const commentId = value?.id         // The comment ID (for public reply)

        if (!postId || !commentText || !commenterId) continue

        console.log(`📨 Comment received on post ${postId}: "${commentText}" by @${commenterUsername}`)

        // Find matching active automations for this post
        const supabase = createServiceSupabaseClient()

        const { data: automations, error } = await supabase
          .from('automations')
          .select(`
            *,
            instagram_accounts!inner(
              id,
              ig_account_id,
              user_id,
              access_token_enc
            ),
            subscriptions:users!inner(
              subscriptions(*)
            )
          `)
          .eq('instagram_accounts.ig_account_id', igAccountId)
          .eq('post_id', postId)
          .eq('is_active', true)

        if (error) {
          console.error('Error fetching automations:', error)
          continue
        }

        if (!automations || automations.length === 0) {
          console.log(`No active automations for post ${postId}`)
          continue
        }

        for (const automation of automations) {
          // Check trigger type
          let shouldSend = false

          if (automation.trigger_type === 'any') {
            shouldSend = true
          } else if (automation.trigger_type === 'keyword' && automation.keywords) {
            const lowerComment = commentText.toLowerCase()
            shouldSend = automation.keywords.some(
              (kw: string) => lowerComment.includes(kw.toLowerCase())
            )
          }

          if (!shouldSend) {
            console.log(`Comment "${commentText}" did not match keywords for automation ${automation.id}`)
            continue
          }

          console.log(`✅ Match found! Queuing DM for @${commenterUsername}`)

          // Add job to queue
          await dmQueue.add('send-dm', {
            automationId: automation.id,
            commenterId,
            commenterUsername,
            commentId,
            commentText,
            igAccountId,
            accessTokenEnc: automation.instagram_accounts.access_token_enc,
            userId: automation.instagram_accounts.user_id,
            dmMessage: automation.dm_message,
            replyEnabled: automation.reply_enabled,
            replyMessages: automation.reply_messages,
          })
        }
      }
    }
  } catch (err) {
    console.error('Webhook processing error:', err)
  }

  return new NextResponse('OK', { status: 200 })
}