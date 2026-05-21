import { GET } from '../app/api/search/route'

jest.mock('../lib/db', () => ({
  getDb: () => () =>
    Promise.resolve([
      { owner: 'natanloterio', name: 'weather', description: 'Get weather', downloads: 42 },
    ]),
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
