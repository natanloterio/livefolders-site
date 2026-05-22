import postgres from 'postgres'

let _sql: ReturnType<typeof postgres> | null = null

export function getDb() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not set')
  if (!_sql) _sql = postgres(process.env.DATABASE_URL, { max: 1, ssl: 'require', connect_timeout: 10 })
  return _sql
}

export type Tool = {
  id: number
  owner: string
  name: string
  description: string | null
  repo_url: string
  tags: string[]
  downloads: number
  created_at: string
  updated_at: string
}
