import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

function makeLimiter(prefix: string, max: number, window: `${number} ${'s' | 'm' | 'h' | 'd'}`) {
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(max, window),
    prefix,
  })
}

// publish: 10 per hour per IP
export const publishLimiter = makeLimiter('rl:publish', 10, '1 h')

// search: 60 per minute per IP
export const searchLimiter = makeLimiter('rl:search', 60, '1 m')

// resolve / info / downloads: 120 per minute per IP
export const readLimiter = makeLimiter('rl:read', 120, '1 m')

export type RateLimitResult = { allowed: boolean; remaining: number; reset: number }

export async function checkRateLimit(
  limiter: Ratelimit,
  key: string,
): Promise<RateLimitResult> {
  const { success, remaining, reset } = await limiter.limit(key)
  return { allowed: success, remaining, reset }
}
