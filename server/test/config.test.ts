import { describe, expect, it } from 'vitest'
import { loadConfig } from '../src/config.js'

describe('loadConfig', () => {
  it('has sensible defaults', () => {
    expect(loadConfig({})).toEqual({ NODE_ENV: 'development', PORT: 8080 })
  })

  it('reads the port and database url', () => {
    const c = loadConfig({ PORT: '3000', DATABASE_URL: 'postgres://u:p@localhost:5432/db', NODE_ENV: 'production' })
    expect(c).toMatchObject({ PORT: 3000, NODE_ENV: 'production', DATABASE_URL: 'postgres://u:p@localhost:5432/db' })
  })

  it('treats an empty value as not set', () => {
    expect(loadConfig({ DATABASE_URL: '', PORT: '' })).toEqual({ NODE_ENV: 'development', PORT: 8080 })
  })

  it('rejects a bad port and says which variable is wrong', () => {
    expect(() => loadConfig({ PORT: 'abc' })).toThrow(/PORT/)
    expect(() => loadConfig({ PORT: '70000' })).toThrow(/PORT/)
    expect(() => loadConfig({ PORT: '0' })).toThrow(/PORT/)
  })

  it('rejects a database url that is not postgres', () => {
    expect(() => loadConfig({ DATABASE_URL: 'mysql://localhost/db' })).toThrow(/DATABASE_URL/)
    expect(() => loadConfig({ DATABASE_URL: 'not a url' })).toThrow(/DATABASE_URL/)
  })

  it('lists every problem at once', () => {
    expect(() => loadConfig({ PORT: 'x', NODE_ENV: 'staging' })).toThrow(/PORT.*NODE_ENV|NODE_ENV.*PORT/)
  })
})
