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
  console.log('📨 Webhook received:', JSON.stringify(body, null, 2))

  try {
    const entries = body.entry ?? []

    for (const entry of entries) {
      const changes = entry.changes ?? []
      const igAccountId = entry.id

      for (const change of changes) {
        if (change.field !== 'comments') continue

        const value = change.value
        const postId = value?.media?.id
        const commentText = value?.text ?? ''
        const commenterId = value?.from?.id
        const commenterUsername = value?.from?.username
        const commentId = value?.id

        if (!postId || !commenterId) continue

        console.log(`💬 Comment on post ${postId}: "${commentText}" by @${commenterUsername}`)

        const supabase = createServiceSupabaseClient()

        // Step 1 — Find the instagram_account in our DB matching this IG account
        const { data: igAccount } = await supabase
          .from('instagram_accounts')
          .select('id, user_id, access_token_enc')
          .eq('ig_account_id', igAccountId)
          .single()

        if (!igAccount) {
          console.log(`No account found for ig_account_id: ${igAccountId}`)
          continue
        }

        // Step 2 — Find active automations for this post
        const { data: automations } = await supabase
          .from('automations')
          .select('*')
          .eq('ig_account_id', igAccount.id)
          .eq('post_id', postId)
          .eq('is_active', true)

        if (!automations || automations.length === 0) {
          console.log(`No active automations for post ${postId}`)
          continue
        }

        for (const automation of automations) {
          // Step 3 — Check if comment matches trigger
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
            console.log(`❌ No keyword match for "${commentText}"`)
            continue
          }

          console.log(`✅ Match! Queuing DM for @${commenterUsername}`)

          // Step 4 — Add to queue
          await dmQueue.add('send-dm', {
            automationId: automation.id,
            commenterId,
            commenterUsername,
            commentId,
            commentText,
            igAccountId,
            accessTokenEnc: igAccount.access_token_enc,
            userId: igAccount.user_id,
            dmMessage: automation.dm_message,
            replyEnabled: automation.reply_enabled,
            replyMessages: automation.reply_messages,
          })

          console.log(`📬 Job added to queue for @${commenterUsername}`)
        }
      }
    }
  } catch (err) {
    console.error('Webhook processing error:', err)
  }

  return new NextResponse('OK', { status: 200 })
}