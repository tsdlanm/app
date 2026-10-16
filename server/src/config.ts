import { z } from 'zod'

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(8080),
  /** Optional so the API can start (and be tested) without a database. */
  DATABASE_URL: z
    .string()
    .url()
    .refine((u) => /^postgres(ql)?:\/\//.test(u), 'must be a postgres:// URL')
    .optional(),
})

export type Config = z.infer<typeof schema>

/** Reads and validates the environment. Throws one readable error listing every problem. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  // An empty value (for example `DATABASE_URL=` in a .env file) means "not set".
  const cleaned = Object.fromEntries(Object.entries(env).filter(([, v]) => v !== undefined && v !== ''))
  const result = schema.safeParse(cleaned)
  if (!result.success) {
    const problems = result.error.issues.map((i) => `${i.path.join('.') || 'env'}: ${i.message}`)
    throw new Error(`Invalid environment: ${problems.join('; ')}`)
  }
  return result.data
}
