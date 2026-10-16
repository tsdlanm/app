import { Hono } from 'hono'
import type { Pool } from '../db/client.js'

/** Liveness (is the process up) and readiness (can it reach what it needs). */
export function healthRoutes(pool?: Pick<Pool, 'query'>) {
  const routes = new Hono()

  routes.get('/health', (c) => c.json({ status: 'ok' }))

  routes.get('/ready', async (c) => {
    if (!pool) return c.json({ status: 'unavailable', reason: 'DATABASE_URL is not set' }, 503)
    try {
      await pool.query('select 1')
      return c.json({ status: 'ok' })
    } catch {
      return c.json({ status: 'unavailable', reason: 'database unreachable' }, 503)
    }
  })

  return routes
}
