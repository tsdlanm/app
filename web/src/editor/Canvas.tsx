import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  useReactFlow,
  type Edge,
  type NodeTypes,
} from '@xyflow/react'
import { useMemo, type DragEvent } from 'react'
import { useSim } from '../sim/runner'
import NodeCard from './NodeCard'
import { DRAG_MIME } from './Palette'
import { useEditor } from './store'

const nodeTypes: NodeTypes = { iot: NodeCard }

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
        <MiniMap pannable zoomable />
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
