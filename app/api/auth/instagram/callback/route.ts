import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { encrypt } from '@/lib/encryption'

const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID!
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET!
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${APP_URL}/dashboard?error=instagram_denied`)
  }

  if (!code || !state) {
    return NextResponse.redirect(`${APP_URL}/dashboard?error=no_code`)
  }

  // Decode user ID from state
  let userId: string | null = null
  try {
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf8'))
    userId = stateData.userId
  } catch (e) {
    console.error('Failed to parse state:', e)
    return NextResponse.redirect(`${APP_URL}/login?error=invalid_state`)
  }

  if (!userId) {
    return NextResponse.redirect(`${APP_URL}/login?error=no_user_in_state`)
  }

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
        code: code,
      })
    })
    const tokenData = await tokenRes.json()
    console.log('Short-lived token response:', JSON.stringify(tokenData))

    if (tokenData.error_type || !tokenData.access_token) {
      console.error('Token exchange error:', tokenData)
      return NextResponse.redirect(`${APP_URL}/dashboard?error=token_exchange_failed`)
    }

    const shortLivedToken = tokenData.access_token

    // Step B — Try to get long-lived token, fall back to short-lived
    let accessToken = shortLivedToken
    let tokenExpiresAt = new Date()
    tokenExpiresAt.setHours(tokenExpiresAt.getHours() + 1) // short-lived = 1 hour

    try {
      const longTokenRes = await fetch(
        `https://graph.instagram.com/access_token?` +
        `grant_type=ig_exchange_token&` +
        `client_secret=${INSTAGRAM_APP_SECRET}&` +
        `access_token=${shortLivedToken}`
      )
      const longTokenData = await longTokenRes.json()
      console.log('Long-lived token response:', JSON.stringify(longTokenData))

      if (longTokenData.access_token && !longTokenData.error) {
        // Long-lived token succeeded
        accessToken = longTokenData.access_token
        tokenExpiresAt = new Date()
        tokenExpiresAt.setSeconds(
          tokenExpiresAt.getSeconds() + (longTokenData.expires_in ?? 5183944)
        )
        console.log('✅ Using long-lived token, expires:', tokenExpiresAt)
      } else {
        // Long-lived exchange failed — use short-lived for now
        console.warn('Long-lived token exchange failed, using short-lived token:', longTokenData.error?.message)
      }
    } catch (longTokenErr) {
      console.warn('Long-lived token exchange error, using short-lived:', longTokenErr)
    }

    // Step C — Get Instagram profile using whatever token we have
    const igProfileRes = await fetch(
      `https://graph.instagram.com/v21.0/me?` +
      `fields=id,username&` +
      `access_token=${accessToken}`
    )
    const igProfile = await igProfileRes.json()
    console.log('IG Profile:', JSON.stringify(igProfile))

    if (igProfile.error || !igProfile.id) {
      console.error('Failed to get IG profile:', igProfile)
      return NextResponse.redirect(`${APP_URL}/dashboard?error=profile_fetch_failed`)
    }

    const igAccountId = igProfile.id
    const igUsername = igProfile.username

    if (!accessToken) {
      console.error('No access token available')
      return NextResponse.redirect(`${APP_URL}/dashboard?error=no_access_token`)
    }

    // Step D — Encrypt the token
    const encryptedToken = encrypt(accessToken)

    // Step E — Save to Supabase
    const serviceSupabase = createServiceSupabaseClient()

    const { error: dbError } = await serviceSupabase
      .from('instagram_accounts')
      .upsert({
        user_id: userId,
        ig_account_id: igAccountId,
        ig_username: igUsername,
        access_token_enc: encryptedToken,
        token_expires_at: tokenExpiresAt.toISOString()
      }, {
        onConflict: 'ig_account_id'
      })

    if (dbError) {
      console.error('Supabase save error:', dbError)
      return NextResponse.redirect(`${APP_URL}/dashboard?error=save_failed`)
    }

    console.log(`✅ Instagram account connected: @${igUsername}`)
    return NextResponse.redirect(`${APP_URL}/dashboard?success=instagram_connected`)

  } catch (err) {
    console.error('OAuth callback error:', err)
    return NextResponse.redirect(`${APP_URL}/dashboard?error=oauth_failed`)
  }
}