import { describe, expect, it, vi } from 'vitest'
import { createApp } from '../src/app.js'

describe('health', () => {
  it('reports the process is alive', async () => {
    const res = await createApp().request('/api/health')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: 'ok' })
  })

  it('answers unknown routes with JSON 404, not an HTML page', async () => {
    const res = await createApp().request('/api/nope')
    expect(res.status).toBe(404)
    expect(res.headers.get('content-type')).toMatch(/application\/json/)
    expect(await res.json()).toEqual({ error: 'not_found' })
  })
})

describe('readiness', () => {
  it('is unavailable when no database is configured', async () => {
    const res = await createApp().request('/api/ready')
    expect(res.status).toBe(503)
    expect(await res.json()).toMatchObject({ status: 'unavailable' })
  })

  it('is ok when the database answers', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] })
    const res = await createApp({ pool: { query } }).request('/api/ready')
    expect(res.status).toBe(200)
    expect(query).toHaveBeenCalledWith('select 1')
  })

  it('is unavailable, without leaking the error, when the database fails', async () => {
    const query = vi.fn().mockRejectedValue(new Error('password authentication failed for user "secret"'))
    const res = await createApp({ pool: { query } }).request('/api/ready')
    expect(res.status).toBe(503)
    const body = JSON.stringify(await res.json())
    expect(body).toContain('database unreachable')
    expect(body).not.toContain('secret')
  })
})

describe('errors', () => {
  it('turns a crashing route into a JSON 500 without exposing details', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const app = createApp({
      pool: {
        query: () => {
          throw new Error('boom: internal detail')
        },
      },
    })
    // The readiness route catches its own errors, so force one through a route that does not.
    app.get('/api/crash', () => {
      throw new Error('boom: internal detail')
    })
    const res = await app.request('/api/crash')
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'internal_error' })
    expect(log).toHaveBeenCalled()
    log.mockRestore()
  })
})
