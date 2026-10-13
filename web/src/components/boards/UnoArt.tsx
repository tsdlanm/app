import { UNO } from '../boards'
import { Defs, FONT, Hole, Led, PinHeaders, PinLabels, type ArtProps } from './parts'

export default function UnoArt({ running, outputs }: ArtProps) {
  const lit13 = outputs?.D13 === true
  return (
    <svg
      viewBox={`0 0 ${UNO.width} ${UNO.height}`}
      width={UNO.width}
      height={UNO.height}
      style={{ overflow: 'visible', display: 'block' }}
      role="img"
      aria-label="Arduino Uno R3"
    >
      <Defs />
      <linearGradient id="uno-pcb" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#0aa5ae" />
        <stop offset="1" stopColor="#007780" />
      </linearGradient>

      {/* USB-B and DC jack hang slightly off the left edge, like the real board */}
      <g filter="url(#drop)">
        <rect x={-8} y={56} width={68} height={74} rx={3} fill="url(#metal)" stroke="#7d848e" />
        <rect x={0} y={64} width={54} height={58} rx={2} fill="#26292e" />
        <rect x={8} y={82} width={40} height={22} fill="#d2d5da" />
        <rect x={-8} y={194} width={68} height={76} rx={3} fill="#1c1e22" stroke="#0a0b0d" />
        <rect x={-8} y={214} width={16} height={36} rx={2} fill="#08090a" />
        <circle cx={6} cy={232} r={4} fill="#6b7078" />
      </g>

      <g filter="url(#drop)">
        <rect x={0} y={0} width={UNO.width} height={UNO.height} rx={10} fill="url(#uno-pcb)" stroke="#00585f" strokeWidth={1.2} />
      </g>

      {/* faint copper traces */}
      <g stroke="#2fc3cb" strokeWidth={1.2} opacity={0.35} fill="none">
        <path d="M110 120 H160 M110 170 H160 M200 118 V60 M250 118 V60 M300 118 V60" />
        <path d="M200 170 V250 M250 170 V250 M300 170 V250 M118 60 H318" />
      </g>

      <Hole x={70} y={18} />
      <Hole x={84} y={270} />
      <Hole x={364} y={42} />
      <Hole x={364} y={196} />

      {/* ATmega16U2 (USB), regulator, capacitors */}
      <rect x={84} y={146} width={26} height={26} fill="url(#chip)" stroke="#000" strokeWidth={0.6} />
      <circle cx={89} cy={151} r={1.4} fill="#777" />
      <rect x={82} y={96} width={20} height={28} rx={1.5} fill="#17181b" />
      <rect x={86} y={90} width={12} height={8} fill="#b0b5bc" />
      <circle cx={90} cy={208} r={10} fill="url(#metal)" stroke="#6a7078" />
      <circle cx={90} cy={246} r={10} fill="url(#metal)" stroke="#6a7078" />
      <path d="M85 208 h10 M90 203 v10" stroke="#555" strokeWidth={0.8} />

      {/* reset button */}
      <rect x={112} y={44} width={24} height={24} rx={3} fill="#25272b" />
      <circle cx={124} cy={56} r={7.5} fill="#d8352a" stroke="#8d1d15" />
      <text x={124} y={79} fontSize={5.4} fontFamily={FONT} textAnchor="middle" fill="#fff" opacity={0.9}>
        RESET
      </text>

      {/* TX / RX / L LEDs */}
      <Led x={162} y={48} on={lit13} color="#ffa21f" label="L" />
      <Led x={180} y={48} on={false} color="#ffa21f" label="TX" />
      <Led x={198} y={48} on={false} color="#ffa21f" label="RX" />

      {/* ATmega328P */}
      <g filter="url(#drop)">
        {Array.from({ length: 14 }, (_, i) => (
          <g key={i}>
            <rect x={166 + i * 11.4} y={117} width={4.5} height={6} fill="#b9bec6" />
            <rect x={166 + i * 11.4} y={165} width={4.5} height={6} fill="#b9bec6" />
          </g>
        ))}
        <rect x={160} y={122} width={170} height={44} rx={2.5} fill="url(#chip)" stroke="#000" strokeWidth={0.8} />
        <path d="M160 137 a7 7 0 0 1 0 14" fill="#0d0e10" />
        <circle cx={172} cy={158} r={2} fill="#6b6f76" />
        <text x={248} y={141} fontSize={6.4} fontFamily={FONT} textAnchor="middle" fill="#9aa0a8" letterSpacing={0.6}>
          ATMEGA328P-PU
        </text>
        <text x={248} y={151} fontSize={5} fontFamily={FONT} textAnchor="middle" fill="#6f747b">
          1927 · MALAYSIA
        </text>
      </g>

      {/* crystal */}
      <rect x={196} y={190} width={40} height={14} rx={7} fill="url(#metal)" stroke="#6a7078" />
      <text x={216} y={200} fontSize={5} fontFamily={FONT} textAnchor="middle" fill="#333">
        16.000
      </text>

      {/* ICSP header */}
      <rect x={337} y={113} width={29} height={44} rx={2} fill="#16171a" />
      {[0, 1, 2].flatMap((r) =>
        [0, 1].map((c) => (
          <rect key={`${r}${c}`} x={341 + c * 14.5} y={120 + r * 14} width={5.2} height={5.2} fill="url(#gold)" />
        )),
      )}

      <PinHeaders board={UNO} />
      <PinLabels board={UNO} />

      {/* silkscreen */}
      <g fontFamily={FONT} fill="#fff">
        <text x={234} y={40} fontSize={5.4} textAnchor="middle" opacity={0.85}>
          DIGITAL (PWM = ~)
        </text>
        <text x={160} y={252} fontSize={5.4} textAnchor="middle" opacity={0.85}>
          POWER
        </text>
        <text x={267} y={252} fontSize={5.4} textAnchor="middle" opacity={0.85}>
          ANALOG IN
        </text>
        <text x={226} y={224} fontSize={16} fontWeight={700} letterSpacing={1.4}>
          ARDUINO
        </text>
        <text x={226} y={238} fontSize={9} letterSpacing={3}>
          UNO
        </text>
        <text x={316} y={236} fontSize={26} fontWeight={700}>
          ∞
        </text>
      </g>
      <Led x={350} y={256} on={Boolean(running)} color="#2bdc6a" label="ON" />
    </svg>
  )
}
