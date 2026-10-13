import type { PortType, Value } from '../components/types'

/**
 * A tiny, safe "firmware" language for microcontroller boards. One statement per line:
 *
 *   D13 = A0 > 30            # comment
 *   D12 = time % 2 < 1
 *
 * Expressions support numbers, pin names, `time` (simulated seconds), true/false, + - * / %,
 * comparisons (> >= < <= == !=), and/or/not (also && || !) and parentheses.
 * It is parsed by hand and never evaluated with eval().
 */

export interface PinSpec {
  /** Readable pins and their types (the board's inputs). */
  inputs: Record<string, PortType>
  /** Writable pins (the board's outputs). */
  outputs: string[]
}

export interface CompileError {
  line: number
  message: string
}

type Expr =
  | { t: 'num'; v: number }
  | { t: 'bool'; v: boolean }
  | { t: 'var'; name: string }
  | { t: 'un'; op: '-' | 'not'; e: Expr }
  | { t: 'bin'; op: string; l: Expr; r: Expr }

interface Statement {
  line: number
  target: string
  expr: Expr
}

export interface Compiled {
  statements: Statement[]
  errors: CompileError[]
}

export const MAX_PROGRAM_LENGTH = 3000
const MAX_STATEMENTS = 100
const MAX_DEPTH = 40

type Token = { k: 'num' | 'id' | 'op'; v: string }

const TWO_CHAR = new Set(['>=', '<=', '==', '!=', '&&', '||'])
const ONE_CHAR = new Set(['>', '<', '+', '-', '*', '/', '%', '(', ')', '!', '='])

function tokenize(src: string): Token[] {
  const out: Token[] = []
  let i = 0
  while (i < src.length) {
    const c = src[i]
    if (c === ' ' || c === '\t' || c === '\r') {
      i++
    } else if (/[0-9.]/.test(c)) {
      let j = i
      while (j < src.length && /[0-9.]/.test(src[j])) j++
      const text = src.slice(i, j)
      if (!/^(\d+\.?\d*|\.\d+)$/.test(text)) throw new Error(`Angka tidak valid: ${text}`)
      out.push({ k: 'num', v: text })
      i = j
    } else if (/[A-Za-z_]/.test(c)) {
      let j = i
      while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j++
      out.push({ k: 'id', v: src.slice(i, j) })
      i = j
    } else if (TWO_CHAR.has(src.slice(i, i + 2))) {
      out.push({ k: 'op', v: src.slice(i, i + 2) })
      i += 2
    } else if (ONE_CHAR.has(c)) {
      out.push({ k: 'op', v: c })
      i++
    } else {
      throw new Error(`Karakter tidak dikenal: "${c}"`)
    }
  }
  return out
}

class Parser {
  private pos = 0
  constructor(
    private tokens: Token[],
    private known: Set<string>,
  ) {}

  parse(): Expr {
    const e = this.or(0)
    if (this.pos < this.tokens.length) throw new Error(`Tidak terduga: "${this.tokens[this.pos].v}"`)
    return e
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos]
  }

  private isOp(...ops: string[]): boolean {
    const t = this.peek()
    return t?.k === 'op' && ops.includes(t.v)
  }

  private isWord(...words: string[]): boolean {
    const t = this.peek()
    return t?.k === 'id' && words.includes(t.v.toLowerCase())
  }

  private or(d: number): Expr {
    this.guard(d)
    let l = this.and(d + 1)
    while (this.isWord('or') || this.isOp('||')) {
      this.pos++
      l = { t: 'bin', op: 'or', l, r: this.and(d + 1) }
    }
    return l
  }

  private and(d: number): Expr {
    let l = this.not(d + 1)
    while (this.isWord('and') || this.isOp('&&')) {
      this.pos++
      l = { t: 'bin', op: 'and', l, r: this.not(d + 1) }
    }
    return l
  }

  private not(d: number): Expr {
    this.guard(d)
    if (this.isWord('not') || this.isOp('!')) {
      this.pos++
      return { t: 'un', op: 'not', e: this.not(d + 1) }
    }
    return this.compare(d + 1)
  }

  private compare(d: number): Expr {
    const l = this.add(d + 1)
    if (this.isOp('>', '>=', '<', '<=', '==', '!=')) {
      const op = this.tokens[this.pos++].v
      return { t: 'bin', op, l, r: this.add(d + 1) }
    }
    return l
  }

  private add(d: number): Expr {
    let l = this.mul(d + 1)
    while (this.isOp('+', '-')) {
      const op = this.tokens[this.pos++].v
      l = { t: 'bin', op, l, r: this.mul(d + 1) }
    }
    return l
  }

  private mul(d: number): Expr {
    let l = this.unary(d + 1)
    while (this.isOp('*', '/', '%')) {
      const op = this.tokens[this.pos++].v
      l = { t: 'bin', op, l, r: this.unary(d + 1) }
    }
    return l
  }

  private unary(d: number): Expr {
    this.guard(d)
    if (this.isOp('-')) {
      this.pos++
      return { t: 'un', op: '-', e: this.unary(d + 1) }
    }
    return this.primary(d + 1)
  }

  private primary(d: number): Expr {
    this.guard(d)
    const t = this.tokens[this.pos++]
    if (!t) throw new Error('Ekspresi belum lengkap')
    if (t.k === 'num') return { t: 'num', v: Number(t.v) }
    if (t.k === 'id') {
      const lower = t.v.toLowerCase()
      if (lower === 'true') return { t: 'bool', v: true }
      if (lower === 'false') return { t: 'bool', v: false }
      const name = t.v.toUpperCase()
      if (name !== 'TIME' && !this.known.has(name)) throw new Error(`Pin "${t.v}" tidak dikenal`)
      return { t: 'var', name }
    }
    if (t.v === '(') {
      const e = this.or(d + 1)
      if (!this.isOp(')')) throw new Error('Kurung tutup ")" hilang')
      this.pos++
      return e
    }
    throw new Error(`Tidak terduga: "${t.v}"`)
  }

  private guard(d: number) {
    if (d > MAX_DEPTH) throw new Error('Ekspresi terlalu bersarang')
  }
}

export function compile(source: string, pins: PinSpec): Compiled {
  const errors: CompileError[] = []
  const statements: Statement[] = []
  const outputs = new Set(pins.outputs.map((p) => p.toUpperCase()))
  const known = new Set([...Object.keys(pins.inputs).map((p) => p.toUpperCase()), ...outputs])

  if (source.length > MAX_PROGRAM_LENGTH) {
    return { statements, errors: [{ line: 1, message: `Program terlalu panjang (maksimum ${MAX_PROGRAM_LENGTH} karakter)` }] }
  }

  let capped = false
  source.split('\n').forEach((raw, index) => {
    const line = index + 1
    const text = raw.replace(/#.*$/, '').trim()
    if (!text) return
    if (statements.length >= MAX_STATEMENTS) {
      if (!capped) errors.push({ line, message: `Maksimum ${MAX_STATEMENTS} baris perintah` })
      capped = true
      return
    }
    try {
      const tokens = tokenize(text)
      if (tokens.length < 3 || tokens[0].k !== 'id' || tokens[1].k !== 'op' || tokens[1].v !== '=') {
        throw new Error('Format: PIN = ekspresi, misalnya D13 = A0 > 30')
      }
      const target = tokens[0].v.toUpperCase()
      if (!known.has(target)) throw new Error(`Pin "${tokens[0].v}" tidak dikenal`)
      if (!outputs.has(target)) throw new Error(`${tokens[0].v} adalah masukan, hanya pin keluaran yang bisa diisi`)
      statements.push({ line, target, expr: new Parser(tokens.slice(2), known).parse() })
    } catch (e) {
      errors.push({ line, message: e instanceof Error ? e.message : 'Kesalahan tidak dikenal' })
    }
  })

  return { statements, errors }
}

const num = (v: Value): number => (typeof v === 'boolean' ? (v ? 1 : 0) : v)
const bool = (v: Value): boolean => (typeof v === 'number' ? v !== 0 : v)

function evaluate(e: Expr, env: Map<string, Value>): Value {
  switch (e.t) {
    case 'num':
    case 'bool':
      return e.v
    case 'var':
      return env.get(e.name) ?? 0
    case 'un': {
      const v = evaluate(e.e, env)
      return e.op === 'not' ? !bool(v) : -num(v)
    }
    case 'bin': {
      if (e.op === 'and') return bool(evaluate(e.l, env)) && bool(evaluate(e.r, env))
      if (e.op === 'or') return bool(evaluate(e.l, env)) || bool(evaluate(e.r, env))
      const a = num(evaluate(e.l, env))
      const b = num(evaluate(e.r, env))
      switch (e.op) {
        case '+':
          return a + b
        case '-':
          return a - b
        case '*':
          return a * b
        case '/':
          return b === 0 ? 0 : a / b
        case '%':
          return b === 0 ? 0 : a % b
        case '>':
          return a > b
        case '>=':
          return a >= b
        case '<':
          return a < b
        case '<=':
          return a <= b
        case '==':
          return a === b
        default:
          return a !== b
      }
    }
  }
}

/**
 * Runs a compiled program once. Unconnected inputs read as 0 / false.
 * Statements run top to bottom, so a later line can read an output set by an earlier one.
 */
export function execute(
  program: Compiled,
  pins: PinSpec,
  inputs: Record<string, Value | undefined>,
  timeSeconds: number,
): Record<string, Value> {
  const env = new Map<string, Value>()
  for (const [id, type] of Object.entries(pins.inputs)) {
    const v = inputs[id]
    env.set(id.toUpperCase(), typeof v === type ? (v as Value) : type === 'number' ? 0 : false)
  }
  env.set('TIME', timeSeconds)

  const out: Record<string, Value> = Object.fromEntries(pins.outputs.map((id) => [id, false]))
  const byUpper = new Map(pins.outputs.map((id) => [id.toUpperCase(), id]))
  for (const id of pins.outputs) env.set(id.toUpperCase(), false)

  for (const s of program.statements) {
    const result = bool(evaluate(s.expr, env))
    env.set(s.target, result)
    out[byUpper.get(s.target) ?? s.target] = result
  }
  return out
}

const cache = new Map<string, Compiled>()

/** Compiles with a small cache so a running simulation does not re-parse every tick. */
export function compileCached(key: string, source: string, pins: PinSpec): Compiled {
  const k = `${key}\u0000${source}`
  let c = cache.get(k)
  if (!c) {
    if (cache.size > 100) cache.clear()
    c = compile(source, pins)
    cache.set(k, c)
  }
  return c
}
