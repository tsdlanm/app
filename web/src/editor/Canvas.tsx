import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  useReactFlow,
  type Edge,
  type FinalConnectionState,
  type NodeTypes,
} from '@xyflow/react'
import { useCallback, useMemo, type DragEvent } from 'react'
import { getDef } from '../components/registry'
import { useSim } from '../sim/runner'
import { toast } from '../ui/toast'
import NodeCard from './NodeCard'
import { DRAG_MIME } from './Palette'
import { connectionProblem, useEditor, type IotNode } from './store'

const nodeTypes: NodeTypes = { iot: NodeCard }

const nodeColor = (n: IotNode) => `var(--cat-${getDef(n.data.kind)?.category ?? 'sensor'})`

export default function Canvas() {
  const nodes = useEditor((s) => s.nodes)
  const edges = useEditor((s) => s.edges)
  const onNodesChange = useEditor((s) => s.onNodesChange)
  const onEdgesChange = useEditor((s) => s.onEdgesChange)
  const onConnect = useEditor((s) => s.onConnect)
  const isValidConnection = useEditor((s) => s.isValidConnection)
  const beginDrag = useEditor((s) => s.beginDrag)
  const addNode = useEditor((s) => s.addNode)
  const values = useSim((s) => s.values)
  const status = useSim((s) => s.status)
  const { screenToFlowPosition } = useReactFlow()

  // While running, colour each wire by the value it carries.
  const styledEdges = useMemo<Edge[]>(() => {
    if (status === 'stopped') return edges
    return edges.map((e) => {
      const v = values[e.source]?.outputs[e.sourceHandle ?? '']
      const live = v === true || (typeof v === 'number' && v !== 0)
      return { ...e, animated: live, className: live ? 'wire-live' : 'wire-idle' }
    })
  }, [edges, values, status])

  // Dropping a wire on an unsuitable pin used to do nothing; say why instead.
  const onConnectEnd = useCallback((_: MouseEvent | TouchEvent, state: FinalConnectionState) => {
    const { fromHandle: from, toHandle: to } = state
    if (state.isValid !== false || !from || !to || !from.id || !to.id) return
    if (from.type === to.type) {
      toast.error('Sambungkan dari titik keluaran ke titik masukan')
      return
    }
    const wire =
      from.type === 'source'
        ? { source: from.nodeId, sourceHandle: from.id, target: to.nodeId, targetHandle: to.id }
        : { source: to.nodeId, sourceHandle: to.id, target: from.nodeId, targetHandle: from.id }
    const problem = connectionProblem(wire)
    if (problem) toast.error(problem)
  }, [])

  const onDragOver = (e: DragEvent) => {
    if (!e.dataTransfer.types.includes(DRAG_MIME)) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const onDrop = (e: DragEvent) => {
    const kind = e.dataTransfer.getData(DRAG_MIME)
    if (!kind) return
    e.preventDefault()
    addNode(kind, screenToFlowPosition({ x: e.clientX, y: e.clientY }))
  }

  return (
    <div className="canvas" onDragOver={onDragOver} onDrop={onDrop}>
      <ReactFlow
        nodes={nodes}
        edges={styledEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        isValidConnection={isValidConnection}
        onNodeDragStart={beginDrag}
        colorMode="system"
        fitView
        fitViewOptions={{ maxZoom: 1, padding: 0.2 }}
        deleteKeyCode={['Backspace', 'Delete']}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} />
        <Controls />
        <MiniMap pannable zoomable nodeColor={nodeColor} nodeStrokeWidth={0} />
        <Panel position="top-left" className="stats">
          {nodes.length} komponen · {edges.length} kabel
        </Panel>
      </ReactFlow>
      {nodes.length === 0 && (
        <div className="empty">
          <p>Kanvas kosong.</p>
          <p>Seret komponen dari kiri, lalu tarik garis dari titik keluaran (kanan) ke titik masukan (kiri).</p>
        </div>
      )}
    </div>
  )
}
