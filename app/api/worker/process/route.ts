import { NextRequest, NextResponse } from 'next/server'
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { decrypt } from '@/lib/encryption'
import { refreshInstagramToken } from '@/lib/refresh-token'
import { isFollowingWithRetry } from '@/lib/instagram-profile'
import { FOLLOW_GATE_DEFAULTS, FG, profileUrlFromUsername } from '@/lib/follow-gate'

const GRAPH = 'https://graph.instagram.com/v21.0'

type Supa = ReturnType<typeof createServiceSupabaseClient>

async function handler(request: NextRequest) {
  const workerSecret = request.headers.get('x-worker-secret')
  if (workerSecret !== process.env.WORKER_SECRET) {
    console.error('Unauthorized worker request')
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const job = await request.json()
  const supabase = createServiceSupabaseClient()

  if (job.jobType === 'gate_start' || job.jobType === 'gate_access' || job.jobType === 'gate_follow_check') {
    return handleFollowGate(job, supabase)
  }
  return handleDMJob(job, supabase)
}

// ════════════════════════════════════════════════════════════
// NORMAL DM FLOW (unchanged from your original)
// ════════════════════════════════════════════════════════════
async function handleDMJob(job: any, supabase: Supa) {
  const {
    automationId, commenterId, commenterUsername, commentId, igAccountId,
    igDbAccountId, tokenExpiresAt: tokenExpiresAtStr, accessTokenEnc: initialTokenEnc,
    userId, dmMessage, dmButtons, replyEnabled, replyMessages,
  } = job
  let accessTokenEnc = initialTokenEnc

  try {
    // Step 1 — Duplicate check
    const { data: existingLog } = await supabase
      .from('dm_logs').select('id')
      .eq('automation_id', automationId).eq('commenter_ig_id', commenterId)
      .eq('status', 'sent').maybeSingle()
    if (existingLog) {
      console.log(`Already sent DM to ${commenterUsername} — skipping`)
      return NextResponse.json({ skipped: true, reason: 'duplicate' })
    }

    // Step 1b — Opt-out check
    const { data: isOptedOut } = await supabase
      .from('dm_optouts').select('id')
      .eq('ig_account_id', igAccountId).eq('blocked_commenter_ig_id', commenterId).maybeSingle()
    if (isOptedOut) return NextResponse.json({ skipped: true, reason: 'opted_out' })

    // Step 2 — DM limit
    const { data: subscription } = await supabase
      .from('subscriptions').select('*').eq('user_id', userId).single()
    if (!subscription) return new NextResponse('No subscription', { status: 400 })
    if (subscription.dms_used_this_month >= subscription.dm_limit_monthly) {
      await supabase.from('dm_logs').insert({
        automation_id: automationId, user_id: userId, commenter_ig_id: commenterId,
        commenter_username: commenterUsername, status: 'limit_reached',
      })
      return NextResponse.json({ skipped: true, reason: 'limit_reached' })
    }

    // Step 3 — Refresh token if expiring soon
    if (tokenExpiresAtStr) {
      const days = Math.floor((new Date(tokenExpiresAtStr).getTime() - Date.now()) / 86400000)
      if (days < 10) {
        await refreshInstagramToken(igDbAccountId)
        const { data: updated } = await supabase
          .from('instagram_accounts').select('access_token_enc').eq('id', igDbAccountId).single()
        if (updated) accessTokenEnc = updated.access_token_enc
      }
    }

    // Step 4 — Decrypt
    const accessToken = decrypt(accessTokenEnc)

    // Step 5 — Build message
    const messageBody = buildLinkMessage(dmMessage, dmButtons)

    // Step 5b — Private reply (target the comment)
    const dmRes = await fetch(`${GRAPH}/${igAccountId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ recipient: { comment_id: commentId }, message: messageBody }),
    })
    const dmResult = await dmRes.json()
    const success = !dmResult.error

    // Step 6 — Log
    await supabase.from('dm_logs').insert({
      automation_id: automationId, user_id: userId, commenter_ig_id: commenterId,
      commenter_username: commenterUsername, status: success ? 'sent' : 'failed',
      error_message: dmResult.error?.message ?? null,
    })
    if (!success) {
      return new NextResponse(JSON.stringify({ error: dmResult.error?.message }), { status: 500 })
    }

    // Step 7 — Increment counter
    await supabase.from('subscriptions')
      .update({ dms_used_this_month: subscription.dms_used_this_month + 1 })
      .eq('user_id', userId)

    // Step 8 — Public comment reply (paid plans only)
    if (replyEnabled && subscription.allows_comment_reply && replyMessages?.length > 0) {
      const raw = replyMessages[Math.floor(Math.random() * replyMessages.length)]
      const replyText = raw.replace(/@username/gi, `@${commenterUsername}`)
      await fetch(`${GRAPH}/${commentId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ message: replyText }),
      }).catch((e) => console.error('Comment reply failed:', e))
    }

    return NextResponse.json({ success: true, commenter: commenterUsername })
  } catch (err: any) {
    console.error('Worker error:', err)
    return new NextResponse(JSON.stringify({ error: err.message }), { status: 500 })
  }
}

// ════════════════════════════════════════════════════════════
// FOLLOW-GATE FLOW
// ════════════════════════════════════════════════════════════
async function handleFollowGate(job: any, supabase: Supa) {
  try {
    // Opt-out applies to the whole flow
    const { data: optout } = await supabase
      .from('dm_optouts').select('id')
      .eq('ig_account_id', job.igAccountId).eq('blocked_commenter_ig_id', job.commenterId).maybeSingle()
    if (optout) return NextResponse.json({ skipped: true, reason: 'opted_out' })

    // Per-account gate copy (fallback to defaults)
    const { data: settingsRow } = await supabase
      .from('follow_gate_settings').select('*').eq('ig_account_id', job.igDbAccountId).maybeSingle()
    const settings = { ...FOLLOW_GATE_DEFAULTS, ...(settingsRow ?? {}) }

    const accessToken = await resolveToken(job, supabase)
    const profileUrl = profileUrlFromUsername(job.igUsername)

    // ── STEP 1: comment came in on a followers-only automation ──
    if (job.jobType === 'gate_start') {
      // Already completed before? (final link logs 'sent')
      const { data: sentLog } = await supabase
        .from('dm_logs').select('id')
        .eq('automation_id', job.automationId).eq('commenter_ig_id', job.commenterId)
        .eq('status', 'sent').maybeSingle()
      if (sentLog) return NextResponse.json({ skipped: true, reason: 'already_completed' })

      // Already mid-flow? don't double-send Step 1
      const { data: convo } = await supabase
        .from('dm_conversations').select('id, state')
        .eq('ig_account_id', job.igDbAccountId).eq('commenter_ig_id', job.commenterId).maybeSingle()
      if (convo && convo.state !== 'completed') return NextResponse.json({ skipped: true, reason: 'in_progress' })

      const msg = {
        text: settings.step1_text,
        quick_replies: [{
          content_type: 'text',
          title: String(settings.step1_button).slice(0, 20),
          payload: `${FG.ACCESS}${job.automationId}`,
        }],
      }
      // Step 1 is sent as a PRIVATE REPLY (no messaging window yet)
      const res = await sendAndAccount(supabase, job, accessToken, msg, { commentId: job.commentId, logStatus: 'gate_prompt' })
      if (!res.ok) return NextResponse.json({ skipped: true, reason: res.reason ?? 'send_failed' })

      await supabase.from('dm_conversations').upsert({
        ig_account_id: job.igDbAccountId, commenter_ig_id: job.commenterId,
        automation_id: job.automationId, state: 'awaiting_access', follow_attempts: 0,
        updated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      }, { onConflict: 'ig_account_id,commenter_ig_id' })

      // Optional public comment reply (paid plans)
      if (job.replyEnabled && job.commentId && job.replyMessages?.length > 0) {
        const { data: sub } = await supabase
          .from('subscriptions').select('allows_comment_reply').eq('user_id', job.userId).single()
        if (sub?.allows_comment_reply) {
          const raw = job.replyMessages[Math.floor(Math.random() * job.replyMessages.length)]
          const replyText = raw.replace(/@username/gi, job.commenterUsername ? `@${job.commenterUsername}` : '')
          await fetch(`${GRAPH}/${job.commentId}/replies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
            body: JSON.stringify({ message: replyText }),
          }).catch(() => {})
        }
      }
      return NextResponse.json({ ok: true, step: 'gate_start' })
    }

    // gate_access / gate_follow_check need an active conversation
    const { data: convo } = await supabase
      .from('dm_conversations').select('*')
      .eq('ig_account_id', job.igDbAccountId).eq('commenter_ig_id', job.commenterId).maybeSingle()
    if (!convo || convo.state === 'completed') {
      return NextResponse.json({ skipped: true, reason: 'no_active_conversation' })
    }

    // ── STEP 2 entry: user tapped "Send me the access" ──
    if (job.jobType === 'gate_access') {
      const follows = await isFollowingWithRetry(job.commenterId, accessToken)
      if (follows) {
        const res = await sendAndAccount(supabase, job, accessToken, buildLinkMessage(job.dmMessage, job.dmButtons), { recipientId: job.commenterId, logStatus: 'sent' })
        if (res.ok) await supabase.from('dm_conversations').update({ state: 'completed', updated_at: new Date().toISOString() }).eq('id', convo.id)
        return NextResponse.json({ ok: res.ok, followed: true })
      }
      const msg = buildStep2Message(settings, job.automationId, profileUrl)
      const res = await sendAndAccount(supabase, job, accessToken, msg, { recipientId: job.commenterId, logStatus: 'gate_prompt' })
      if (res.ok) await supabase.from('dm_conversations').update({ state: 'awaiting_follow', updated_at: new Date().toISOString() }).eq('id', convo.id)
      return NextResponse.json({ ok: res.ok, followed: false })
    }

    // ── STEP 3 path: user tapped "I'm following ✅" ──
    if (job.jobType === 'gate_follow_check') {
      const follows = await isFollowingWithRetry(job.commenterId, accessToken)
      if (follows) {
        const res = await sendAndAccount(supabase, job, accessToken, buildLinkMessage(job.dmMessage, job.dmButtons), { recipientId: job.commenterId, logStatus: 'sent' })
        if (res.ok) await supabase.from('dm_conversations').update({ state: 'completed', updated_at: new Date().toISOString() }).eq('id', convo.id)
        return NextResponse.json({ ok: res.ok, followed: true })
      }

      const attempts = (convo.follow_attempts ?? 0) + 1
      if (attempts >= 2) {
        // Limit of 2 reached → polite stop
        await sendAndAccount(supabase, job, accessToken, {
          text: "No worries! Whenever you follow, just comment again and I'll send your link 😊",
        }, { recipientId: job.commenterId, logStatus: 'gate_prompt' })
        await supabase.from('dm_conversations').update({ state: 'completed', follow_attempts: attempts, updated_at: new Date().toISOString() }).eq('id', convo.id)
        return NextResponse.json({ ok: true, stopped: true })
      }

      const reMsg = buildStep2Message(
        { ...settings, step2_text: "Hmm, I still don't see the follow 😅 Make sure you've tapped Follow, then hit the button again 👇" },
        job.automationId, profileUrl
      )
      await sendAndAccount(supabase, job, accessToken, reMsg, { recipientId: job.commenterId, logStatus: 'gate_prompt' })
      await supabase.from('dm_conversations').update({ follow_attempts: attempts, updated_at: new Date().toISOString() }).eq('id', convo.id)
      return NextResponse.json({ ok: true, followed: false, attempts })
    }

    return NextResponse.json({ skipped: true, reason: 'unknown_step' })
  } catch (err: any) {
    console.error('Follow-gate worker error:', err)
    return new NextResponse(JSON.stringify({ error: err.message }), { status: 500 })
  }
}

// ── shared helpers ──────────────────────────────────────────
async function resolveToken(job: any, supabase: Supa): Promise<string> {
  let enc = job.accessTokenEnc
  if (job.tokenExpiresAt) {
    const days = Math.floor((new Date(job.tokenExpiresAt).getTime() - Date.now()) / 86400000)
    if (days < 10) {
      await refreshInstagramToken(job.igDbAccountId)
      const { data } = await supabase
        .from('instagram_accounts').select('access_token_enc').eq('id', job.igDbAccountId).single()
      if (data) enc = data.access_token_enc
    }
  }
  return decrypt(enc)
}

function buildLinkMessage(dmMessage: string, dmButtons: any) {
  const buttons = (Array.isArray(dmButtons) ? dmButtons : [])
    .filter((b: any) => b && b.url && b.label)
    .slice(0, 3)
    .map((b: any) => ({ type: 'web_url', url: String(b.url), title: String(b.label).slice(0, 20) }))
  return buttons.length > 0
    ? { attachment: { type: 'template', payload: { template_type: 'button', text: dmMessage, buttons } } }
    : { text: dmMessage }
}

function buildStep2Message(settings: any, automationId: string, profileUrl: string) {
  return {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'button',
        text: settings.step2_text,
        buttons: [
          { type: 'web_url', url: profileUrl, title: 'Visit Profile' },
          { type: 'postback', title: String(settings.step2_follow_button).slice(0, 20), payload: `${FG.FOLLOW}${automationId}` },
        ],
      },
    },
  }
}

// limit-check → send → log → increment quota (each step costs 1 DM)
async function sendAndAccount(
  supabase: Supa, job: any, token: string, message: any,
  opts: { recipientId?: string; commentId?: string; logStatus: string }
) {
  const { data: sub } = await supabase
    .from('subscriptions').select('dms_used_this_month, dm_limit_monthly').eq('user_id', job.userId).single()
  if (!sub) return { ok: false, reason: 'no_subscription' }
  if (sub.dms_used_this_month >= sub.dm_limit_monthly) {
    await supabase.from('dm_logs').insert({
      automation_id: job.automationId, user_id: job.userId, commenter_ig_id: job.commenterId,
      commenter_username: job.commenterUsername ?? null, status: 'limit_reached',
    })
    return { ok: false, reason: 'limit_reached' }
  }

  const recipient = opts.commentId ? { comment_id: opts.commentId } : { id: opts.recipientId }
  const res = await fetch(`${GRAPH}/${job.igAccountId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ recipient, message }),
  })
  const data = await res.json()
  const ok = !data.error

  await supabase.from('dm_logs').insert({
    automation_id: job.automationId, user_id: job.userId, commenter_ig_id: job.commenterId,
    commenter_username: job.commenterUsername ?? null,
    status: ok ? opts.logStatus : 'failed', error_message: ok ? null : (data.error?.message ?? null),
  })
  if (ok) {
    await supabase.from('subscriptions')
      .update({ dms_used_this_month: sub.dms_used_this_month + 1 }).eq('user_id', job.userId)
  } else {
    console.error('Gate send failed:', JSON.stringify(data.error))
  }
  return { ok, data }
}

export const POST = verifySignatureAppRouter(handler)