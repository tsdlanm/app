export type Value = number | boolean
export type PortType = 'number' | 'boolean'
export type PropValue = number | string | boolean
export type Props = Record<string, PropValue>
export type Category = 'sensor' | 'logic' | 'actuator' | 'display'

export interface PortDef {
  id: string
  label: string
  type: PortType
}

export type PropDef =
  | { key: string; label: string; type: 'number'; default: number; min?: number; max?: number; step?: number }
  | { key: string; label: string; type: 'select'; default: string; options: { value: string; label: string }[] }
  | { key: string; label: string; type: 'boolean'; default: boolean }

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
export type NodeView = 'analog' | 'digital' | 'button' | 'led' | 'fan' | 'buzzer' | 'gauge' | 'chart'

export interface ComponentDef {
  kind: string
  label: string
  category: Category
  icon: string
  description: string
  unit?: string
  view: NodeView
  inputs: PortDef[]
  outputs: PortDef[]
  props: PropDef[]
  /** When set, the engine records this input's numeric history for the node. */
  recordInput?: string
  step: (ctx: StepContext) => Record<string, Value>
}
