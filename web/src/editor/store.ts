import {
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from '@xyflow/react'
import { create } from 'zustand'
import { defaultProps, getDef } from '../components/registry'
import type { PropValue, Props } from '../components/types'
import { wouldCreateCycle } from '../sim/engine'
import { exampleProject } from './example'
import { loadStored } from './storage'
import { parseProject, type Project } from './serialize'

export type IotNodeData = { kind: string; props: Props }
export type IotNode = Node<IotNodeData, 'iot'>

interface Snapshot {
  nodes: IotNode[]
  edges: Edge[]
}

const HISTORY_LIMIT = 100

export const newId = () => Math.random().toString(36).slice(2, 10)

function fromProject(p: Project): Snapshot & { name: string } {
  return {
    name: p.name,
    nodes: p.nodes.map((n) => ({
      id: n.id,
      type: 'iot',
      position: { x: n.x, y: n.y },
      data: { kind: n.kind, props: n.props },
    })),
    edges: p.edges.map((e) => ({ ...e })),
  }
}

interface EditorState extends Snapshot {
  name: string
  past: Snapshot[]
  future: Snapshot[]
  setName: (name: string) => void
  onNodesChange: (changes: NodeChange<IotNode>[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (c: Connection) => void
  isValidConnection: (c: Connection | Edge) => boolean
  beginDrag: () => void
  addNode: (kind: string, position: { x: number; y: number }) => void
  updateProp: (id: string, key: string, value: PropValue) => void
  removeNode: (id: string) => void
  undo: () => void
  redo: () => void
  load: (p: Project) => void
  clear: () => void
}

let lastPropEdit: { id: string; key: string; at: number } | null = null

// React Flow reports one deletion through both onNodesChange and onEdgesChange in the same
// task. Only the first call may record history, otherwise one delete would need two undos.
let historyLocked = false

const initial = fromProject(loadStored() ?? parseProject(exampleProject()) ?? exampleProject())

export const useEditor = create<EditorState>((set, get) => {
  const snapshot = (): Snapshot => ({ nodes: get().nodes, edges: get().edges })

  const pushHistory = () => {
    lastPropEdit = null
    if (historyLocked) return
    historyLocked = true
    queueMicrotask(() => {
      historyLocked = false
    })
    set((s) => ({ past: [...s.past, snapshot()].slice(-HISTORY_LIMIT), future: [] }))
  }

  return {
    ...initial,
    past: [],
    future: [],

    setName: (name) => set({ name }),

    onNodesChange: (changes) => {
      const removed = new Set(changes.filter((c) => c.type === 'remove').map((c) => c.id))
      if (removed.size > 0) pushHistory()
      set((s) => ({
        nodes: applyNodeChanges(changes, s.nodes),
        edges: removed.size > 0 ? s.edges.filter((e) => !removed.has(e.source) && !removed.has(e.target)) : s.edges,
      }))
    },

    onEdgesChange: (changes) => {
      const existing = new Set(get().edges.map((e) => e.id))
      if (changes.some((c) => c.type === 'remove' && existing.has(c.id))) pushHistory()
      set((s) => ({ edges: applyEdgeChanges(changes, s.edges) }))
    },

    isValidConnection: (c) => {
      const { nodes, edges } = get()
      if (!c.source || !c.target || !c.sourceHandle || !c.targetHandle) return false
      const src = nodes.find((n) => n.id === c.source)
      const dst = nodes.find((n) => n.id === c.target)
      const srcDef = src && getDef(src.data.kind)
      const dstDef = dst && getDef(dst.data.kind)
      const out = srcDef?.outputs.find((p) => p.id === c.sourceHandle)
      const inp = dstDef?.inputs.find((p) => p.id === c.targetHandle)
      if (!out || !inp || out.type !== inp.type) return false
      if (edges.some((e) => e.target === c.target && e.targetHandle === c.targetHandle)) return false
      return !wouldCreateCycle(edges, c.source, c.target)
    },

    onConnect: (c) => {
      if (!get().isValidConnection(c)) return
      pushHistory()
      const edge: Edge = {
        id: `e-${newId()}`,
        source: c.source,
        sourceHandle: c.sourceHandle,
        target: c.target,
        targetHandle: c.targetHandle,
      }
      set((s) => ({ edges: [...s.edges, edge] }))
    },

    beginDrag: () => pushHistory(),

    addNode: (kind, position) => {
      const def = getDef(kind)
      if (!def) return
      pushHistory()
      const node: IotNode = {
        id: newId(),
        type: 'iot',
        position,
        data: { kind, props: defaultProps(def) },
        selected: true,
      }
      set((s) => ({ nodes: [...s.nodes.map((n) => (n.selected ? { ...n, selected: false } : n)), node] }))
    },

    updateProp: (id, key, value) => {
      const last = lastPropEdit
      // Typing in a field is one undo step, not one per keystroke.
      if (!(last && last.id === id && last.key === key && Date.now() - last.at < 1000)) pushHistory()
      lastPropEdit = { id, key, at: Date.now() }
      set((s) => ({
        nodes: s.nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, props: { ...n.data.props, [key]: value } } } : n)),
      }))
    },

    removeNode: (id) => {
      pushHistory()
      set((s) => ({
        nodes: s.nodes.filter((n) => n.id !== id),
        edges: s.edges.filter((e) => e.source !== id && e.target !== id),
      }))
    },

    undo: () => {
      const { past, future } = get()
      const prev = past[past.length - 1]
      if (!prev) return
      lastPropEdit = null
      set({ ...prev, past: past.slice(0, -1), future: [snapshot(), ...future] })
    },

    redo: () => {
      const { past, future } = get()
      const next = future[0]
      if (!next) return
      lastPropEdit = null
      set({ ...next, past: [...past, snapshot()], future: future.slice(1) })
    },

    load: (p) => {
      lastPropEdit = null
      set({ ...fromProject(p), past: [], future: [] })
    },

    clear: () => {
      pushHistory()
      set({ nodes: [], edges: [] })
    },
  }
})
