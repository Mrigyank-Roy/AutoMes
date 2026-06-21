import { Queue } from 'bullmq'

// Redis connection using Upstash
const connection = {
  host: process.env.UPSTASH_REDIS_REST_URL!.replace('https://', '').replace('http://', ''),
  port: 6379,
  password: process.env.UPSTASH_REDIS_REST_TOKEN!,
  tls: {}
}

// Create the DM sending queue
export const dmQueue = new Queue('send-dm', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000 
    },
    removeOnComplete: 100,
    removeOnFail: 200
  }
})

export { connection }