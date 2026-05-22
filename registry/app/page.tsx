import { getDb } from '@/lib/db'
import { ToolRow, ToolSummary } from '@/components/ToolRow'
import './globals.css'

export const revalidate = 60

async function getRecentTools(): Promise<ToolSummary[]> {
  const db = getDb()
  return db`SELECT owner, name, description, downloads FROM tools ORDER BY created_at DESC LIMIT 10` as unknown as Promise<ToolSummary[]>
}

async function getMostDownloaded(): Promise<ToolSummary[]> {
  const db = getDb()
  return db`SELECT owner, name, description, downloads FROM tools ORDER BY downloads DESC LIMIT 10` as unknown as Promise<ToolSummary[]>
}

async function searchTools(q: string): Promise<ToolSummary[]> {
  const db = getDb()
  return db`
    SELECT owner, name, description, downloads FROM tools
    WHERE to_tsvector('english',
        coalesce(name,'') || ' ' || coalesce(description,'') || ' ' || array_to_string(tags,' ')
      ) @@ plainto_tsquery('english', ${q})
    ORDER BY downloads DESC LIMIT 20
  ` as unknown as Promise<ToolSummary[]>
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = q?.trim() ?? ''

  const [recent, popular, results] = await Promise.all([
    query ? Promise.resolve([]) : getRecentTools(),
    query ? Promise.resolve([]) : getMostDownloaded(),
    query ? searchTools(query) : Promise.resolve([]),
  ])

  return (
    <div className="container">
      <h1 style={{ color: '#000080', borderBottom: '6px solid #000', paddingBottom: 8 }}>
        LiveFolders Registry
      </h1>
      <p>Discover and install LiveFolders tools. <code>livefolders install owner/name</code></p>

      <form method="GET" style={{ margin: '16px 0' }}>
        <input
          name="q"
          defaultValue={query}
          placeholder="Search tools..."
          style={{ fontFamily: 'inherit', fontSize: '1rem', padding: '4px 8px', border: '3px solid #000', width: 280 }}
        />
        {' '}
        <button type="submit" className="btn">Search</button>
      </form>

      {query ? (
        <>
          <h2>Results for &ldquo;{query}&rdquo;</h2>
          {results.length === 0 ? <p>No tools found.</p> : (
            <table>
              <thead><tr><th>Tool</th><th>Description</th><th>Downloads</th></tr></thead>
              <tbody>{results.map(t => <ToolRow key={`${t.owner}/${t.name}`} tool={t} />)}</tbody>
            </table>
          )}
        </>
      ) : (
        <>
          <h2>Most Downloaded</h2>
          <table>
            <thead><tr><th>Tool</th><th>Description</th><th>Downloads</th></tr></thead>
            <tbody>{popular.map(t => <ToolRow key={`${t.owner}/${t.name}`} tool={t} />)}</tbody>
          </table>

          <h2>Recently Published</h2>
          <table>
            <thead><tr><th>Tool</th><th>Description</th><th>Downloads</th></tr></thead>
            <tbody>{recent.map(t => <ToolRow key={`${t.owner}/${t.name}`} tool={t} />)}</tbody>
          </table>
        </>
      )}

      <hr />
      <p style={{ fontSize: '0.85rem' }}>
        <a href="https://github.com/natanloterio/LiveFolders">LiveFolders on GitHub</a>
        {' · '}
        <a href="https://www.livefoldersfs.org">livefoldersfs.org</a>
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
