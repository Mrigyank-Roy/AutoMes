import { NextRequest, NextResponse } from 'next/server'

const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN


export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams

  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Webhook verified by Meta')
    return new NextResponse(challenge, { status: 200 })
  }

  console.log('Webhook verification failed')
  return new NextResponse('Forbidden', { status: 403 })
}


export async function POST(request: NextRequest) {
  const body = await request.json()

  console.log('📨 Webhook event received:')
  console.log(JSON.stringify(body, null, 2))

  return new NextResponse('OK', { status: 200 })
}