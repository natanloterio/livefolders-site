import { NextResponse } from 'next/server'
import yaml from 'js-yaml'
import { upsertTool } from '@/lib/store'
import { verifyRepoOwnership, fetchRepoMeta } from '@/lib/github'

export async function POST(req: Request) {
  let body: { token?: string; repo?: string; subdir?: string }
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

  const subdir = body.subdir ?? undefined
  if (subdir !== undefined && !/^[a-zA-Z0-9_.-]+$/.test(subdir)) {
    return NextResponse.json({ error: 'subdir must contain only alphanumeric characters, underscores, dots, or hyphens' }, { status: 400 })
  }

  const toolName = subdir ?? repoName

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
    meta = await fetchRepoMeta(body.token, repoOwner, repoName, subdir)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'unknown'
    if (msg === 'repo_not_found') return NextResponse.json({ error: 'repository not found' }, { status: 404 })
    if (msg === 'folder_yaml_missing') {
      const filePath = subdir ? `${subdir}/folder.yaml` : 'folder.yaml'
      return NextResponse.json({ error: `folder.yaml missing from ${filePath}` }, { status: 422 })
    }
    return NextResponse.json({ error: 'GitHub API error' }, { status: 502 })
  }

  try {
    yaml.load(meta.folderYaml)
  } catch {
    return NextResponse.json({ error: 'folder.yaml is not valid YAML' }, { status: 422 })
  }

  try {
    await upsertTool({
      owner: repoOwner,
      name: toolName,
      description: meta.description,
      repo_url: meta.repoUrl,
      subdir: subdir ?? null,
      tags: [],
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : ''
    if (msg === 'conflict') {
      return NextResponse.json({ error: 'concurrent publish detected, please retry' }, { status: 409 })
    }
    return NextResponse.json({ error: 'failed to save tool' }, { status: 502 })
  }

  return NextResponse.json({
    ok: true,
    url: `${process.env.REGISTRY_BASE_URL}/${repoOwner}/${toolName}`,
  })
}
