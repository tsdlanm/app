import type { BoardLayout, BoardPin, PinRole } from './types'

/** Distance between two header pins in px (2.54 mm at the scale used for the artwork). */
export const PITCH = 14

type Spec = [id: string, label: string, role: PinRole]

function run(
  specs: Spec[],
  origin: { x: number; y: number },
  axis: 'x' | 'y',
  side: BoardPin['side'],
  gapAfter: Record<number, number> = {},
): BoardPin[] {
  let offset = 0
  return specs.map(([id, label, role], i) => {
    const pin: BoardPin = {
      id,
      label,
      role,
      side,
      x: axis === 'x' ? origin.x + offset : origin.x,
      y: axis === 'y' ? origin.y + offset : origin.y,
    }
    offset += PITCH + (gapAfter[i] ?? 0)
    return pin
  })
}

const dig = (n: number, role: PinRole, pwm = false): Spec => [`D${n}`, `${pwm ? '~' : ''}${n}`, role]

// --- Arduino Uno R3 (USB on the left) -------------------------------------
const UNO_TOP: Spec[] = [
  ['SCL', 'SCL', 'other'],
  ['SDA', 'SDA', 'other'],
  ['AREF', 'AREF', 'other'],
  ['GND_T', 'GND', 'gnd'],
  dig(13, 'out'),
  dig(12, 'out'),
  dig(11, 'out', true),
  dig(10, 'out', true),
  dig(9, 'out', true),
  dig(8, 'out'),
  dig(7, 'in-bool'),
  dig(6, 'in-bool', true),
  dig(5, 'in-bool', true),
  dig(4, 'in-bool'),
  dig(3, 'in-bool', true),
  dig(2, 'in-bool'),
  ['D1', 'TX 1', 'other'],
  ['D0', 'RX 0', 'other'],
]

const UNO_POWER: Spec[] = [
  ['NC', '', 'other'],
  ['IOREF', 'IOREF', 'other'],
  ['RESET', 'RESET', 'other'],
  ['3V3', '3.3V', 'power'],
  ['5V', '5V', 'power'],
  ['GND_1', 'GND', 'gnd'],
  ['GND_2', 'GND', 'gnd'],
  ['VIN', 'VIN', 'power'],
]

const UNO_ANALOG: Spec[] = [0, 1, 2, 3, 4, 5].map((n) => [`A${n}`, `A${n}`, 'in-num'] as Spec)

export const UNO: BoardLayout = {
  width: 380,
  height: 290,
  pins: [
    // The top header has a wider gap after D8 and the bottom one after VIN, like the real board.
    ...run(UNO_TOP.slice(0, 10), { x: 100, y: 11 }, 'x', 'top'),
    ...run(UNO_TOP.slice(10), { x: 250, y: 11 }, 'x', 'top'),
    ...run(UNO_POWER, { x: 110, y: 279 }, 'x', 'bottom'),
    ...run(UNO_ANALOG, { x: 232, y: 279 }, 'x', 'bottom'),
  ],
}

// --- ESP32 DevKit V1, 30 pins (antenna at the top, micro-USB at the bottom) ---
const ESP_LEFT: Spec[] = [
  ['EN', 'EN', 'other'],
  ['VP', 'VP', 'in-num'],
  ['VN', 'VN', 'in-num'],
  ['D34', 'D34', 'in-num'],
  ['D35', 'D35', 'in-num'],
  ['D32', 'D32', 'in-num'],
  ['D33', 'D33', 'in-num'],
  ['D25', 'D25', 'in-bool'],
  ['D26', 'D26', 'in-bool'],
  ['D27', 'D27', 'in-bool'],
  ['D14', 'D14', 'in-bool'],
  ['D12', 'D12', 'out'],
  ['D13', 'D13', 'out'],
  ['GND_L', 'GND', 'gnd'],
  ['VIN', 'VIN', 'power'],
]

const ESP_RIGHT: Spec[] = [
  ['D23', 'D23', 'out'],
  ['D22', 'D22', 'out'],
  ['TX0', 'TX0', 'other'],
  ['RX0', 'RX0', 'other'],
  ['D21', 'D21', 'out'],
  ['D19', 'D19', 'out'],
  ['D18', 'D18', 'out'],
  ['D5', 'D5', 'out'],
  ['D17', 'TX2', 'out'],
  ['D16', 'RX2', 'out'],
  ['D4', 'D4', 'out'],
  ['D2', 'D2', 'out'],
  ['D15', 'D15', 'out'],
  ['GND_R', 'GND', 'gnd'],
  ['3V3', '3V3', 'power'],
]

export const ESP32: BoardLayout = {
  width: 156,
  height: 300,
  pins: [...run(ESP_LEFT, { x: 12, y: 56 }, 'y', 'left'), ...run(ESP_RIGHT, { x: 144, y: 56 }, 'y', 'right')],
}

// --- Raspberry Pi Pico (micro-USB at the top) --------------------------------
const gp = (n: number, role: PinRole): Spec => [`GP${n}`, `GP${n}`, role]

const PICO_LEFT: Spec[] = [
  gp(0, 'in-bool'),
  gp(1, 'in-bool'),
  ['GND_1', 'GND', 'gnd'],
  gp(2, 'in-bool'),
  gp(3, 'in-bool'),
  gp(4, 'in-bool'),
  gp(5, 'in-bool'),
  ['GND_2', 'GND', 'gnd'],
  gp(6, 'out'),
  gp(7, 'out'),
  gp(8, 'out'),
  gp(9, 'out'),
  ['GND_3', 'GND', 'gnd'],
  gp(10, 'out'),
  gp(11, 'out'),
  gp(12, 'out'),
  gp(13, 'out'),
  ['GND_4', 'GND', 'gnd'],
  gp(14, 'out'),
  gp(15, 'out'),
]

const PICO_RIGHT: Spec[] = [
  ['VBUS', 'VBUS', 'power'],
  ['VSYS', 'VSYS', 'power'],
  ['GND_5', 'GND', 'gnd'],
  ['3V3_EN', '3V3_EN', 'other'],
  ['3V3', '3V3', 'power'],
  ['ADC_VREF', 'ADC_VREF', 'other'],
  gp(28, 'in-num'),
  ['AGND', 'AGND', 'gnd'],
  gp(27, 'in-num'),
  gp(26, 'in-num'),
  ['RUN', 'RUN', 'other'],
  gp(22, 'out'),
  ['GND_6', 'GND', 'gnd'],
  gp(21, 'out'),
  gp(20, 'out'),
  gp(19, 'out'),
  gp(18, 'out'),
  ['GND_7', 'GND', 'gnd'],
  gp(17, 'out'),
  gp(16, 'out'),
]

export const PICO: BoardLayout = {
  width: 115,
  height: 300,
  pins: [...run(PICO_LEFT, { x: 8, y: 17 }, 'y', 'left'), ...run(PICO_RIGHT, { x: 107, y: 17 }, 'y', 'right')],
}
