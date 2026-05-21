import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ owner: string; name: string }> }
) {
  const { owner, name } = await params
  const db = getDb()
  const rows = await db`SELECT * FROM tools WHERE owner = ${owner} AND name = ${name}`
  if (rows.length === 0) return NextResponse.json({ error: 'tool not found' }, { status: 404 })
  return NextResponse.json(rows[0])
}
