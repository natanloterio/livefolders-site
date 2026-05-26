import { NextResponse } from 'next/server'
import { findTool } from '@/lib/store'
import { readLimiter, checkRateLimit } from '@/lib/ratelimit'

function getIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ owner: string; name: string }> }
) {
  const ip = getIp(req)
  const rl = await checkRateLimit(readLimiter, ip)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'rate limit exceeded (120 requests/minute per IP)' },
      { status: 429, headers: { 'X-RateLimit-Remaining': '0', 'X-RateLimit-Reset': String(rl.reset) } }
    )
  }

  const { owner, name } = await params
  const tool = await findTool(owner, name)
  if (!tool) return NextResponse.json({ error: 'tool not found' }, { status: 404 })
  return NextResponse.json(tool)
}
