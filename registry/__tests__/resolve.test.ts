import { GET } from '../app/api/resolve/[owner]/[name]/route'

const makeRequest = (owner: string, name: string, version?: string) => {
  const url = version
    ? `http://localhost/api/resolve/${owner}/${name}?version=${version}`
    : `http://localhost/api/resolve/${owner}/${name}`
  return new Request(url)
}

jest.mock('../lib/db', () => ({
  getDb: () => (strings: TemplateStringsArray, ...values: unknown[]) => {
    if (values.includes('natanloterio') && values.includes('weather')) {
      return Promise.resolve([{ repo_url: 'https://github.com/natanloterio/weather' }])
    }
    return Promise.resolve([])
  },
}))

describe('GET /api/resolve', () => {
  it('returns 404 for unknown tool', async () => {
    const res = await GET(makeRequest('nobody', 'nothing'), {
      params: Promise.resolve({ owner: 'nobody', name: 'nothing' }),
    })
    expect(res.status).toBe(404)
  })

  it('returns tarball_url for versioned install', async () => {
    const res = await GET(makeRequest('natanloterio', 'weather', 'v1.0.0'), {
      params: Promise.resolve({ owner: 'natanloterio', name: 'weather' }),
    })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.tarball_url).toBe('https://github.com/natanloterio/weather/archive/v1.0.0.tar.gz')
    expect(json.version).toBe('v1.0.0')
  })
})
