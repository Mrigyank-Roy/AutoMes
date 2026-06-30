import { Client } from '@upstash/qstash'

const qstash = new Client({ token: process.env.QSTASH_TOKEN! })
const workerUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/worker/process`

const FLOW_CONTROL = {
  key: '',
  rate: 190,
  period: '1h' as const,
  parallelism: 10,
}

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
    flowControl: { ...FLOW_CONTROL, key: `ig-${body.igAccountId}` },
    headers: { 'x-worker-secret': process.env.WORKER_SECRET! },
  })
  return { delaySeconds }
}

export type FollowGateStep = 'gate_start' | 'gate_access' | 'gate_follow_check'

export type FollowGateJobPayload = {
  jobType: FollowGateStep
  automationId: string
  commenterId: string
  commenterUsername?: string
  commentId?: string
  igAccountId: string
  igDbAccountId: string
  igUsername: string
  tokenExpiresAt: string | null
  accessTokenEnc: string
  userId: string
  dmMessage: string
  dmButtons?: { label: string; url: string; kind?: string }[]
  replyEnabled?: boolean
  replyMessages?: string[]
}

export async function publishFollowGateJob(body: FollowGateJobPayload) {
  const opts: Record<string, unknown> = {
    url: workerUrl,
    body,
    retries: 2,
    flowControl: { ...FLOW_CONTROL, key: `ig-${body.igAccountId}` },
    headers: { 'x-worker-secret': process.env.WORKER_SECRET! },
  }

  if (body.jobType === 'gate_start') opts.delay = Math.floor(Math.random() * 6) + 5
  await qstash.publishJSON(opts)
}