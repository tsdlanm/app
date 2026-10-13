import { describe, expect, it } from 'vitest'
import { compile, execute, type PinSpec } from './firmware'

const pins: PinSpec = { inputs: { A0: 'number', D2: 'boolean', D3: 'boolean' }, outputs: ['D12', 'D13'] }

const run = (src: string, inputs: Record<string, number | boolean> = {}, time = 0) => {
  const program = compile(src, pins)
  expect(program.errors).toEqual([])
  return execute(program, pins, inputs, time)
}

describe('firmware', () => {
  it('compares an analog input', () => {
    expect(run('D13 = A0 > 30', { A0: 35 }).D13).toBe(true)
    expect(run('D13 = A0 > 30', { A0: 25 }).D13).toBe(false)
    expect(run('D13 = A0 >= 30', { A0: 30 }).D13).toBe(true)
    expect(run('D13 = A0 != 30', { A0: 30 }).D13).toBe(false)
  })

  it('applies precedence: not binds tighter than and, and tighter than or', () => {
    const src = 'D13 = D2 or D3 and not D2'
    expect(run(src, { D2: true, D3: false }).D13).toBe(true)
    expect(run(src, { D2: false, D3: true }).D13).toBe(true)
    expect(run(src, { D2: false, D3: false }).D13).toBe(false)
    expect(run('D13 = not D2 and D3', { D2: false, D3: true }).D13).toBe(true)
  })

  it('does arithmetic with the usual precedence and parentheses', () => {
    expect(run('D13 = 2 + 3 * 4 == 14').D13).toBe(true)
    expect(run('D13 = (2 + 3) * 4 == 20').D13).toBe(true)
    expect(run('D13 = -A0 < 0', { A0: 5 }).D13).toBe(true)
    expect(run('D13 = 7 % 4 == 3').D13).toBe(true)
  })

  it('blinks using time', () => {
    const src = 'D12 = time % 2 < 1'
    expect(run(src, {}, 0.5).D12).toBe(true)
    expect(run(src, {}, 1.5).D12).toBe(false)
    expect(run(src, {}, 2.5).D12).toBe(true)
  })

  it('treats unconnected inputs as 0 / false and coerces between types', () => {
    expect(run('D13 = A0 > -1').D13).toBe(true)
    expect(run('D13 = D2').D13).toBe(false)
    expect(run('D13 = D2 + 1 == 2', { D2: true }).D13).toBe(true)
    expect(run('D13 = A0', { A0: 3 }).D13).toBe(true)
  })

  it('lets a later line read an output set by an earlier one', () => {
    const out = run('D13 = A0 > 30\nD12 = D13', { A0: 40 })
    expect(out).toEqual({ D12: true, D13: true })
  })

  it('is case-insensitive and ignores comments and blank lines', () => {
    const out = run('# judul\n\n d13 = a0 > 1   # nyala\n', { A0: 2 })
    expect(out.D13).toBe(true)
  })

  it('defaults outputs to false and never divides by zero', () => {
    expect(run('# kosong')).toEqual({ D12: false, D13: false })
    expect(run('D13 = 1 / 0 == 0').D13).toBe(true)
    expect(run('D13 = 1 % 0 == 0').D13).toBe(true)
  })

  it('reports errors with line numbers and keeps the valid lines', () => {
    const program = compile('D13 = A0 > 30\nD2 = 1\nD12 = Z9\nD12 = (1 + \nbanana', pins)
    expect(program.errors.map((e) => e.line)).toEqual([2, 3, 4, 5])
    expect(program.errors[0].message).toMatch(/masukan/)
    expect(program.errors[1].message).toMatch(/tidak dikenal/)
    expect(program.statements).toHaveLength(1)
    expect(execute(program, pins, { A0: 40 }, 0).D13).toBe(true)
  })

  it('rejects unknown characters, bad numbers and runaway nesting', () => {
    expect(compile('D13 = A0 @ 1', pins).errors).toHaveLength(1)
    expect(compile('D13 = 1.2.3', pins).errors).toHaveLength(1)
    expect(compile(`D13 = ${'('.repeat(500)}1${')'.repeat(500)}`, pins).errors).toHaveLength(1)
    expect(compile(`D13 = ${'not '.repeat(500)}true`, pins).errors).toHaveLength(1)
  })

  it('caps the program size', () => {
    expect(compile('D13 = true\n'.repeat(1000), pins).errors[0].message).toMatch(/terlalu panjang/)
    const many = Array.from({ length: 150 }, () => 'D13 = true').join('\n')
    const program = compile(many, pins)
    expect(program.statements).toHaveLength(100)
    expect(program.errors).toHaveLength(1)
  })
})
