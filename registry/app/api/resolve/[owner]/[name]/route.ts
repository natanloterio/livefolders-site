import { NextResponse } from 'next/server'
import { findTool } from '@/lib/store'
import { readLimiter, checkRateLimit } from '@/lib/ratelimit'

function getIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}

async function getLatestTag(owner: string, repo: string, prefix?: string): Promise<string | null> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/tags?per_page=100`,
    { headers: { 'User-Agent': 'livefolders-registry' } }
  )
  if (!res.ok) return null
  const tags: { name: string }[] = await res.json()
  if (prefix) {
    const filtered = tags.filter(t => t.name.startsWith(`${prefix}-`))
    return filtered[0]?.name ?? null
  }
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

  const tool = await findTool(owner, name)
  if (!tool) return NextResponse.json({ error: 'tool not found' }, { status: 404 })

  const ghPath = tool.repo_url.replace('https://github.com/', '')
  const [ghOwner, ghRepo] = ghPath.split('/')

  let tag = version
  if (!tag) {
    tag = await getLatestTag(ghOwner, ghRepo, tool.subdir ?? undefined)
    if (!tag) {
      return NextResponse.json({ error: 'no versions (git tags) found for this tool' }, { status: 404 })
    }
  }

  const tarball_url = `https://github.com/${ghPath}/archive/${tag}.tar.gz`
  const response: Record<string, string> = { owner, name, version: tag, tarball_url }
  if (tool.subdir) response.subdir = tool.subdir
  return NextResponse.json(response)
}
