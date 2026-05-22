import { notFound } from 'next/navigation'
import { getDb } from '@/lib/db'
import type { Tool } from '@/lib/db'

export const revalidate = 60

async function getTool(owner: string, name: string): Promise<Tool | null> {
  const db = getDb()
  const rows = await db`SELECT * FROM tools WHERE owner = ${owner} AND name = ${name}` as unknown as Tool[]
  return rows[0] ?? null
}

async function getVersions(owner: string, name: string): Promise<string[]> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${name}/tags`, {
    headers: { 'User-Agent': 'livefolders-registry' },
    next: { revalidate: 300 },
  })
  if (!res.ok) return []
  const tags: { name: string }[] = await res.json()
  return tags.map(t => t.name)
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ owner: string; name: string }>
}) {
  const { owner, name } = await params
  const [tool, versions] = await Promise.all([getTool(owner, name), getVersions(owner, name)])
  if (!tool) notFound()

  const installCmd = `livefolders install ${owner}/${name}`

  return (
    <div className="container">
      <p><a href="/">← Registry</a></p>

      <h1 style={{ color: '#000080' }}>{owner}/{name}</h1>
      <p>{tool.description ?? 'No description.'}</p>

      <div className="box">
        <strong>Install:</strong><br />
        <code>{installCmd}</code>
      </div>

      <table style={{ width: 'auto', marginBottom: 16 }}>
        <tbody>
          <tr><th>Downloads</th><td>{tool.downloads.toLocaleString()}</td></tr>
          <tr><th>Repository</th><td><a href={tool.repo_url} target="_blank" rel="noreferrer">{tool.repo_url}</a></td></tr>
          <tr><th>Published</th><td>{new Date(tool.created_at).toLocaleDateString()}</td></tr>
          <tr><th>Updated</th><td>{new Date(tool.updated_at).toLocaleDateString()}</td></tr>
        </tbody>
      </table>

      {versions.length > 0 && (
        <>
          <h2>Versions</h2>
          <ul>
            {versions.map(v => (
              <li key={v}>
                <code>{v}</code>
                {' — '}
                <code>livefolders install {owner}/{name}@{v}</code>
              </li>
            ))}
          </ul>
        </>
      )}

      <hr />
      <p style={{ fontSize: '0.85rem' }}>
        <a href="https://github.com/natanloterio/LiveFolders">LiveFolders</a>
        {' · '}
        <a href="/">Registry home</a>
        {' · '}
        <a href="/privacy">Privacy</a>
        {' · '}
        <a href="/terms">Terms</a>
        {' · '}
        <a href="/security">Security</a>
      </p>
    </div>
  )
}
