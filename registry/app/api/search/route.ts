import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')
  if (!q || q.trim().length === 0) {
    return NextResponse.json({ error: 'q parameter is required' }, { status: 400 })
  }

  const db = getDb()
  const results = await db`
    SELECT owner, name, description, downloads, updated_at
    FROM tools
    WHERE to_tsvector('english',
        coalesce(name,'') || ' ' || coalesce(description,'') || ' ' || array_to_string(tags,' ')
      ) @@ plainto_tsquery('english', ${q})
    ORDER BY downloads DESC
    LIMIT 20
  `
  return NextResponse.json({ results })
}
