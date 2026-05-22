import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { searchLimiter, checkRateLimit } from '@/lib/ratelimit'

function getIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET' }

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}

export async function GET(req: Request) {
  const ip = getIp(req)
  const rl = await checkRateLimit(searchLimiter, ip)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'rate limit exceeded (60 searches/minute per IP)' },
      { status: 429, headers: { ...CORS, 'X-RateLimit-Remaining': '0', 'X-RateLimit-Reset': String(rl.reset) } }
    )
  }

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')
  if (!q || q.trim().length === 0) {
    return NextResponse.json({ error: 'q parameter is required' }, { status: 400, headers: CORS })
  }

  const db = getDb()
  const results = await db`
    SELECT owner, name, description, downloads, updated_at
    FROM tools
    WHERE to_tsvector('english',
        coalesce(name,'') || ' ' || coalesce(description,'') || ' ' || array_to_string(tags,' ')
      ) @@ plainto_tsquery('english', ${q})
    ORDER BY downloads DESC
    LIMIT 20
  `
  return NextResponse.json(results, { headers: CORS })
}
