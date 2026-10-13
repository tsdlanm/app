import { ESP32 } from '../boards'
import { Defs, FONT, Led, PinHeaders, PinLabels, type ArtProps } from './parts'

export default function Esp32Art({ running, outputs }: ArtProps) {
  const blue = outputs?.D2 === true
  return (
    <svg
      viewBox={`0 0 ${ESP32.width} ${ESP32.height}`}
      width={ESP32.width}
      height={ESP32.height}
      style={{ overflow: 'visible', display: 'block' }}
      role="img"
      aria-label="ESP32 DevKit"
    >
      <Defs />
      <linearGradient id="esp-pcb" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#23272d" />
        <stop offset="1" stopColor="#101215" />
      </linearGradient>

      {/* micro-USB sticks out of the bottom edge */}
      <g filter="url(#drop)">
        <rect x={54} y={272} width={48} height={32} rx={3} fill="url(#metal)" stroke="#7d848e" />
        <rect x={62} y={286} width={32} height={10} rx={2} fill="#26292e" />
      </g>

      <g filter="url(#drop)">
        <rect x={0} y={0} width={ESP32.width} height={ESP32.height} rx={7} fill="url(#esp-pcb)" stroke="#000" strokeWidth={1} />
      </g>

      {/* antenna keep-out area with the meander trace */}
      <rect x={38} y={4} width={80} height={34} fill="#0b0c0e" />
      <path
        d="M44 34 V10 H53 V30 H62 V10 H71 V30 H80 V10 H89 V30 H98 V10 H107 V30 H113"
        fill="none"
        stroke="#c9a64b"
        strokeWidth={2.4}
        strokeLinejoin="round"
      />

      {/* ESP-WROOM-32 shielded module */}
      <g filter="url(#drop)">
        <rect x={40} y={40} width={76} height={118} rx={2} fill="url(#metal)" stroke="#808791" />
        <path d="M40 62 H116 M40 140 H116" stroke="#9aa1ab" strokeWidth={0.8} />
        <circle cx={48} cy={50} r={2.2} fill="#2a2d33" />
        <g fontFamily={FONT} textAnchor="middle" fill="#2a2d33">
          <text x={78} y={86} fontSize={8.5} fontWeight={700} letterSpacing={0.8}>
            ESPRESSIF
          </text>
          <text x={78} y={99} fontSize={7.4} fontWeight={700}>
            ESP-WROOM-32
          </text>
          <text x={78} y={110} fontSize={4.6}>
            FCC ID:2AC7Z-ESPWROOM32
          </text>
          <text x={78} y={118} fontSize={4.6}>
            IC:21098-ESPWROOM32
          </text>
        </g>
      </g>

      {/* CP2102 USB-UART bridge and the 3.3 V regulator */}
      <rect x={58} y={172} width={40} height={26} fill="url(#chip)" stroke="#000" strokeWidth={0.6} />
      <circle cx={63} cy={177} r={1.5} fill="#777" />
      <text x={78} y={188} fontSize={5.4} fontFamily={FONT} textAnchor="middle" fill="#9aa0a8">
        CP2102
      </text>
      <rect x={62} y={208} width={32} height={20} rx={1.5} fill="#17181b" />
      <rect x={66} y={202} width={24} height={7} fill="#b0b5bc" />

      <Led x={42} y={240} on={Boolean(running)} color="#ff4136" label="PWR" />
      <Led x={105} y={240} on={blue} color="#3d8bff" label="D2" />

      {/* EN and BOOT buttons */}
      {[
        { x: 28, label: 'EN' },
        { x: 112, label: 'BOOT' },
      ].map((b) => (
        <g key={b.label}>
          <rect x={b.x} y={266} width={18} height={14} rx={2} fill="#1a1c20" stroke="#000" />
          <rect x={b.x + 4} y={269} width={10} height={8} rx={1.5} fill="#d7dade" />
          <text x={b.x + 9} y={289} fontSize={5} fontFamily={FONT} textAnchor="middle" fill="#fff" opacity={0.9}>
            {b.label}
          </text>
        </g>
      ))}

      <PinHeaders board={ESP32} />
      <PinLabels board={ESP32} />

      <text x={78} y={166} fontSize={6} fontFamily={FONT} textAnchor="middle" fill="#fff" opacity={0.85} letterSpacing={0.6}>
        ESP32 DEVKIT V1
      </text>
    </svg>
  )
}
