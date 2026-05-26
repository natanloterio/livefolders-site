import { toolExists } from '../lib/store'
import fs from 'fs'
import path from 'path'

describe('store', () => {
  it('returns false when tool does not exist', () => {
    expect(toolExists('nobody', 'nonexistent')).toBe(false)
  })

  it('returns true when tool exists in tools.json', () => {
    const dataPath = path.join(process.cwd(), 'data', 'tools.json')
    const original = fs.readFileSync(dataPath, 'utf-8')
    const tool = {
      owner: 'testuser',
      name: 'testtool',
      description: null,
      repo_url: 'https://github.com/testuser/testtool',
      subdir: null,
      tags: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    fs.writeFileSync(dataPath, JSON.stringify([tool]))
    try {
      expect(toolExists('testuser', 'testtool')).toBe(true)
      expect(toolExists('testuser', 'other')).toBe(false)
    } finally {
      fs.writeFileSync(dataPath, original)
    }
  })
})
