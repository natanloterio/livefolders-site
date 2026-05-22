import { NextResponse } from 'next/server'
import yaml from 'js-yaml'
import { getDb } from '@/lib/db'
import { verifyRepoOwnership, fetchRepoMeta } from '@/lib/github'
import { publishLimiter, checkRateLimit } from '@/lib/ratelimit'

function getIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}

export async function POST(req: Request) {
  const ip = getIp(req)
  const rl = await checkRateLimit(publishLimiter, ip)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'rate limit exceeded (10 publishes/hour per IP)' },
      { status: 429, headers: { 'X-RateLimit-Remaining': '0', 'X-RateLimit-Reset': String(rl.reset) } }
    )
  }

  let body: { token?: string; repo?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }

  if (!body.token) return NextResponse.json({ error: 'token is required' }, { status: 400 })
  if (!body.repo) return NextResponse.json({ error: 'repo is required' }, { status: 400 })

  const slugMatch = body.repo.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/)
  if (!slugMatch) {
    return NextResponse.json({ error: 'repo must be in owner/name format' }, { status: 400 })
  }
  const [, repoOwner, repoName] = slugMatch

  let login: string
  try {
    const user = await verifyRepoOwnership(body.token, body.repo)
    login = user.login
  } catch {
    return NextResponse.json({ error: 'invalid_token or GitHub API error' }, { status: 401 })
  }

  if (login.toLowerCase() !== repoOwner.toLowerCase()) {
    return NextResponse.json({ error: 'token does not belong to repo owner' }, { status: 403 })
  }

  let meta
  try {
    meta = await fetchRepoMeta(body.token, repoOwner, repoName)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'unknown'
    if (msg === 'repo_not_found') return NextResponse.json({ error: 'repository not found' }, { status: 404 })
    if (msg === 'folder_yaml_missing') return NextResponse.json({ error: 'folder.yaml missing from repo root' }, { status: 422 })
    return NextResponse.json({ error: 'GitHub API error' }, { status: 502 })
  }

  try {
    yaml.load(meta.folderYaml)
  } catch {
    return NextResponse.json({ error: 'folder.yaml is not valid YAML' }, { status: 422 })
  }

  const db = getDb()
  await db`
    INSERT INTO tools (owner, name, description, repo_url, updated_at)
    VALUES (${repoOwner}, ${repoName}, ${meta.description}, ${meta.repoUrl}, now())
    ON CONFLICT (owner, name) DO UPDATE
      SET description = EXCLUDED.description,
          repo_url    = EXCLUDED.repo_url,
          updated_at  = now()
  `

  return NextResponse.json({
    ok: true,
    url: `${process.env.REGISTRY_BASE_URL}/${repoOwner}/${repoName}`,
  })
}
