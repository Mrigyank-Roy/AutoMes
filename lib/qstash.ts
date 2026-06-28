import { Client } from '@upstash/qstash'

const qstash = new Client({ token: process.env.QSTASH_TOKEN! })

const workerUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/worker/process`

export type DMJobPayload = {
  automationId: string
  commenterId: string
  commenterUsername: string
  commentId: string
  commentText: string
  igAccountId: string
  igDbAccountId: string
  tokenExpiresAt: string | null
  accessTokenEnc: string
  userId: string
  dmMessage: string
  dmButtons?: { label: string; url: string; kind?: string }[]
  replyEnabled: boolean
  replyMessages: string[]
}

export async function publishDMJob(body: DMJobPayload) {
  const delaySeconds = Math.floor(Math.random() * 6) + 5

  await qstash.publishJSON({
    url: workerUrl,
    body,
    delay: delaySeconds,
    retries: 2,
    flowControl: {
      key: `ig-${body.igAccountId}`,
      rate: 180,
      period: '1h',
      parallelism: 10,
    },
    headers: { 'x-worker-secret': process.env.WORKER_SECRET! },
  })

  return { delaySeconds }
}