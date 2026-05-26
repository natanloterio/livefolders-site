import { notFound } from 'next/navigation'
import { getOwnerTools } from '@/lib/store'
import { ToolRow, ToolSummary } from '@/components/ToolRow'

export const revalidate = 60

export default async function OwnerPage({
  params,
}: {
  params: Promise<{ owner: string }>
}) {
  const { owner } = await params
  const tools = await getOwnerTools(owner)
  if (tools.length === 0) notFound()

  return (
    <div className="container">
      <p><a href="/">Registry home</a></p>

      <h1 style={{ color: '#000080', borderBottom: '6px solid #000', paddingBottom: 8 }}>
        {owner}
      </h1>
      <p>{tools.length} tool{tools.length !== 1 ? 's' : ''} published</p>

      <table>
        <thead><tr><th>Tool</th><th>Description</th><th>Downloads</th></tr></thead>
        <tbody>{(tools as ToolSummary[]).map(t => <ToolRow key={t.name} tool={t} />)}</tbody>
      </table>

      <hr />
      <p style={{ fontSize: '0.85rem' }}>
        <a href="https://github.com/natanloterio/LiveFolders">LiveFolders on GitHub</a>
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
