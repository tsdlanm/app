import { Handle, Position, type NodeProps } from '@xyflow/react'
import { memo, type CSSProperties } from 'react'
import BoardArt from '../components/boards/BoardArt'
import { getDef } from '../components/registry'
import type { BoardPin, ComponentDef, PortDef } from '../components/types'
import { useSim } from '../sim/runner'
import { useEditor, type IotNode } from './store'

const portTop = (i: number, n: number) => `${((i + 1) / (n + 1)) * 100}%`

function fmt(v: unknown, unit = ''): string {
  if (typeof v === 'number') return `${v.toFixed(1)}${unit ? ` ${unit}` : ''}`
  if (typeof v === 'boolean') return v ? 'ON' : 'OFF'
  return '—'
}

function Ports({ ports, side }: { ports: PortDef[]; side: 'in' | 'out' }) {
  return (
    <>
      {ports.map((p, i) => (
        <span key={p.id}>
          <Handle
            id={p.id}
            type={side === 'in' ? 'target' : 'source'}
            position={side === 'in' ? Position.Left : Position.Right}
            className={`port port-${p.type}`}
            style={{ top: portTop(i, ports.length) }}
            title={`${p.label} (${p.type === 'number' ? 'angka' : 'ya/tidak'})`}
          />
          {/* Only label ports when a node has several; a single port is obvious and the label would cover the card. */}
          {ports.length > 1 && (
            <span className={`port-label port-label-${side}`} style={{ top: portTop(i, ports.length) }}>
              {p.label}
            </span>
          )}
        </span>
      ))}
    </>
  )
}

function Chart({ data }: { data: number[] }) {
  if (data.length < 2) return <div className="chart chart-empty">Tekan Run</div>
  const lo = Math.min(...data)
  const hi = Math.max(...data)
  const span = hi - lo || 1
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * 156 + 2},${46 - ((v - lo) / span) * 40}`)
    .join(' ')
  return (
    <svg className="chart" viewBox="0 0 160 50" role="img" aria-label="Grafik riwayat nilai">
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <text x="2" y="8" className="chart-label">{hi.toFixed(1)}</text>
      <text x="2" y="48" className="chart-label">{lo.toFixed(1)}</text>
    </svg>
  )
}

function Body({ id, def, props }: { id: string; def: ComponentDef; props: Record<string, number | string | boolean> }) {
  const values = useSim((s) => s.values[id])
  const updateProp = useEditor((s) => s.updateProp)
  const input = values?.inputs.in
  const out = values?.outputs.out
  const on = input === true

  switch (def.view) {
    case 'board':
      return null
    case 'analog':
      return <div className="readout">{fmt(out, def.unit)}</div>
    case 'digital': {
      const detail = def.kind === 'compare' ? `${String(props.op)} ${String(props.threshold)}` : ''
      return (
        <div className="readout">
          <span className={`pill ${out === true ? 'pill-on' : ''}`}>{fmt(out)}</span>
          {detail && <span className="detail">{detail}</span>}
        </div>
      )
    }
    case 'button':
      return (
        <button
          type="button"
          className={`toggle nodrag ${props.pressed === true ? 'toggle-on' : ''}`}
          aria-pressed={props.pressed === true}
          onClick={() => updateProp(id, 'pressed', props.pressed !== true)}
        >
          {props.pressed === true ? 'Ditekan' : 'Lepas'}
        </button>
      )
    case 'led':
      return <div className={`led led-${String(props.color)} ${on ? 'led-on' : ''}`} aria-label={on ? 'LED menyala' : 'LED mati'} />
    case 'fan':
      return <div className={`fan ${on ? 'fan-on' : ''}`} aria-label={on ? 'Kipas berputar' : 'Kipas mati'}>🌀</div>
    case 'buzzer':
      return <div className={`buzzer ${on ? 'buzzer-on' : ''}`} aria-label={on ? 'Buzzer berbunyi' : 'Buzzer diam'}>🔔</div>
    case 'gauge': {
      const min = Number(props.min)
      const max = Number(props.max)
      const v = typeof input === 'number' ? input : undefined
      const pct = v === undefined || max === min ? 0 : Math.min(100, Math.max(0, ((v - min) / (max - min)) * 100))
      return (
        <div>
          <div className="readout">{fmt(v, String(props.unit))}</div>
          <div className="bar"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
        </div>
      )
    }
    case 'chart':
      return <Chart data={values?.history ?? []} />
  }
}


const SIDE: Record<BoardPin['side'], Position> = {
  top: Position.Top,
  bottom: Position.Bottom,
  left: Position.Left,
  right: Position.Right,
}

const ROLE_TEXT: Record<string, string> = {
  'in-num': 'masukan angka',
  'in-bool': 'masukan ya/tidak',
  out: 'keluaran',
}

/** A microcontroller: the real board artwork with a wire handle sitting on each usable pin. */
function BoardCard({ id, def, selected }: { id: string; def: ComponentDef; selected: boolean }) {
  const values = useSim((s) => s.values[id])
  const running = useSim((s) => s.status === 'running')
  const board = def.board!

  return (
    <div className={`board-node ${selected ? 'node-selected' : ''}`} style={{ width: board.width, height: board.height }}>
      <BoardArt kind={def.kind} running={running} outputs={values?.outputs} />
      {board.pins
        .filter((p) => p.role === 'in-num' || p.role === 'in-bool' || p.role === 'out')
        .map((p) => {
          const isOut = p.role === 'out'
          const v = isOut ? values?.outputs[p.id] : values?.inputs[p.id]
          const on = v === true || typeof v === 'number'
          // React Flow positions handles with CSS per side; pin the centre explicitly instead.
          const style: CSSProperties = { left: p.x, top: p.y, right: 'auto', bottom: 'auto', transform: 'translate(-50%, -50%)' }
          return (
            <Handle
              key={p.id}
              id={p.id}
              type={isOut ? 'source' : 'target'}
              position={SIDE[p.side]}
              className={`pin pin-${isOut ? 'out' : 'in'} port-${p.role === 'in-num' ? 'number' : 'boolean'} ${on ? 'pin-on' : ''}`}
              style={style}
              title={`${p.id}: ${ROLE_TEXT[p.role]}${v === undefined ? '' : ` = ${typeof v === 'number' ? v.toFixed(1) : v ? 'ON' : 'OFF'}`}`}
            />
          )
        })}
    </div>
  )
}

function NodeCard({ id, data, selected }: NodeProps<IotNode>) {
  const def = getDef(data.kind)
  if (!def) return <div className="node node-unknown">Komponen tidak dikenal: {data.kind}</div>
  if (def.view === 'board' && def.board) return <BoardCard id={id} def={def} selected={selected} />

  const rows = Math.max(def.inputs.length, def.outputs.length)
  return (
    <div className={`node cat-${def.category} ${selected ? 'node-selected' : ''}`} style={{ minHeight: 56 + rows * 14 }}>
      <Ports ports={def.inputs} side="in" />
      <div className="node-head">
        <span aria-hidden="true">{def.icon}</span> {def.label}
      </div>
      <div className={`node-body ${def.inputs.length > 1 ? 'pad-in' : ''}`}>
        <Body id={id} def={def} props={data.props} />
      </div>
      <Ports ports={def.outputs} side="out" />
    </div>
  )
}

export default memo(NodeCard)
