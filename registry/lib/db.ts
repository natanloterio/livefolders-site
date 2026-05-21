import { neon } from '@neondatabase/serverless'

export function getDb() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not set')
  return neon(process.env.DATABASE_URL)
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
