import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { publishDMJob } from '@/lib/qstash'

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

  const supabase = createServiceSupabaseClient()

  try {
    const entries = body.entry ?? []

    for (const entry of entries) {
      const changes = entry.changes ?? []
      const igAccountId = entry.id

      for (const change of changes) {

        // ── COMMENTS ──────────────────────────────────────────
        if (change.field === 'comments') {
          const value = change.value
          const postId = value?.media?.id
          const commentText = value?.text ?? ''
          const commenterId = value?.from?.id
          const commenterUsername = value?.from?.username
          const commentId = value?.id

          if (!postId || !commenterId) continue

          console.log(`💬 Comment on post ${postId}: "${commentText}" by @${commenterUsername}`)

          // Find the instagram_account in our DB
          const { data: igAccount } = await supabase
            .from('instagram_accounts')
            .select('id, user_id, access_token_enc, token_expires_at, ig_username')
            .eq('ig_account_id', igAccountId)
            .single()

          if (!igAccount) {
            console.log(`No account found for ig_account_id: ${igAccountId}`)
            continue
          }

          // ⛔ Ignore comments made by the account owner itself (prevents the
          // self-reply loop: our own "Check your DMs!" reply is a comment too).
          const isOwnComment =
            commenterId === igAccountId ||
            (!!commenterUsername &&
              !!igAccount.ig_username &&
              commenterUsername.toLowerCase() === igAccount.ig_username.toLowerCase())

          if (isOwnComment) {
            console.log(`🔁 Skipping own comment by @${commenterUsername} — prevents reply loop`)
            continue
          }

          // Check opt-out list
          const { data: isOptedOut } = await supabase
            .from('dm_optouts')
            .select('id')
            .eq('ig_account_id', igAccountId)
            .eq('blocked_commenter_ig_id', commenterId)
            .maybeSingle()

          if (isOptedOut) {
            console.log(`User ${commenterId} has opted out — skipping`)
            continue
          }

          // Find active automations for this post
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

            console.log(`✅ Match! Publishing DM job to QStash for @${commenterUsername}`)

            await publishDMJob({
              automationId: automation.id,
              commenterId,
              commenterUsername,
              commentId,
              commentText,
              igAccountId,
              igDbAccountId: igAccount.id,
              tokenExpiresAt: igAccount.token_expires_at,
              accessTokenEnc: igAccount.access_token_enc,
              userId: igAccount.user_id,
              dmMessage: automation.dm_message,
              dmButtons: automation.dm_buttons ?? [],
              replyEnabled: automation.reply_enabled ?? false,
              replyMessages: automation.reply_messages ?? [],
            })

            console.log(`📬 DM job published to QStash for @${commenterUsername}`)
          }
        }

        // ── MESSAGES (STOP / deletion) ──────────────────────
        if (change.field === 'messages') {
          const value = change.value
          const senderId = value?.sender?.id
          const messageText = value?.message?.text?.toLowerCase() ?? ''

          if (value?.message_delete) {
            console.log(`🗑️ Message deletion request`)
            const { data: igAccount } = await supabase
              .from('instagram_accounts')
              .select('user_id')
              .eq('ig_account_id', igAccountId)
              .single()

            if (igAccount) {
              await supabase
                .from('dm_logs')
                .delete()
                .eq('user_id', igAccount.user_id)
                .eq('commenter_ig_id', senderId)
              console.log(`✅ Deleted message logs per deletion request`)
            }
            continue
          }

          const stopWords = ['stop', 'unsubscribe', 'optout', 'opt out', 'opt-out', 'cancel']
          const isStopMessage = stopWords.some(word => messageText.includes(word))

          if (isStopMessage && senderId) {
            console.log(`🚫 Opt-out from ${senderId}`)
            await supabase
              .from('dm_optouts')
              .upsert({
                ig_account_id: igAccountId,
                blocked_commenter_ig_id: senderId,
              }, { onConflict: 'ig_account_id,blocked_commenter_ig_id' })
            console.log(`✅ User ${senderId} added to opt-out list`)
          }
        }
      }
    }
  } catch (err) {
    console.error('Webhook processing error:', err)
  }

  return new NextResponse('OK', { status: 200 })
}