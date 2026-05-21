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
