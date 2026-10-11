import { create } from 'zustand'
import { useEditor } from '../editor/store'
import { createEngineState, stepEngine, type Graph, type NodeValues } from './engine'

export const TICK_MS = 100
export const SPEEDS = [1, 2, 5] as const

type Status = 'stopped' | 'running' | 'paused'

interface SimState {
  status: Status
  speed: number
  time: number
  values: Record<string, NodeValues>
  start: () => void
  pause: () => void
  reset: () => void
  setSpeed: (speed: number) => void
}

let engine = createEngineState()
let timer: ReturnType<typeof setInterval> | undefined

function currentGraph(): Graph {
  const { nodes, edges } = useEditor.getState()
  return {
    nodes: nodes.map((n) => ({ id: n.id, kind: n.data.kind, props: n.data.props })),
    edges: edges.map((e) => ({
      id: e.id,
      source: e.source,
      sourceHandle: e.sourceHandle ?? '',
      target: e.target,
      targetHandle: e.targetHandle ?? '',
    })),
  }
}

// The graph is re-read on every tick, so edits made while running take effect immediately.
function tick() {
  const graph = currentGraph()
  // Higher speeds run more fixed-size steps per tick instead of one big step.
  for (let i = 0; i < useSim.getState().speed; i++) stepEngine(graph, engine, TICK_MS)
  useSim.setState({ time: engine.time, values: engine.values })
}

export const useSim = create<SimState>((set, get) => ({
  status: 'stopped',
  speed: 1,
  time: 0,
  values: {},

  start: () => {
    if (get().status === 'running') return
    set({ status: 'running' })
    timer = setInterval(tick, TICK_MS)
  },

  pause: () => {
    if (get().status !== 'running') return
    clearInterval(timer)
    set({ status: 'paused' })
  },

  reset: () => {
    clearInterval(timer)
    engine = createEngineState()
    set({ status: 'stopped', time: 0, values: {} })
  },

  setSpeed: (speed) => set({ speed }),
}))
