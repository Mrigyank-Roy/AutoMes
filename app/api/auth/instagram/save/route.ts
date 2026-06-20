import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const igAccountId = searchParams.get('ig_account_id')
  const igUsername = searchParams.get('ig_username')
  const encryptedToken = searchParams.get('encrypted_token')
  const expiresAt = searchParams.get('expires_at')

  if (!igAccountId || !igUsername || !encryptedToken) {
    return NextResponse.redirect(`${APP_URL}/dashboard?error=missing_data`)
  }

  try {
    // Get the user session from cookies
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Get auth token from cookie
    const cookieHeader = request.headers.get('cookie') ?? ''
    
    // Parse the Supabase auth cookie
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const [key, ...val] = c.trim().split('=')
        return [key, val.join('=')]
      })
    )

    // Find the Supabase session cookie
    const sessionKey = Object.keys(cookies).find(k => k.includes('auth-token'))
    
    if (!sessionKey) {
      return NextResponse.redirect(`${APP_URL}/login?error=not_logged_in`)
    }

    const sessionData = JSON.parse(decodeURIComponent(cookies[sessionKey]))
    const userId = sessionData?.user?.id

    if (!userId) {
      return NextResponse.redirect(`${APP_URL}/login?error=not_logged_in`)
    }

    // Save to Supabase using service client
    const serviceSupabase = createServiceSupabaseClient()

    const { error } = await serviceSupabase
      .from('instagram_accounts')
      .upsert({
        user_id: userId,
        ig_account_id: igAccountId,
        ig_username: igUsername,
        access_token_enc: encryptedToken,
        token_expires_at: expiresAt
      }, {
        onConflict: 'ig_account_id'
      })

    if (error) {
      console.error('Supabase save error:', error)
      return NextResponse.redirect(`${APP_URL}/dashboard?error=save_failed`)
    }

    return NextResponse.redirect(`${APP_URL}/dashboard?success=instagram_connected`)

  } catch (err) {
    console.error('Save route error:', err)
    return NextResponse.redirect(`${APP_URL}/dashboard?error=save_failed`)
  }
}