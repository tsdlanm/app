import { Hono } from 'hono'
import type { Pool } from './db/client.js'
import { healthRoutes } from './routes/health.js'

export interface Deps {
  pool?: Pick<Pool, 'query'>
}

/** Builds the HTTP app. It owns no sockets, so tests call `app.request(...)` directly. */
export function createApp(deps: Deps = {}) {
  const app = new Hono()

  app.route('/api', healthRoutes(deps.pool))

  app.notFound((c) => c.json({ error: 'not_found' }, 404))
  app.onError((err, c) => {
    console.error(err)
    return c.json({ error: 'internal_error' }, 500)
  })

  return app
}
