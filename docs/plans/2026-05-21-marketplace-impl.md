# LiveFolders Marketplace Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build registry.livefolders.org — a central package registry for LiveFolders tools, plus new CLI subcommands (search, install, info, publish) in the LiveFolders Rust binary.

**Architecture:** Next.js App Router on Vercel with Neon Postgres. Tools live on GitHub; the registry stores metadata only and resolves installs to GitHub tarball URLs. GitHub OAuth tokens verify ownership at publish time and are never stored.

**Tech Stack:** Next.js 15 (App Router), Neon Postgres (@neondatabase/serverless), js-yaml (folder.yaml parsing), Upstash Redis (rate limiting), Rust (CLI additions in the LiveFolders binary)

> **Note on repos:** The registry web app lives in `registry/` inside this repo. CLI changes go in the separate LiveFolders Rust repo (https://github.com/natanloterio/LiveFolders). Tasks 1–9 cover the registry. Tasks 10–13 cover the CLI and should be done in that repo.

---

## Task 1: Bootstrap the Next.js registry app

**Files:**
- Create: `registry/` (new Next.js project)
- Create: `registry/package.json`
- Create: `registry/.env.local` (gitignored)
- Create: `registry/vercel.json`

**Step 1: Scaffold the project**

```bash
cd /media/loterio/workspace/workspace/research/livefolders.org
npx create-next-app@latest registry \
  --typescript \
  --tailwind=false \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias="@/*" \
  --no-git
```

**Step 2: Install dependencies**

```bash
cd registry
npm install @neondatabase/serverless js-yaml
npm install --save-dev @types/js-yaml jest @types/jest jest-environment-node ts-jest
```

**Step 3: Configure Jest**

Create `registry/jest.config.ts`:
```typescript
import type { Config } from 'jest'

const config: Config = {
  testEnvironment: 'node',
  transform: { '^.+\\.tsx?$': ['ts-jest', {}] },
  testPathPattern: '__tests__',
}

export default config
```

**Step 4: Create `.env.local`**

```bash
cat > registry/.env.local << 'EOF'
DATABASE_URL=your_neon_connection_string_here
REGISTRY_BASE_URL=http://localhost:3000
EOF
```

Add to `registry/.gitignore`:
```
.env.local
```

**Step 5: Verify it starts**

```bash
cd registry && npm run dev
```
Expected: Next.js dev server running at http://localhost:3000

**Step 6: Commit**

```bash
cd ..
git add registry/
git commit -m "feat: bootstrap Next.js registry app"
```

---

## Task 2: Database schema and connection

**Files:**
- Create: `registry/lib/db.ts`
- Create: `registry/lib/schema.sql`
- Create: `registry/__tests__/db.test.ts`

**Step 1: Write the schema file**

Create `registry/lib/schema.sql`:
```sql
CREATE TABLE IF NOT EXISTS tools (
  id           SERIAL PRIMARY KEY,
  owner        TEXT NOT NULL,
  name         TEXT NOT NULL,
  description  TEXT,
  repo_url     TEXT NOT NULL,
  tags         TEXT[] DEFAULT '{}',
  downloads    INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(owner, name)
);

CREATE INDEX IF NOT EXISTS tools_search_idx
  ON tools USING GIN (to_tsvector('english', coalesce(name,'') || ' ' || coalesce(description,'') || ' ' || array_to_string(tags, ' ')));
```

**Step 2: Write the db module**

Create `registry/lib/db.ts`:
```typescript
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
```

**Step 3: Run schema against Neon**

Sign up at neon.tech, create a project, copy the connection string into `.env.local`, then:
```bash
cd registry
node -e "
const { neon } = require('@neondatabase/serverless')
const fs = require('fs')
require('dotenv').config({ path: '.env.local' })
const sql = neon(process.env.DATABASE_URL)
const schema = fs.readFileSync('lib/schema.sql', 'utf8')
sql(schema).then(() => { console.log('Schema applied'); process.exit(0) })
"
```
Expected: `Schema applied`

**Step 4: Write a smoke test**

Create `registry/__tests__/db.test.ts`:
```typescript
import { getDb } from '../lib/db'

describe('db', () => {
  it('throws when DATABASE_URL is missing', () => {
    const orig = process.env.DATABASE_URL
    delete process.env.DATABASE_URL
    expect(() => getDb()).toThrow('DATABASE_URL not set')
    process.env.DATABASE_URL = orig
  })
})
```

**Step 5: Run the test**

```bash
cd registry && npx jest __tests__/db.test.ts
```
Expected: PASS

**Step 6: Commit**

```bash
git add registry/lib/ registry/__tests__/db.test.ts
git commit -m "feat: add database schema and connection module"
```

---

## Task 3: POST /api/publish

**Files:**
- Create: `registry/app/api/publish/route.ts`
- Create: `registry/lib/github.ts`
- Create: `registry/lib/ratelimit.ts`
- Create: `registry/__tests__/publish.test.ts`

**Step 1: Write the failing test**

Create `registry/__tests__/publish.test.ts`:
```typescript
import { POST } from '../app/api/publish/route'

const makeRequest = (body: unknown) =>
  new Request('http://localhost/api/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

describe('POST /api/publish', () => {
  it('returns 400 when token is missing', async () => {
    const res = await POST(makeRequest({ repo: 'owner/name' }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/token/)
  })

  it('returns 400 when repo is missing', async () => {
    const res = await POST(makeRequest({ token: 'ghp_abc' }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/repo/)
  })

  it('returns 400 when repo format is invalid', async () => {
    const res = await POST(makeRequest({ token: 'ghp_abc', repo: 'notaslug' }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/owner\/name/)
  })
})
```

**Step 2: Run test — expect FAIL**

```bash
cd registry && npx jest __tests__/publish.test.ts
```
Expected: FAIL — module not found

**Step 3: Write the GitHub helper**

Create `registry/lib/github.ts`:
```typescript
export type RepoMeta = {
  owner: string
  name: string
  description: string | null
  repoUrl: string
  folderYaml: string
}

export async function verifyRepoOwnership(
  token: string,
  repoSlug: string
): Promise<{ login: string }> {
  const res = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'livefolders-registry' },
  })
  if (!res.ok) throw new Error('invalid_token')
  return res.json()
}

export async function fetchRepoMeta(
  token: string,
  owner: string,
  repo: string
): Promise<RepoMeta> {
  const [repoRes, fileRes] = await Promise.all([
    fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'livefolders-registry' },
    }),
    fetch(`https://api.github.com/repos/${owner}/${repo}/contents/folder.yaml`, {
      headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'livefolders-registry' },
    }),
  ])

  if (!repoRes.ok) throw new Error('repo_not_found')
  if (!fileRes.ok) throw new Error('folder_yaml_missing')

  const repoData = await repoRes.json()
  const fileData = await fileRes.json()
  const folderYaml = Buffer.from(fileData.content, 'base64').toString('utf8')

  return {
    owner,
    name: repo,
    description: repoData.description ?? null,
    repoUrl: repoData.html_url,
    folderYaml,
  }
}
```

**Step 4: Write the rate limiter**

Create `registry/lib/ratelimit.ts`:
```typescript
// Simple in-memory rate limiter (Upstash Redis recommended for production multi-instance)
const counts = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = counts.get(key)
  if (!entry || now > entry.resetAt) {
    counts.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= max) return false
  entry.count++
  return true
}
```

**Step 5: Write the route handler**

Create `registry/app/api/publish/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import yaml from 'js-yaml'
import { getDb } from '@/lib/db'
import { verifyRepoOwnership, fetchRepoMeta } from '@/lib/github'
import { checkRateLimit } from '@/lib/ratelimit'

export async function POST(req: Request) {
  let body: { token?: string; repo?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }

  if (!body.token) return NextResponse.json({ error: 'token is required' }, { status: 400 })
  if (!body.repo) return NextResponse.json({ error: 'repo is required' }, { status: 400 })

  const slugMatch = body.repo.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/)
  if (!slugMatch) {
    return NextResponse.json({ error: 'repo must be in owner/name format' }, { status: 400 })
  }
  const [, repoOwner, repoName] = slugMatch

  let login: string
  try {
    const user = await verifyRepoOwnership(body.token, body.repo)
    login = user.login
  } catch {
    return NextResponse.json({ error: 'invalid_token or GitHub API error' }, { status: 401 })
  }

  if (login.toLowerCase() !== repoOwner.toLowerCase()) {
    return NextResponse.json({ error: 'token does not belong to repo owner' }, { status: 403 })
  }

  if (!checkRateLimit(login, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'rate limit exceeded (10 publishes/hour)' }, { status: 429 })
  }

  let meta
  try {
    meta = await fetchRepoMeta(body.token, repoOwner, repoName)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'unknown'
    if (msg === 'repo_not_found') return NextResponse.json({ error: 'repository not found' }, { status: 404 })
    if (msg === 'folder_yaml_missing') return NextResponse.json({ error: 'folder.yaml missing from repo root' }, { status: 422 })
    return NextResponse.json({ error: 'GitHub API error' }, { status: 502 })
  }

  try {
    yaml.load(meta.folderYaml)
  } catch {
    return NextResponse.json({ error: 'folder.yaml is not valid YAML' }, { status: 422 })
  }

  const db = getDb()
  await db`
    INSERT INTO tools (owner, name, description, repo_url, updated_at)
    VALUES (${repoOwner}, ${repoName}, ${meta.description}, ${meta.repoUrl}, now())
    ON CONFLICT (owner, name) DO UPDATE
      SET description = EXCLUDED.description,
          repo_url    = EXCLUDED.repo_url,
          updated_at  = now()
  `

  return NextResponse.json({
    ok: true,
    url: `${process.env.REGISTRY_BASE_URL}/${repoOwner}/${repoName}`,
  })
}
```

**Step 6: Run tests — expect PASS**

```bash
cd registry && npx jest __tests__/publish.test.ts
```
Expected: PASS (3 tests)

**Step 7: Commit**

```bash
git add registry/app/api/publish/ registry/lib/github.ts registry/lib/ratelimit.ts registry/__tests__/publish.test.ts
git commit -m "feat: add POST /api/publish endpoint"
```

---

## Task 4: GET /api/resolve/[owner]/[name]

**Files:**
- Create: `registry/app/api/resolve/[owner]/[name]/route.ts`
- Create: `registry/__tests__/resolve.test.ts`

**Step 1: Write the failing test**

Create `registry/__tests__/resolve.test.ts`:
```typescript
import { GET } from '../app/api/resolve/[owner]/[name]/route'

const makeRequest = (owner: string, name: string, version?: string) => {
  const url = version
    ? `http://localhost/api/resolve/${owner}/${name}?version=${version}`
    : `http://localhost/api/resolve/${owner}/${name}`
  return new Request(url)
}

// Mock getDb
jest.mock('../lib/db', () => ({
  getDb: () => async (strings: TemplateStringsArray, ...values: unknown[]) => {
    // Return a fake tool row for natanloterio/weather
    if (values.includes('natanloterio') && values.includes('weather')) {
      return [{ repo_url: 'https://github.com/natanloterio/weather' }]
    }
    return []
  },
}))

describe('GET /api/resolve', () => {
  it('returns 404 for unknown tool', async () => {
    const res = await GET(makeRequest('nobody', 'nothing'), {
      params: Promise.resolve({ owner: 'nobody', name: 'nothing' }),
    })
    expect(res.status).toBe(404)
  })

  it('returns tarball_url for latest', async () => {
    const res = await GET(makeRequest('natanloterio', 'weather'), {
      params: Promise.resolve({ owner: 'natanloterio', name: 'weather' }),
    })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.tarball_url).toContain('natanloterio/weather')
  })
})
```

**Step 2: Run test — expect FAIL**

```bash
cd registry && npx jest __tests__/resolve.test.ts
```
Expected: FAIL — module not found

**Step 3: Write the route**

Create `registry/app/api/resolve/[owner]/[name]/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

async function getLatestTag(owner: string, repo: string): Promise<string | null> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/tags`,
    { headers: { 'User-Agent': 'livefolders-registry' } }
  )
  if (!res.ok) return null
  const tags: { name: string }[] = await res.json()
  return tags[0]?.name ?? null
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ owner: string; name: string }> }
) {
  const { owner, name } = await params
  const url = new URL(_req.url)
  const version = url.searchParams.get('version')

  const db = getDb()
  const rows = await db`
    SELECT repo_url FROM tools WHERE owner = ${owner} AND name = ${name}
  `
  if (rows.length === 0) {
    return NextResponse.json({ error: 'tool not found' }, { status: 404 })
  }

  const repoUrl: string = rows[0].repo_url
  const ghPath = repoUrl.replace('https://github.com/', '')

  let tag = version
  if (!tag) {
    tag = await getLatestTag(owner, name)
    if (!tag) {
      return NextResponse.json({ error: 'no versions (git tags) found for this tool' }, { status: 404 })
    }
  }

  const tarball_url = `https://github.com/${ghPath}/archive/${tag}.tar.gz`
  return NextResponse.json({ owner, name, version: tag, tarball_url })
}
```

**Step 4: Run tests — expect PASS**

```bash
cd registry && npx jest __tests__/resolve.test.ts
```
Expected: PASS

**Step 5: Commit**

```bash
git add registry/app/api/resolve/ registry/__tests__/resolve.test.ts
git commit -m "feat: add GET /api/resolve endpoint"
```

---

## Task 5: GET /api/search

**Files:**
- Create: `registry/app/api/search/route.ts`
- Create: `registry/__tests__/search.test.ts`

**Step 1: Write the failing test**

Create `registry/__tests__/search.test.ts`:
```typescript
import { GET } from '../app/api/search/route'

jest.mock('../lib/db', () => ({
  getDb: () => async () => [
    { owner: 'natanloterio', name: 'weather', description: 'Get weather', downloads: 42 },
  ],
}))

describe('GET /api/search', () => {
  it('returns 400 when q is missing', async () => {
    const res = await GET(new Request('http://localhost/api/search'))
    expect(res.status).toBe(400)
  })

  it('returns results for a query', async () => {
    const res = await GET(new Request('http://localhost/api/search?q=weather'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.results).toHaveLength(1)
    expect(json.results[0].owner).toBe('natanloterio')
  })
})
```

**Step 2: Run test — expect FAIL**

```bash
cd registry && npx jest __tests__/search.test.ts
```
Expected: FAIL

**Step 3: Write the route**

Create `registry/app/api/search/route.ts`:
```typescript
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
```

**Step 4: Run tests — expect PASS**

```bash
cd registry && npx jest __tests__/search.test.ts
```
Expected: PASS

**Step 5: Commit**

```bash
git add registry/app/api/search/ registry/__tests__/search.test.ts
git commit -m "feat: add GET /api/search endpoint"
```

---

## Task 6: GET /api/tools/[owner]/[name] and POST downloads

**Files:**
- Create: `registry/app/api/tools/[owner]/[name]/route.ts`
- Create: `registry/app/api/tools/[owner]/[name]/downloads/route.ts`
- Create: `registry/__tests__/tools.test.ts`

**Step 1: Write the failing tests**

Create `registry/__tests__/tools.test.ts`:
```typescript
import { GET } from '../app/api/tools/[owner]/[name]/route'
import { POST } from '../app/api/tools/[owner]/[name]/downloads/route'

const fakeTool = { owner: 'alice', name: 'git-helper', description: 'Helps with git', downloads: 5, repo_url: 'https://github.com/alice/git-helper', tags: [], created_at: '', updated_at: '' }

jest.mock('../lib/db', () => ({
  getDb: () => async (strings: TemplateStringsArray, ...values: unknown[]) => {
    if (values.includes('alice') && values.includes('git-helper')) return [fakeTool]
    return []
  },
}))

const ctx = (owner: string, name: string) => ({
  params: Promise.resolve({ owner, name }),
})

describe('GET /api/tools/:owner/:name', () => {
  it('returns 404 for unknown tool', async () => {
    const res = await GET(new Request('http://localhost'), ctx('nobody', 'nothing'))
    expect(res.status).toBe(404)
  })

  it('returns tool metadata', async () => {
    const res = await GET(new Request('http://localhost'), ctx('alice', 'git-helper'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.name).toBe('git-helper')
  })
})

describe('POST /api/tools/:owner/:name/downloads', () => {
  it('returns 404 for unknown tool', async () => {
    const res = await POST(new Request('http://localhost'), ctx('nobody', 'nothing'))
    expect(res.status).toBe(404)
  })
})
```

**Step 2: Run test — expect FAIL**

```bash
cd registry && npx jest __tests__/tools.test.ts
```
Expected: FAIL

**Step 3: Write the routes**

Create `registry/app/api/tools/[owner]/[name]/route.ts`:
```typescript
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
```

Create `registry/app/api/tools/[owner]/[name]/downloads/route.ts`:
```typescript
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
```

**Step 4: Run tests — expect PASS**

```bash
cd registry && npx jest __tests__/tools.test.ts
```
Expected: PASS

**Step 5: Commit**

```bash
git add registry/app/api/tools/ registry/__tests__/tools.test.ts
git commit -m "feat: add tool metadata and download counter endpoints"
```

---

## Task 7: Web UI — Home page

**Files:**
- Modify: `registry/app/page.tsx`
- Create: `registry/app/globals.css`
- Create: `registry/components/ToolRow.tsx`

**Step 1: Write globals.css (90s style matching livefolders.org)**

Create `registry/app/globals.css`:
```css
body {
  font-family: 'Times New Roman', Times, serif;
  background: #FFFAF0;
  color: #000;
  margin: 0;
  padding: 0;
}

h1, h2, h3 { font-weight: bold; text-transform: uppercase; }

code, pre, .mono {
  font-family: 'Courier New', Courier, monospace;
  background: #111;
  color: #eee;
  padding: 2px 6px;
}

a { color: #0000EE; }
a:visited { color: #551A8B; }

.box {
  border: 4px solid #000;
  padding: 12px 16px;
  margin: 12px 0;
}

.btn {
  border: 4px outset #888;
  padding: 4px 12px;
  background: #d4d0c8;
  cursor: pointer;
  font-family: inherit;
  font-weight: bold;
  text-decoration: none;
  color: #000;
}

table { border-collapse: collapse; width: 100%; }
th, td { border: 2px solid #000; padding: 6px 10px; text-align: left; }
th { background: #000080; color: #fff; }

.container { max-width: 860px; margin: 0 auto; padding: 16px; }
```

**Step 2: Write ToolRow component**

Create `registry/components/ToolRow.tsx`:
```tsx
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
```

**Step 3: Write the home page**

Replace `registry/app/page.tsx`:
```tsx
import { getDb } from '@/lib/db'
import { ToolRow, ToolSummary } from '@/components/ToolRow'
import './globals.css'

export const revalidate = 60

async function getRecentTools(): Promise<ToolSummary[]> {
  const db = getDb()
  return db`SELECT owner, name, description, downloads FROM tools ORDER BY created_at DESC LIMIT 10`
}

async function getMostDownloaded(): Promise<ToolSummary[]> {
  const db = getDb()
  return db`SELECT owner, name, description, downloads FROM tools ORDER BY downloads DESC LIMIT 10`
}

async function searchTools(q: string): Promise<ToolSummary[]> {
  const db = getDb()
  return db`
    SELECT owner, name, description, downloads FROM tools
    WHERE to_tsvector('english',
        coalesce(name,'') || ' ' || coalesce(description,'') || ' ' || array_to_string(tags,' ')
      ) @@ plainto_tsquery('english', ${q})
    ORDER BY downloads DESC LIMIT 20
  `
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
          <h2>Results for "{query}"</h2>
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
      </p>
    </div>
  )
}
```

**Step 4: Verify in browser**

```bash
cd registry && npm run dev
```
Open http://localhost:3000 — should show the registry home page with 90s styling.

**Step 5: Commit**

```bash
git add registry/app/page.tsx registry/app/globals.css registry/components/
git commit -m "feat: add registry home page with search"
```

---

## Task 8: Web UI — Tool detail page

**Files:**
- Create: `registry/app/[owner]/[name]/page.tsx`

**Step 1: Write the detail page**

Create `registry/app/[owner]/[name]/page.tsx`:
```tsx
import { notFound } from 'next/navigation'
import { getDb } from '@/lib/db'
import type { Tool } from '@/lib/db'

export const revalidate = 60

async function getTool(owner: string, name: string): Promise<Tool | null> {
  const db = getDb()
  const rows = await db`SELECT * FROM tools WHERE owner = ${owner} AND name = ${name}`
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
      </p>
    </div>
  )
}
```

**Step 2: Verify in browser**

With `npm run dev` running, visit http://localhost:3000/natanloterio/weather (after publishing a test tool).

**Step 3: Commit**

```bash
git add registry/app/[owner]/
git commit -m "feat: add tool detail page"
```

---

## Task 9: Deploy registry to Vercel

**Files:**
- Create: `registry/vercel.json`

**Step 1: Create vercel.json**

Create `registry/vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

**Step 2: Deploy**

```bash
cd registry
vercel --prod
```

Follow prompts: link to new project `livefolders-registry`, set root directory to `registry/`.

**Step 3: Set environment variables**

```bash
vercel env add DATABASE_URL production
vercel env add REGISTRY_BASE_URL production
# REGISTRY_BASE_URL = https://registry.livefolders.org
```

**Step 4: Configure custom domain**

In Vercel dashboard → Domains → Add `registry.livefolders.org`. Add the CNAME in your DNS provider.

**Step 5: Smoke test**

```bash
curl https://registry.livefolders.org/api/search?q=test
```
Expected: `{ "results": [] }`

**Step 6: Commit**

```bash
git add registry/vercel.json
git commit -m "chore: add Vercel config for registry deployment"
```

---

## Task 10: CLI — `livefolders search` (Rust)

> **Repo:** https://github.com/natanloterio/LiveFolders
> These tasks continue in that repo.

**Files:**
- Modify: `src/cli/mod.rs` — add `search` subcommand
- Create: `src/registry/mod.rs` — HTTP client for registry API
- Create: `src/registry/search.rs`

**Step 1: Add registry HTTP client**

Create `src/registry/mod.rs`:
```rust
pub mod search;
pub mod resolve;
pub mod publish;

pub const REGISTRY_URL: &str = "https://registry.livefolders.org";
```

Create `src/registry/search.rs`:
```rust
use serde::Deserialize;

#[derive(Deserialize, Debug)]
pub struct ToolSummary {
    pub owner: String,
    pub name: String,
    pub description: Option<String>,
    pub downloads: u64,
}

#[derive(Deserialize)]
struct SearchResponse {
    results: Vec<ToolSummary>,
}

pub fn search(query: &str) -> anyhow::Result<Vec<ToolSummary>> {
    let url = format!("{}/api/search?q={}", super::REGISTRY_URL, urlencoding::encode(query));
    let resp: SearchResponse = ureq::get(&url).call()?.into_json()?;
    Ok(resp.results)
}
```

**Step 2: Write the test**

In `src/registry/search.rs`, add:
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn search_returns_vec() {
        // Integration test — requires network. Run with: cargo test -- --ignored
        // Unit test: just verify the URL format compiles.
        let url = format!("{}/api/search?q={}", super::super::REGISTRY_URL, "weather");
        assert!(url.contains("weather"));
    }
}
```

**Step 3: Wire into CLI**

In `src/cli/mod.rs`, add to the subcommand enum:
```rust
Search { query: String },
```

In the match arm:
```rust
Commands::Search { query } => {
    let results = registry::search::search(&query)?;
    if results.is_empty() {
        println!("No tools found for \"{}\"", query);
    } else {
        for t in results {
            println!(
                "{}/{}\t— {}\t({} installs)",
                t.owner, t.name,
                t.description.as_deref().unwrap_or("no description"),
                t.downloads
            );
        }
    }
}
```

**Step 4: Run tests**

```bash
cargo test
```
Expected: PASS

**Step 5: Manual smoke test**

```bash
cargo run -- search weather
```

**Step 6: Commit**

```bash
git add src/registry/ src/cli/
git commit -m "feat: add livefolders search command"
```

---

## Task 11: CLI — `livefolders install` (Rust)

**Files:**
- Create: `src/registry/resolve.rs`
- Create: `src/install/mod.rs`
- Modify: `src/cli/mod.rs`

**Step 1: Write resolve.rs**

Create `src/registry/resolve.rs`:
```rust
use serde::Deserialize;

#[derive(Deserialize)]
pub struct ResolveResponse {
    pub owner: String,
    pub name: String,
    pub version: String,
    pub tarball_url: String,
}

pub fn resolve(owner: &str, name: &str, version: Option<&str>) -> anyhow::Result<ResolveResponse> {
    let mut url = format!("{}/api/resolve/{}/{}", super::REGISTRY_URL, owner, name);
    if let Some(v) = version {
        url = format!("{}?version={}", url, v);
    }
    let resp: ResolveResponse = ureq::get(&url).call()?.into_json()?;
    Ok(resp)
}
```

**Step 2: Write install module**

Create `src/install/mod.rs`:
```rust
use std::path::PathBuf;
use anyhow::Context;

pub fn install_tool(owner: &str, name: &str, version: Option<&str>) -> anyhow::Result<()> {
    let resolved = crate::registry::resolve::resolve(owner, name, version)
        .context("registry resolve failed")?;

    println!("Installing {}/{}@{}", owner, name, resolved.version);

    let bytes = ureq::get(&resolved.tarball_url)
        .call()?
        .into_reader();

    let tools_dir = tools_base_dir()?.join(owner).join(name);
    std::fs::create_dir_all(&tools_dir)?;

    let gz = flate2::read::GzDecoder::new(bytes);
    let mut archive = tar::Archive::new(gz);
    archive.unpack(&tools_dir)?;

    // Increment download counter (fire-and-forget)
    let _ = ureq::post(&format!(
        "{}/api/tools/{}/{}/downloads",
        crate::registry::REGISTRY_URL, owner, name
    )).call();

    println!("Installed to {}", tools_dir.display());
    Ok(())
}

fn tools_base_dir() -> anyhow::Result<PathBuf> {
    let home = dirs::home_dir().context("cannot find home dir")?;
    Ok(home.join(".livefolders").join("tools"))
}
```

**Step 3: Wire into CLI**

Add to subcommand enum:
```rust
Install { package: String },
```

Parse `owner/name@version` in the match arm:
```rust
Commands::Install { package } => {
    let (slug, version) = if let Some((s, v)) = package.split_once('@') {
        (s, Some(v))
    } else {
        (package.as_str(), None)
    };
    let (owner, name) = slug.split_once('/')
        .ok_or_else(|| anyhow::anyhow!("[ERROR:INVALID] package must be owner/name"))?;
    install::install_tool(owner, name, version)?;
}
```

**Step 4: Run tests and smoke test**

```bash
cargo test
cargo run -- install natanloterio/demo-tool
```

**Step 5: Commit**

```bash
git add src/registry/resolve.rs src/install/ src/cli/
git commit -m "feat: add livefolders install command"
```

---

## Task 12: CLI — `livefolders info` (Rust)

**Files:**
- Modify: `src/cli/mod.rs`
- Create: `src/registry/info.rs`

**Step 1: Write info.rs**

Create `src/registry/info.rs`:
```rust
use serde::Deserialize;

#[derive(Deserialize, Debug)]
pub struct ToolDetail {
    pub owner: String,
    pub name: String,
    pub description: Option<String>,
    pub repo_url: String,
    pub downloads: u64,
    pub updated_at: String,
}

pub fn get_info(owner: &str, name: &str) -> anyhow::Result<ToolDetail> {
    let url = format!("{}/api/tools/{}/{}", super::REGISTRY_URL, owner, name);
    let detail: ToolDetail = ureq::get(&url).call()?.into_json()?;
    Ok(detail)
}
```

**Step 2: Wire into CLI**

```rust
Commands::Info { package } => {
    let (owner, name) = package.split_once('/')
        .ok_or_else(|| anyhow::anyhow!("[ERROR:INVALID] package must be owner/name"))?;
    let info = registry::info::get_info(owner, name)?;
    println!("{}/{}", info.owner, info.name);
    println!("  Description: {}", info.description.as_deref().unwrap_or("—"));
    println!("  Repository:  {}", info.repo_url);
    println!("  Downloads:   {}", info.downloads);
    println!("  Updated:     {}", info.updated_at);
    println!("  Install:     livefolders install {}/{}", owner, name);
}
```

**Step 3: Run and commit**

```bash
cargo test
cargo run -- info natanloterio/weather
git add src/registry/info.rs src/cli/
git commit -m "feat: add livefolders info command"
```

---

## Task 13: CLI — `livefolders publish` (Rust)

**Files:**
- Create: `src/publish/mod.rs`
- Modify: `src/cli/mod.rs`

**Step 1: Write publish module**

Create `src/publish/mod.rs`:
```rust
use anyhow::Context;

pub fn publish() -> anyhow::Result<()> {
    // 1. Detect repo slug from git remote
    let remote = std::process::Command::new("git")
        .args(["remote", "get-url", "origin"])
        .output()
        .context("failed to run git")?;
    let remote_url = String::from_utf8(remote.stdout)?.trim().to_string();
    let repo_slug = extract_slug(&remote_url)
        .ok_or_else(|| anyhow::anyhow!("[ERROR:CONFIG] could not parse GitHub remote URL"))?;

    // 2. Warn if no git tags
    let tags = std::process::Command::new("git")
        .args(["tag", "--list"])
        .output()?;
    if tags.stdout.is_empty() {
        eprintln!("Warning: no git tags found. Create a tag (e.g. git tag v0.1.0) for versioned installs.");
    }

    // 3. Open GitHub OAuth — for now, prompt for a personal access token
    //    (Full OAuth device flow is a future enhancement)
    println!("Enter a GitHub personal access token with `repo` scope:");
    let token = rpassword::read_password()?;

    // 4. POST to registry
    let registry_url = crate::registry::REGISTRY_URL;
    let body = serde_json::json!({ "token": token, "repo": repo_slug });
    let resp = ureq::post(&format!("{}/api/publish", registry_url))
        .send_json(body)?;

    let json: serde_json::Value = resp.into_json()?;
    if let Some(url) = json.get("url").and_then(|u| u.as_str()) {
        println!("Published! View at: {}", url);
    }

    Ok(())
}

fn extract_slug(remote_url: &str) -> Option<String> {
    // Handles https://github.com/owner/repo.git and git@github.com:owner/repo.git
    let cleaned = remote_url.trim_end_matches(".git");
    if let Some(path) = cleaned.strip_prefix("https://github.com/") {
        return Some(path.to_string());
    }
    if let Some(path) = cleaned.strip_prefix("git@github.com:") {
        return Some(path.to_string());
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn extracts_https_slug() {
        assert_eq!(
            extract_slug("https://github.com/alice/weather.git"),
            Some("alice/weather".to_string())
        );
    }

    #[test]
    fn extracts_ssh_slug() {
        assert_eq!(
            extract_slug("git@github.com:alice/weather.git"),
            Some("alice/weather".to_string())
        );
    }

    #[test]
    fn returns_none_for_non_github() {
        assert_eq!(extract_slug("https://gitlab.com/alice/weather.git"), None);
    }
}
```

**Step 2: Wire into CLI**

```rust
Commands::Publish => {
    publish::publish()?;
}
```

**Step 3: Run tests**

```bash
cargo test publish
```
Expected: 3 tests PASS

**Step 4: End-to-end test**

```bash
# From inside a folder with folder.yaml and a GitHub remote:
cargo run -- publish
```

**Step 5: Commit**

```bash
git add src/publish/ src/cli/
git commit -m "feat: add livefolders publish command"
```

---

## Success Verification

After all tasks complete, verify the full end-to-end flow:

```bash
# 1. Publish a tool
cd ~/my-livefolders-tool
livefolders publish

# 2. Search for it
livefolders search my-tool-name

# 3. Install it from another machine
livefolders install myusername/my-tool-name

# 4. Check info
livefolders info myusername/my-tool-name

# 5. Check web UI
open https://registry.livefolders.org/myusername/my-tool-name
```
