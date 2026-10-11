import { describe, expect, it } from 'vitest'
import { exampleProject } from './example'
import { parseProject } from './serialize'

describe('parseProject', () => {
  it('accepts the example project unchanged', () => {
    const p = exampleProject()
    expect(parseProject(JSON.parse(JSON.stringify(p)))).toEqual(p)
  })

  it('rejects unknown versions, unknown kinds and non-objects', () => {
    expect(parseProject(null)).toBeNull()
    expect(parseProject('x')).toBeNull()
    expect(parseProject({ ...exampleProject(), version: 99 })).toBeNull()
    const bad = exampleProject()
    bad.nodes[0].kind = 'warp-drive'
    expect(parseProject(bad)).toBeNull()
  })

  it('rejects edges that point at missing nodes or reuse an input', () => {
    const missing = exampleProject()
    missing.edges[0].target = 'ghost'
    expect(parseProject(missing)).toBeNull()

    const dup = exampleProject()
    dup.edges.push({ id: 'dup', source: 'gauge', sourceHandle: 'out', target: 'cmp', targetHandle: 'a' })
    expect(parseProject(dup)).toBeNull()
  })

  it('falls back to defaults for props with the wrong type', () => {
    const p = exampleProject()
    ;(p.nodes[1].props as Record<string, unknown>).threshold = 'hot'
    ;(p.nodes[1].props as Record<string, unknown>).evil = '<script>'
    const parsed = parseProject(p)!
    expect(parsed.nodes[1].props.threshold).toBe(30)
    expect(parsed.nodes[1].props).not.toHaveProperty('evil')
  })
})
