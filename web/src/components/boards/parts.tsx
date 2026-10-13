import { PITCH } from '../boards'
import type { BoardLayout, BoardPin, Value } from '../types'

export interface ArtProps {
  /** True while the simulation runs: lights the power LED. */
  running?: boolean
  /** Latest output pin values, used to light the on-board LEDs. */
  outputs?: Record<string, Value | undefined>
}

export const FONT = "'Helvetica Neue', Arial, sans-serif"

/** Splits a side's pins into runs that are one header each (a bigger gap starts a new header). */
function headers(pins: BoardPin[]): BoardPin[][] {
  const out: BoardPin[][] = []
  for (const side of ['top', 'bottom', 'left', 'right'] as const) {
    const onSide = pins.filter((p) => p.side === side)
    const horizontal = side === 'top' || side === 'bottom'
    onSide.sort((a, b) => (horizontal ? a.x - b.x : a.y - b.y))
    let run: BoardPin[] = []
    for (const p of onSide) {
      const prev = run[run.length - 1]
      const gap = prev ? (horizontal ? p.x - prev.x : p.y - prev.y) : 0
      if (prev && gap > PITCH + 1) {
        out.push(run)
        run = []
      }
      run.push(p)
    }
    if (run.length) out.push(run)
  }
  return out
}

/** Black plastic pin headers with gold pins, placed exactly where the layout says. */
export function PinHeaders({ board }: { board: BoardLayout }) {
  return (
    <g>
      {headers(board.pins).map((run) => {
        const a = run[0]
        const b = run[run.length - 1]
        const x = Math.min(a.x, b.x) - 7.5
        const y = Math.min(a.y, b.y) - 7.5
        return (
          <rect
            key={`${a.id}-${b.id}`}
            x={x}
            y={y}
            width={Math.abs(b.x - a.x) + 15}
            height={Math.abs(b.y - a.y) + 15}
            rx={2}
            fill="#16171a"
            stroke="#050506"
            strokeWidth={0.6}
          />
        )
      })}
      {board.pins.map((p) => (
        <rect key={p.id} x={p.x - 2.6} y={p.y - 2.6} width={5.2} height={5.2} rx={0.8} fill="url(#gold)" stroke="#7a5e16" strokeWidth={0.5} />
      ))}
    </g>
  )
}

/** Silkscreen pin names, printed just inside the board next to each pin. */
export function PinLabels({ board, fill = '#ffffff' }: { board: BoardLayout; fill?: string }) {
  return (
    <g fontFamily={FONT} fill={fill} opacity={0.92}>
      {board.pins.map((p) => {
        if (!p.label) return null
        const n = p.label.length
        const size = n >= 5 ? 4.4 : n === 4 ? 5 : n === 3 ? 5.6 : 6.4
        const pos =
          p.side === 'top'
            ? { x: p.x, y: p.y + 14, a: 'middle' }
            : p.side === 'bottom'
              ? { x: p.x, y: p.y - 10, a: 'middle' }
              : p.side === 'left'
                ? { x: p.x + 9.5, y: p.y + 2.2, a: 'start' }
                : { x: p.x - 9.5, y: p.y + 2.2, a: 'end' }
        return (
          <text key={p.id} x={pos.x} y={pos.y} fontSize={size} textAnchor={pos.a as 'start' | 'middle' | 'end'}>
            {p.label}
          </text>
        )
      })}
    </g>
  )
}

export function Defs() {
  return (
    <defs>
      <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#f3d97a" />
        <stop offset="1" stopColor="#b8902a" />
      </linearGradient>
      <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f4f6f8" />
        <stop offset="0.5" stopColor="#c3c8cf" />
        <stop offset="1" stopColor="#9097a1" />
      </linearGradient>
      <linearGradient id="chip" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#2b2d32" />
        <stop offset="1" stopColor="#101113" />
      </linearGradient>
      <filter id="drop" x="-10%" y="-10%" width="120%" height="125%">
        <feDropShadow dx="0" dy="2" stdDeviation="2.2" floodColor="#000" floodOpacity="0.35" />
      </filter>
    </defs>
  )
}

export function Hole({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={6.5} fill="#d9b44a" opacity={0.85} />
      <circle cx={x} cy={y} r={4.2} fill="#0b0c0e" />
    </g>
  )
}

export function Led({ x, y, on, color, label }: { x: number; y: number; on: boolean; color: string; label?: string }) {
  return (
    <g>
      {on && <rect x={x - 3} y={y - 3} width={15} height={11} rx={4} fill={color} opacity={0.35} />}
      <rect x={x} y={y} width={9} height={5} rx={1} fill={on ? color : '#3a3d42'} stroke="#17181b" strokeWidth={0.5} />
      {label && (
        <text x={x + 4.5} y={y + 12} fontSize={4.6} fontFamily={FONT} textAnchor="middle" fill="#fff" opacity={0.9}>
          {label}
        </text>
      )}
    </g>
  )
}
