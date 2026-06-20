import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const APP_ID = process.env.META_APP_ID!
  const CALLBACK_URL = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/instagram/callback`

  const SCOPES = [
    'instagram_basic',
    'instagram_manage_messages',
    'pages_manage_metadata',
    'pages_show_list',
    'pages_read_engagement',
  ].join(',')

  const state = Buffer.from(JSON.stringify({
    timestamp: Date.now(),
    random: Math.random().toString(36).slice(2)
  })).toString('base64')

  // Use Facebook OAuth URL — correct for Facebook Login for Business
  const oauthUrl = new URL('https://www.facebook.com/v21.0/dialog/oauth')
  oauthUrl.searchParams.set('client_id', APP_ID)
  oauthUrl.searchParams.set('redirect_uri', CALLBACK_URL)
  oauthUrl.searchParams.set('scope', SCOPES)
  oauthUrl.searchParams.set('state', state)
  oauthUrl.searchParams.set('response_type', 'code')

  return NextResponse.redirect(oauthUrl.toString())
}