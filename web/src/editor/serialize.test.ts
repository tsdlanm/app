import { describe, expect, it } from 'vitest'
import { EXAMPLES, logicExample } from './example'
import { parseProject } from './serialize'

describe('parseProject', () => {
  it.each(EXAMPLES)('accepts the "$name" example unchanged', ({ build }) => {
    const p = build()
    expect(parseProject(JSON.parse(JSON.stringify(p)))).toEqual(p)
  })

  it('rejects unknown versions, unknown kinds and non-objects', () => {
    expect(parseProject(null)).toBeNull()
    expect(parseProject('x')).toBeNull()
    expect(parseProject({ ...logicExample(), version: 99 })).toBeNull()
    const bad = logicExample()
    bad.nodes[0].kind = 'warp-drive'
    expect(parseProject(bad)).toBeNull()
  })

  it('rejects edges that point at missing nodes or reuse an input', () => {
    const missing = logicExample()
    missing.edges[0].target = 'ghost'
    expect(parseProject(missing)).toBeNull()

    const dup = logicExample()
    dup.edges.push({ id: 'dup', source: 'gauge', sourceHandle: 'out', target: 'cmp', targetHandle: 'a' })
    expect(parseProject(dup)).toBeNull()
  })

  it('falls back to defaults for props with the wrong type', () => {
    const p = logicExample()
    ;(p.nodes[1].props as Record<string, unknown>).threshold = 'hot'
    ;(p.nodes[1].props as Record<string, unknown>).evil = '<script>'
    const parsed = parseProject(p)!
    expect(parsed.nodes[1].props.threshold).toBe(30)
    expect(parsed.nodes[1].props).not.toHaveProperty('evil')
  })

  it('drops oversized string props instead of loading them', () => {
    const p = EXAMPLES[0].build()
    p.nodes[0].props.program = 'D13 = true\n'.repeat(1000)
    const parsed = parseProject(p)!
    expect(String(parsed.nodes[0].props.program).length).toBeLessThan(500)
  })
})
