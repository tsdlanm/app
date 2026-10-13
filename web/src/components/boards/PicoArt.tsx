import { PICO } from '../boards'
import { Defs, FONT, Led, PinLabels, type ArtProps } from './parts'

export default function PicoArt({ running }: ArtProps) {
  return (
    <svg
      viewBox={`0 0 ${PICO.width} ${PICO.height}`}
      width={PICO.width}
      height={PICO.height}
      style={{ overflow: 'visible', display: 'block' }}
      role="img"
      aria-label="Raspberry Pi Pico"
    >
      <Defs />
      <linearGradient id="pico-pcb" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#23a24e" />
        <stop offset="1" stopColor="#13752f" />
      </linearGradient>

      {/* micro-USB at the top edge */}
      <g filter="url(#drop)">
        <rect x={36} y={-8} width={44} height={30} rx={3} fill="url(#metal)" stroke="#7d848e" />
        <rect x={43} y={-8} width={30} height={12} rx={2} fill="#26292e" />
      </g>

      <g filter="url(#drop)">
        <rect x={0} y={0} width={PICO.width} height={PICO.height} rx={6} fill="url(#pico-pcb)" stroke="#0b5a22" strokeWidth={1.2} />
      </g>

      {/* castellated pads along both edges */}
      {PICO.pins.map((p) => (
        <g key={p.id}>
          <rect x={p.side === 'left' ? 0.5 : p.x - 6} y={p.y - 4.2} width={14} height={8.4} rx={2} fill="url(#gold)" stroke="#7a5e16" strokeWidth={0.5} />
          <circle cx={p.x} cy={p.y} r={2.3} fill="#0b2a14" />
        </g>
      ))}

      {/* BOOTSEL button and LED */}
      <rect x={40} y={30} width={26} height={16} rx={2} fill="#1b1d21" stroke="#000" />
      <rect x={45} y={33} width={16} height={10} rx={1.5} fill="#f1f2f4" />
      <text x={53} y={55} fontSize={4.4} fontFamily={FONT} textAnchor="middle" fill="#fff" opacity={0.9}>
        BOOTSEL
      </text>
      <Led x={48.5} y={62} on={Boolean(running)} color="#7dff9b" label="LED" />

      {/* RP2040 (QFN-56) */}
      <g filter="url(#drop)">
        {Array.from({ length: 14 }, (_, i) => (
          <g key={i} fill="#b9bec6">
            <rect x={42 + i * 2.5} y={125} width={1.4} height={3} />
            <rect x={42 + i * 2.5} y={168} width={1.4} height={3} />
            <rect x={38.5} y={130 + i * 2.8} width={3} height={1.4} />
            <rect x={76.5} y={130 + i * 2.8} width={3} height={1.4} />
          </g>
        ))}
        <rect x={40} y={127} width={38} height={42} rx={2} fill="url(#chip)" stroke="#000" strokeWidth={0.6} />
        <circle cx={46} cy={133} r={1.6} fill="#777" />
        <text x={59} y={150} fontSize={6.4} fontFamily={FONT} fontWeight={700} textAnchor="middle" fill="#a8adb4">
          RP2040
        </text>
        <text x={59} y={159} fontSize={4.2} fontFamily={FONT} textAnchor="middle" fill="#6f747b">
          Raspberry Pi
        </text>
      </g>

      {/* flash memory and crystal */}
      <rect x={36} y={186} width={24} height={16} fill="url(#chip)" stroke="#000" strokeWidth={0.5} />
      <text x={48} y={196.5} fontSize={4.6} fontFamily={FONT} textAnchor="middle" fill="#8a8f96">
        W25Q16
      </text>
      <rect x={65} y={188} width={14} height={9} rx={1.5} fill="url(#metal)" stroke="#6a7078" />
      {[42, 54, 66].map((x) => (
        <rect key={x} x={x} y={212} width={7} height={4} fill="#1b1d21" />
      ))}

      {/* SWD debug pads */}
      {[44, 58.5, 73].map((x) => (
        <g key={x}>
          <circle cx={x} cy={286} r={3.4} fill="url(#gold)" />
          <circle cx={x} cy={286} r={1.3} fill="#0b2a14" />
        </g>
      ))}
      {[
        { x: 44, label: 'SWCLK' },
        { x: 58.5, label: 'GND' },
        { x: 73, label: 'SWDIO' },
      ].map((t) => (
        <text key={t.label} x={t.x} y={278} fontSize={3.8} fontFamily={FONT} textAnchor="middle" fill="#fff" opacity={0.9}>
          {t.label}
        </text>
      ))}

      <PinLabels board={PICO} />

      {/* logo and name */}
      <g fontFamily={FONT} fill="#fff" textAnchor="middle">
        <circle cx={52} cy={88} r={3.6} fill="#e5304f" />
        <circle cx={60} cy={88} r={3.6} fill="#e5304f" />
        <circle cx={56} cy={94} r={3.6} fill="#e5304f" />
        <path d="M52 83 q4 -6 8 0 q-4 2 -8 0z" fill="#3bbf5a" />
        <text x={58.5} y={110} fontSize={11} fontWeight={700}>
          Pico
        </text>
      </g>
    </svg>
  )
}
