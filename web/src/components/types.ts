export type Value = number | boolean
export type PortType = 'number' | 'boolean'
export type PropValue = number | string | boolean
export type Props = Record<string, PropValue>
export type Category = 'mcu' | 'sensor' | 'logic' | 'actuator' | 'display'

export interface PortDef {
  id: string
  label: string
  type: PortType
}

export type PropDef =
  | { key: string; label: string; type: 'number'; default: number; min?: number; max?: number; step?: number }
  | { key: string; label: string; type: 'select'; default: string; options: { value: string; label: string }[] }
  | { key: string; label: string; type: 'boolean'; default: boolean }
  | { key: string; label: string; type: 'code'; default: string; rows?: number }

export interface StepContext {
  props: Props
  inputs: Record<string, Value | undefined>
  /** Mutable per-node state that survives between ticks. */
  state: Record<string, unknown>
  /** Simulated time in ms since the simulation started. */
  time: number
  /** Simulated time in ms since the previous tick. */
  dt: number
}

/** How the node card renders its live value. */
export type NodeView = 'board' | 'analog' | 'digital' | 'button' | 'led' | 'fan' | 'buzzer' | 'gauge' | 'chart'

/** What a physical pin on a microcontroller board does in the simulation. */
export type PinRole = 'in-num' | 'in-bool' | 'out' | 'power' | 'gnd' | 'other'

export interface BoardPin {
  /** Port id, also the name used in the board's program (for example D13 or GP16). */
  id: string
  /** What is printed on the board's silkscreen. */
  label: string
  role: PinRole
  /** Centre of the pin in the board's pixel space. */
  x: number
  y: number
  /** Which way a wire leaves the pin. */
  side: 'top' | 'bottom' | 'left' | 'right'
}

export interface BoardLayout {
  width: number
  height: number
  pins: BoardPin[]
}

export interface ComponentDef {
  kind: string
  label: string
  category: Category
  description: string
  unit?: string
  view: NodeView
  inputs: PortDef[]
  outputs: PortDef[]
  props: PropDef[]
  /** Present for microcontroller boards: where the pins sit on the artwork. */
  board?: BoardLayout
  /** When set, the engine records this input's numeric history for the node. */
  recordInput?: string
  step: (ctx: StepContext) => Record<string, Value>
}
