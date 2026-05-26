import fs from 'fs'
import path from 'path'
import { Redis } from '@upstash/redis'

type StoredTool = {
  owner: string
  name: string
  description: string | null
  repo_url: string
  subdir: string | null
  tags: string[]
  created_at: string
  updated_at: string
}

export type Tool = StoredTool & { downloads: number }

const DATA_PATH = path.join(process.cwd(), 'data', 'tools.json')

function readLocal(): StoredTool[] {
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8')) as StoredTool[]
  } catch {
    return []
  }
}

async function fetchFromGitHub(): Promise<{ tools: StoredTool[]; sha: string }> {
  const token = process.env.GITHUB_TOKEN
  const repo = process.env.GITHUB_REPO
  if (!token || !repo) throw new Error('GITHUB_TOKEN or GITHUB_REPO not configured')

  const res = await fetch(
    `https://api.github.com/repos/${repo}/contents/registry/data/tools.json`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'livefolders-registry',
        Accept: 'application/vnd.github.v3+json',
      },
    }
  )
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)
  const data = (await res.json()) as { content: string; sha: string }
  const tools = JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8')) as StoredTool[]
  return { tools, sha: data.sha }
}

async function commitToGitHub(tools: StoredTool[], sha: string, message: string): Promise<void> {
  const token = process.env.GITHUB_TOKEN!
  const repo = process.env.GITHUB_REPO!

  const res = await fetch(
    `https://api.github.com/repos/${repo}/contents/registry/data/tools.json`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'livefolders-registry',
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        message,
        content: Buffer.from(JSON.stringify(tools, null, 2) + '\n').toString('base64'),
        sha,
      }),
    }
  )
  if (res.status === 409) throw new Error('conflict')
  if (!res.ok) throw new Error(`GitHub commit failed: ${res.status}`)
}

let _redis: Redis | null = null
function getRedis(): Redis {
  if (!_redis) _redis = Redis.fromEnv()
  return _redis
}

function dlKey(owner: string, name: string): string {
  return `dl:${owner}:${name}`
}

async function attachDownloads(tools: StoredTool[]): Promise<Tool[]> {
  if (tools.length === 0) return []
  const keys = tools.map(t => dlKey(t.owner, t.name))
  const vals = await getRedis().mget<(number | null)[]>(...(keys as [string, ...string[]]))
  return tools.map((t, i) => ({ ...t, downloads: (vals[i] as number | null) ?? 0 }))
}

export async function getRecentTools(limit = 10): Promise<Tool[]> {
  const tools = readLocal()
    .slice()
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit)
  return attachDownloads(tools)
}

export async function getMostDownloaded(limit = 10): Promise<Tool[]> {
  const withCounts = await attachDownloads(readLocal())
  return withCounts.sort((a, b) => b.downloads - a.downloads).slice(0, limit)
}

export async function searchTools(q: string, limit = 20): Promise<Tool[]> {
  const lower = q.toLowerCase()
  const matched = readLocal().filter(
    t =>
      t.name.toLowerCase().includes(lower) ||
      (t.description?.toLowerCase().includes(lower) ?? false) ||
      t.tags.some(tag => tag.toLowerCase().includes(lower))
  )
  const withCounts = await attachDownloads(matched)
  return withCounts.sort((a, b) => b.downloads - a.downloads).slice(0, limit)
}

export async function findTool(owner: string, name: string): Promise<Tool | null> {
  const stored = readLocal().find(t => t.owner === owner && t.name === name)
  if (!stored) return null
  const downloads = ((await getRedis().get<number>(dlKey(owner, name))) as number | null) ?? 0
  return { ...stored, downloads }
}

export async function getOwnerTools(owner: string): Promise<Tool[]> {
  const tools = readLocal().filter(t => t.owner === owner)
  const withCounts = await attachDownloads(tools)
  return withCounts.sort((a, b) => b.downloads - a.downloads)
}

export function toolExists(owner: string, name: string): boolean {
  return readLocal().some(t => t.owner === owner && t.name === name)
}

export async function incrementDownloads(owner: string, name: string): Promise<number> {
  return getRedis().incr(dlKey(owner, name))
}

export async function upsertTool(
  tool: Omit<StoredTool, 'created_at' | 'updated_at'>
): Promise<void> {
  const { tools, sha } = await fetchFromGitHub()
  const now = new Date().toISOString()
  const idx = tools.findIndex(t => t.owner === tool.owner && t.name === tool.name)

  const updated =
    idx >= 0
      ? tools.map((t, i) => (i === idx ? { ...t, ...tool, updated_at: now } : t))
      : [...tools, { ...tool, created_at: now, updated_at: now }]

  await commitToGitHub(updated, sha, `publish: ${tool.owner}/${tool.name}`)
}
