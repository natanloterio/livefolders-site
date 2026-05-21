import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ owner: string; name: string }> }
) {
  const { owner, name } = await params
  const db = getDb()
  const rows = await db`
    UPDATE tools SET downloads = downloads + 1
    WHERE owner = ${owner} AND name = ${name}
    RETURNING downloads
  `
  if (rows.length === 0) return NextResponse.json({ error: 'tool not found' }, { status: 404 })
  return NextResponse.json({ downloads: rows[0].downloads })
}
