import { describe, expect, it } from 'vitest'
import { defaultProps, getDef } from '../components/registry'
import { createEngineState, stepEngine, topoOrder, wouldCreateCycle, type Graph, type GraphNode } from './engine'

const node = (id: string, kind: string, props: Record<string, number | string | boolean> = {}): GraphNode => ({
  id,
  kind,
  props: { ...defaultProps(getDef(kind)!), ...props },
})

const edge = (source: string, sourceHandle: string, target: string, targetHandle: string) => ({
  id: `${source}-${target}`,
  source,
  sourceHandle,
  target,
  targetHandle,
})

describe('engine', () => {
  it('propagates a sensor through a comparator to an actuator', () => {
    const graph: Graph = {
      nodes: [
        node('t', 'temp-sensor', { pattern: 'constant', min: 40, max: 40 }),
        node('c', 'compare', { op: '>', threshold: 30 }),
        node('f', 'fan'),
      ],
      edges: [edge('t', 'out', 'c', 'a'), edge('c', 'out', 'f', 'in')],
    }
    const state = createEngineState()
    stepEngine(graph, state, 100)
    expect(state.values.t.outputs.out).toBe(40)
    expect(state.values.c.outputs.out).toBe(true)
    expect(state.values.f.inputs.in).toBe(true)
  })

  it('switches the comparator off when the value is below the threshold', () => {
    const graph: Graph = {
      nodes: [node('t', 'temp-sensor', { pattern: 'constant', min: 10, max: 10 }), node('c', 'compare', { threshold: 30 })],
      edges: [edge('t', 'out', 'c', 'a')],
    }
    const state = createEngineState()
    stepEngine(graph, state, 100)
    expect(state.values.c.outputs.out).toBe(false)
  })

  it('treats unconnected inputs as off', () => {
    const graph: Graph = { nodes: [node('a', 'and'), node('n', 'not')], edges: [] }
    const state = createEngineState()
    stepEngine(graph, state, 100)
    expect(state.values.a.outputs.out).toBe(false)
    expect(state.values.n.outputs.out).toBe(true)
  })

  it('makes the timer wait before turning on and resets when the input drops', () => {
    const graph: Graph = {
      nodes: [node('b', 'button', { pressed: true }), node('t', 'timer', { delay: 1 })],
      edges: [edge('b', 'out', 't', 'in')],
    }
    const state = createEngineState()
    for (let i = 0; i < 9; i++) stepEngine(graph, state, 100)
    expect(state.values.t.outputs.out).toBe(false)
    stepEngine(graph, state, 100)
    expect(state.values.t.outputs.out).toBe(true)

    graph.nodes[0].props.pressed = false
    stepEngine(graph, state, 100)
    expect(state.values.t.outputs.out).toBe(false)
  })

  it('records chart history and caps its length', () => {
    const graph: Graph = {
      nodes: [node('t', 'temp-sensor', { pattern: 'constant', min: 5, max: 5 }), node('c', 'chart')],
      edges: [edge('t', 'out', 'c', 'in')],
    }
    const state = createEngineState()
    for (let i = 0; i < 300; i++) stepEngine(graph, state, 100)
    expect(state.values.c.history).toHaveLength(120)
    expect(state.values.c.history?.every((v) => v === 5)).toBe(true)
  })

  it('ignores a value whose type does not match the port', () => {
    const graph: Graph = {
      nodes: [node('t', 'temp-sensor', { pattern: 'constant', min: 40, max: 40 }), node('f', 'fan')],
      edges: [edge('t', 'out', 'f', 'in')],
    }
    const state = createEngineState()
    stepEngine(graph, state, 100)
    expect(state.values.f.inputs.in).toBeUndefined()
  })

  it('varies a sine sensor over time within its range', () => {
    const graph: Graph = { nodes: [node('t', 'temp-sensor', { pattern: 'sine', min: 20, max: 40, period: 10 })], edges: [] }
    const state = createEngineState()
    const seen: number[] = []
    for (let i = 0; i < 100; i++) {
      stepEngine(graph, state, 100)
      seen.push(state.values.t.outputs.out as number)
    }
    expect(Math.min(...seen)).toBeGreaterThanOrEqual(20)
    expect(Math.max(...seen)).toBeLessThanOrEqual(40)
    expect(Math.max(...seen) - Math.min(...seen)).toBeGreaterThan(15)
  })
})

describe('graph helpers', () => {
  it('orders nodes so sources come first', () => {
    const order = topoOrder([{ id: 'c' }, { id: 'b' }, { id: 'a' }], [
      { source: 'a', target: 'b' },
      { source: 'b', target: 'c' },
    ])
    expect(order).toEqual(['a', 'b', 'c'])
  })

  it('detects loops', () => {
    const edges = [
      { source: 'a', target: 'b' },
      { source: 'b', target: 'c' },
    ]
    expect(wouldCreateCycle(edges, 'c', 'a')).toBe(true)
    expect(wouldCreateCycle(edges, 'a', 'c')).toBe(false)
    expect(wouldCreateCycle(edges, 'a', 'a')).toBe(true)
  })
})
