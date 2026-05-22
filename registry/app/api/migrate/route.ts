import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function POST(req: Request) {
  const secret = req.headers.get('x-migrate-secret')
  if (secret !== process.env.MIGRATE_SECRET) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  const db = getDb()
  await db`ALTER TABLE tools ADD COLUMN IF NOT EXISTS subdir TEXT`
  return NextResponse.json({ ok: true })
}
