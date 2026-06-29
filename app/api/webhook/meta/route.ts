import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { publishDMJob } from '@/lib/qstash'
import { decrypt } from '@/lib/encryption'

const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN

// Send a standard DM reply (used for opt-out / re-opt-in confirmations).
// Allowed because the user's inbound STOP/CONTINUE opens a 24h messaging window.
async function sendInstagramMessage(
  igAccountId: string,
  accessToken: string,
  recipientId: string,
  text: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `https://graph.instagram.com/v21.0/${igAccountId}/messages?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text },
        }),
      }
    )
    const data = await res.json()
    if (!res.ok) {
      console.error('❌ Failed to send confirmation DM:', JSON.stringify(data))
      return false
    }
    return true
  } catch (err) {
    console.error('❌ Error sending confirmation DM:', err)
    return false
  }
}

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
      const igAccountId = entry.id

      // ── COMMENTS (entry.changes) ──────────────────────────────
      const changes = entry.changes ?? []
      for (const change of changes) {
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
      }

      // ── DIRECT MESSAGES (entry.messaging) — STOP / CONTINUE / deletion ──
      // Instagram delivers DMs here, NOT under entry.changes.
      const messagingEvents = entry.messaging ?? []
      for (const event of messagingEvents) {
        const senderId = event?.sender?.id

        // Skip our own outgoing messages (echoes) and events with no sender
        if (event?.message?.is_echo) continue
        if (!senderId) continue

        // Message unsend / deletion → wipe that user's logs
        if (event?.message?.is_deleted) {
          console.log(`🗑️ Message deletion from ${senderId}`)
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

        // Exact-word command matching (so "don't stop!" doesn't unsubscribe anyone)
        const normalized = (event?.message?.text ?? '').trim().toLowerCase()
        if (!normalized) continue // skip reads, deliveries, reactions, etc.

        const STOP_WORDS = ['stop', 'unsubscribe', 'optout', 'opt out', 'opt-out', 'cancel']
        const CONTINUE_WORDS = ['continue', 'start', 'resume']

        const isStop = STOP_WORDS.includes(normalized)
        const isContinue = CONTINUE_WORDS.includes(normalized)
        if (!isStop && !isContinue) continue

        // We need the account's token to send a confirmation reply
        const { data: igAccount } = await supabase
          .from('instagram_accounts')
          .select('access_token_enc')
          .eq('ig_account_id', igAccountId)
          .single()
        if (!igAccount?.access_token_enc) {
          console.log(`No account/token found for ig_account_id: ${igAccountId}`)
          continue
        }

        let accessToken: string
        try {
          accessToken = decrypt(igAccount.access_token_enc)
        } catch (e) {
          console.error('❌ Failed to decrypt access token:', e)
          continue
        }

        if (isStop) {
          await supabase
            .from('dm_optouts')
            .upsert({
              ig_account_id: igAccountId,
              blocked_commenter_ig_id: senderId,
            }, { onConflict: 'ig_account_id,blocked_commenter_ig_id' })
          console.log(`🚫 Opt-out from ${senderId} — added to opt-out list`)

          await sendInstagramMessage(
            igAccountId,
            accessToken,
            senderId,
            "You've been unsubscribed and won't receive any more automated messages from us. 🙏\n\nChanged your mind? Just reply CONTINUE anytime to start receiving messages again."
          )
        } else if (isContinue) {
          const { count } = await supabase
            .from('dm_optouts')
            .delete({ count: 'exact' })
            .eq('ig_account_id', igAccountId)
            .eq('blocked_commenter_ig_id', senderId)

          if (count && count > 0) {
            console.log(`✅ Re-opt-in from ${senderId} — removed from opt-out list`)
            await sendInstagramMessage(
              igAccountId,
              accessToken,
              senderId,
              "You're back in! ✅ You'll now receive messages from us again.\n\nYou can reply STOP at any time to unsubscribe."
            )
          } else {
            // They weren't opted out — nothing to do, don't send a confusing message
            console.log(`ℹ️ CONTINUE from ${senderId} who wasn't opted out — ignoring`)
          }
        }
      }
    }
  } catch (err) {
    console.error('Webhook processing error:', err)
  }

  return new NextResponse('OK', { status: 200 })
}