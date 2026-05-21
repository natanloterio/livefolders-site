export type ToolSummary = {
  owner: string
  name: string
  description: string | null
  downloads: number
}

export function ToolRow({ tool }: { tool: ToolSummary }) {
  return (
    <tr>
      <td>
        <a href={`/${tool.owner}/${tool.name}`}>
          <code>{tool.owner}/{tool.name}</code>
        </a>
      </td>
      <td>{tool.description ?? '—'}</td>
      <td>{tool.downloads.toLocaleString()}</td>
    </tr>
  )
}
