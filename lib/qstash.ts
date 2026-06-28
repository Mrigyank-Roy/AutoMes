import { Client } from '@upstash/qstash'

export const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
})

export async function publishDMJob(payload: {
  automationId: string
  commenterId: string
  commenterUsername: string
  commentId: string
  commentText: string
  igAccountId: string
  igDbAccountId: string
  tokenExpiresAt: string
  accessTokenEnc: string
  userId: string
  dmMessage: string
  dmButtonUrl?: string | null
  dmButtonLabel?: string | null
  replyEnabled: boolean
  replyMessages: string[]
}) {
  const workerUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/worker/process`

  const response = await qstash.publishJSON({
    url: workerUrl,
    body: payload,
    retries: 3,
    headers: {
      'x-worker-secret': process.env.WORKER_SECRET!,
    },
  })

  return response
}