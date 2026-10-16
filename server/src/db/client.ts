import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import * as schema from './schema.js'

export type Pool = pg.Pool

export function createPool(connectionString: string): Pool {
  return new pg.Pool({ connectionString, max: 10 })
}

/** Typed query builder over a pool. Tables are added to ./schema.ts as features arrive. */
export function createDb(pool: Pool) {
  return drizzle(pool, { schema })
}

export type Db = ReturnType<typeof createDb>
