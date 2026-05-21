import { GET } from '../app/api/tools/[owner]/[name]/route'
import { POST } from '../app/api/tools/[owner]/[name]/downloads/route'

const fakeTool = {
  owner: 'alice',
  name: 'git-helper',
  description: 'Helps with git',
  downloads: 5,
  repo_url: 'https://github.com/alice/git-helper',
  tags: [],
  created_at: '',
  updated_at: '',
}

jest.mock('../lib/db', () => ({
  getDb: () => (strings: TemplateStringsArray, ...values: unknown[]) => {
    if (values.includes('alice') && values.includes('git-helper')) {
      return Promise.resolve([fakeTool])
    }
    return Promise.resolve([])
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
