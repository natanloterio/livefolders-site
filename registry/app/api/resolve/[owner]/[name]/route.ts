import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { readLimiter, checkRateLimit } from '@/lib/ratelimit'

function getIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}

async function getLatestTag(owner: string, repo: string): Promise<string | null> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/tags`,
    { headers: { 'User-Agent': 'livefolders-registry' } }
  )
  if (!res.ok) return null
  const tags: { name: string }[] = await res.json()
  return tags[0]?.name ?? null
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
  const url = new URL(req.url)
  const version = url.searchParams.get('version')

  const db = getDb()
  const rows = await db`
    SELECT repo_url FROM tools WHERE owner = ${owner} AND name = ${name}
  `
  if (rows.length === 0) {
    return NextResponse.json({ error: 'tool not found' }, { status: 404 })
  }

  const repoUrl: string = rows[0].repo_url
  const ghPath = repoUrl.replace('https://github.com/', '')

  let tag = version
  if (!tag) {
    const [ghOwner, ghRepo] = ghPath.split('/')
    tag = await getLatestTag(ghOwner, ghRepo)
    if (!tag) {
      return NextResponse.json({ error: 'no versions (git tags) found for this tool' }, { status: 404 })
    }
  }

  const tarball_url = `https://github.com/${ghPath}/archive/${tag}.tar.gz`
  return NextResponse.json({ owner, name, version: tag, tarball_url })
}
