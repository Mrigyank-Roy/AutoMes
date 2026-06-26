import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { encrypt } from '@/lib/encryption'

const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID!
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET!
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!

function fail(reason: string, detail?: unknown) {
  const url = new URL(`${APP_URL}/dashboard`)
  url.searchParams.set('error', reason)
  if (detail) url.searchParams.set('detail', encodeURIComponent(String(detail)))
  return NextResponse.redirect(url.toString())
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) return fail('instagram_denied')
  if (!code || !state) return fail('no_code')

  // Decode user ID from state
  let userId: string | null = null
  try {
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf8'))
    userId = stateData.userId
  } catch (e) {
    console.error('Failed to parse state:', e)
    return NextResponse.redirect(`${APP_URL}/login?error=invalid_state`)
  }
  if (!userId) return NextResponse.redirect(`${APP_URL}/login?error=no_user_in_state`)

  try {
    const CALLBACK_URL = `${APP_URL}/api/auth/instagram/callback`

    // Step A — Exchange code for short-lived token
    const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: INSTAGRAM_APP_ID,
        client_secret: INSTAGRAM_APP_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: CALLBACK_URL,
        code,
      }),
    })
    const tokenData = await tokenRes.json()

    // Handle BOTH response shapes: flat, or nested in a `data` array
    const shortLivedToken =
      tokenData.access_token ?? tokenData.data?.[0]?.access_token

    if (tokenData.error_type || tokenData.error || !shortLivedToken) {
      console.error('Token exchange error:', tokenData)
      return fail('token_exchange_failed', tokenData.error_message ?? tokenData.error?.message)
    }

    // Step B — Exchange for long-lived token
    const longTokenRes = await fetch(
      `https://graph.instagram.com/access_token?` +
        `grant_type=ig_exchange_token&` +
        `client_secret=${INSTAGRAM_APP_SECRET}&` +
        `access_token=${shortLivedToken}`
    )
    const longTokenData = await longTokenRes.json()

    const longLivedToken = longTokenData.access_token
    if (longTokenData.error || !longLivedToken) {
      console.error('Long-lived token error:', longTokenData)
      return fail('long_token_failed', longTokenData.error?.message ?? 'no_token_returned')
    }

    // Step C — Get Instagram profile
    const igProfileRes = await fetch(
      `https://graph.instagram.com/v21.0/me?fields=id,username&access_token=${longLivedToken}`
    )
    const igProfile = await igProfileRes.json()

    if (igProfile.error || !igProfile.id) {
      console.error('IG profile error:', igProfile)
      return fail('profile_failed', igProfile.error?.message ?? 'no_profile')
    }

    const igAccountId = igProfile.id
    const igUsername = igProfile.username

    // Step D — Encrypt token (now guaranteed to be a valid string)
    const encryptedToken = encrypt(longLivedToken)

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 60)

    // Step E — Save to Supabase
    const serviceSupabase = createServiceSupabaseClient()
    const { error: dbError } = await serviceSupabase
      .from('instagram_accounts')
      .upsert(
        {
          user_id: userId,
          ig_account_id: igAccountId,
          ig_username: igUsername,
          access_token_enc: encryptedToken,
          token_expires_at: expiresAt.toISOString(),
        },
        { onConflict: 'ig_account_id' }
      )

    if (dbError) {
      console.error('Supabase save error:', dbError)
      return fail('save_failed', dbError.message)
    }

    return NextResponse.redirect(`${APP_URL}/dashboard?success=instagram_connected`)
  } catch (err) {
    console.error('OAuth callback error:', err)
    return fail('oauth_failed', err instanceof Error ? err.message : 'unknown')
  }
}