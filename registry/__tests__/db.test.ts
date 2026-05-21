import { getDb } from '../lib/db'

describe('db', () => {
  it('throws when DATABASE_URL is missing', () => {
    const orig = process.env.DATABASE_URL
    delete process.env.DATABASE_URL
    expect(() => getDb()).toThrow('DATABASE_URL not set')
    process.env.DATABASE_URL = orig
  })
})
