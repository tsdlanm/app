import type { Edge } from '@xyflow/react'
import { getDef } from '../components/registry'
import type { Props } from '../components/types'
import type { IotNode } from './store'

export const PROJECT_VERSION = 1

/** Longest string property accepted from a file; guards against huge or hostile projects. */
const MAX_PROP_LENGTH = 5000

export interface Project {
  version: number
  name: string
  nodes: { id: string; kind: string; x: number; y: number; props: Props }[]
  edges: { id: string; source: string; sourceHandle: string; target: string; targetHandle: string }[]
}

export function toProject(name: string, nodes: IotNode[], edges: Edge[]): Project {
  return {
    version: PROJECT_VERSION,
    name,
    nodes: nodes.map((n) => ({ id: n.id, kind: n.data.kind, x: n.position.x, y: n.position.y, props: n.data.props })),
    edges: edges.map((e) => ({
      id: e.id,
      source: e.source,
      sourceHandle: e.sourceHandle ?? '',
      target: e.target,
      targetHandle: e.targetHandle ?? '',
    })),
  }
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Validates untrusted input (file or localStorage). Returns null if it is not a usable project. */
export function parseProject(raw: unknown): Project | null {
  if (!isRecord(raw) || raw.version !== PROJECT_VERSION) return null
  if (typeof raw.name !== 'string' || !Array.isArray(raw.nodes) || !Array.isArray(raw.edges)) return null

  const nodes: Project['nodes'] = []
  const ids = new Set<string>()
  for (const n of raw.nodes) {
    if (!isRecord(n) || typeof n.id !== 'string' || typeof n.kind !== 'string') return null
    if (typeof n.x !== 'number' || typeof n.y !== 'number' || !Number.isFinite(n.x) || !Number.isFinite(n.y)) return null
    const def = getDef(n.kind)
    if (!def || ids.has(n.id)) return null
    ids.add(n.id)

    // Keep only known props with the right type; anything else falls back to the default.
    const given = isRecord(n.props) ? n.props : {}
    const props: Props = {}
    for (const p of def.props) {
      const v = given[p.key]
      const ok =
        typeof v === typeof p.default &&
        (typeof v !== 'number' || Number.isFinite(v)) &&
        (typeof v !== 'string' || v.length <= MAX_PROP_LENGTH)
      props[p.key] = ok ? (v as Props[string]) : p.default
    }
    nodes.push({ id: n.id, kind: n.kind, x: n.x, y: n.y, props })
  }

  const edges: Project['edges'] = []
  const usedInputs = new Set<string>()
  for (const e of raw.edges) {
    if (!isRecord(e)) return null
    const { id, source, sourceHandle, target, targetHandle } = e
    if (![id, source, sourceHandle, target, targetHandle].every((v) => typeof v === 'string')) return null
    if (!ids.has(source as string) || !ids.has(target as string)) return null
    const key = `${target}:${targetHandle}`
    if (usedInputs.has(key)) return null
    usedInputs.add(key)
    edges.push({
      id: id as string,
      source: source as string,
      sourceHandle: sourceHandle as string,
      target: target as string,
      targetHandle: targetHandle as string,
    })
  }

  return { version: PROJECT_VERSION, name: raw.name.slice(0, 80), nodes, edges }
}
