import { beforeEach, describe, expect, it } from 'vitest'
import { useEditor, type IotNode } from './store'

const node = (id: string, kind: string, x = 0, y = 0, selected = false): IotNode => ({
  id,
  type: 'iot',
  position: { x, y },
  data: { kind, props: {} },
  selected,
})

const wire = (id: string, source: string, sourceHandle: string, target: string, targetHandle: string) => ({
  id,
  source,
  sourceHandle,
  target,
  targetHandle,
})

beforeEach(() => {
  useEditor.setState({
    nodes: [node('t', 'temp-sensor'), node('c', 'compare'), node('f', 'fan'), node('l', 'led')],
    edges: [wire('e1', 't', 'out', 'c', 'a'), wire('e2', 'c', 'out', 'f', 'in'), wire('e3', 'c', 'out', 'l', 'in')],
    past: [],
    future: [],
  })
})

const select = (...ids: string[]) =>
  useEditor.setState((s) => ({ nodes: s.nodes.map((n) => ({ ...n, selected: ids.includes(n.id) })) }))

describe('removeSelected', () => {
  it('deletes the selected components and every wire attached to them', () => {
    select('c')
    useEditor.getState().removeSelected()
    const { nodes, edges } = useEditor.getState()
    expect(nodes.map((n) => n.id)).toEqual(['t', 'f', 'l'])
    expect(edges).toHaveLength(0)
  })

  it('removes several components in one go and undoes them with a single Ctrl+Z', () => {
    select('t', 'f')
    useEditor.getState().removeSelected()
    expect(useEditor.getState().nodes.map((n) => n.id)).toEqual(['c', 'l'])
    expect(useEditor.getState().edges.map((e) => e.id)).toEqual(['e3'])
    useEditor.getState().undo()
    expect(useEditor.getState().nodes).toHaveLength(4)
    expect(useEditor.getState().edges).toHaveLength(3)
  })

  it('removes a selected wire without touching components', () => {
    useEditor.setState((s) => ({ edges: s.edges.map((e) => ({ ...e, selected: e.id === 'e2' })) }))
    useEditor.getState().removeSelected()
    expect(useEditor.getState().nodes).toHaveLength(4)
    expect(useEditor.getState().edges.map((e) => e.id)).toEqual(['e1', 'e3'])
  })

  it('does nothing, and records no history, when nothing is selected', () => {
    useEditor.getState().removeSelected()
    expect(useEditor.getState().nodes).toHaveLength(4)
    expect(useEditor.getState().past).toHaveLength(0)
  })
})

describe('selectAll', () => {
  it('selects every component', () => {
    useEditor.getState().selectAll()
    expect(useEditor.getState().nodes.every((n) => n.selected)).toBe(true)
  })
})

describe('duplicateSelected', () => {
  it('copies components with new ids, offset, and selects the copies', () => {
    select('t', 'c')
    useEditor.getState().duplicateSelected()
    const { nodes } = useEditor.getState()
    expect(nodes).toHaveLength(6)
    const copies = nodes.filter((n) => n.selected)
    expect(copies).toHaveLength(2)
    expect(copies.map((n) => n.id).every((id) => !['t', 'c', 'f', 'l'].includes(id))).toBe(true)
    expect(copies[0].position).toEqual({ x: 40, y: 40 })
    expect(nodes.filter((n) => !n.selected)).toHaveLength(4)
  })

  it('copies wires between the selected components only', () => {
    select('t', 'c')
    useEditor.getState().duplicateSelected()
    const { nodes, edges } = useEditor.getState()
    expect(edges).toHaveLength(4)
    const copyIds = new Set(nodes.filter((n) => n.selected).map((n) => n.id))
    const added = edges.filter((e) => !['e1', 'e2', 'e3'].includes(e.id))
    expect(added).toHaveLength(1)
    expect(copyIds.has(added[0].source) && copyIds.has(added[0].target)).toBe(true)
    expect([added[0].sourceHandle, added[0].targetHandle]).toEqual(['out', 'a'])
  })

  it('gives the copy its own props so editing one does not change the other', () => {
    select('t')
    useEditor.getState().duplicateSelected()
    const copy = useEditor.getState().nodes.find((n) => n.selected)!
    useEditor.getState().updateProp(copy.id, 'min', 5)
    expect(useEditor.getState().nodes.find((n) => n.id === 't')!.data.props).not.toHaveProperty('min')
  })

  it('is one undo step', () => {
    select('t', 'c')
    useEditor.getState().duplicateSelected()
    useEditor.getState().undo()
    expect(useEditor.getState().nodes).toHaveLength(4)
    expect(useEditor.getState().edges).toHaveLength(3)
  })
})
