import { describe, expect, it } from 'vitest'
import { ESP32, PICO, UNO } from './boards'

const boards = { 'Arduino Uno': UNO, 'ESP32 DevKit': ESP32, 'Raspberry Pi Pico': PICO }

describe.each(Object.entries(boards))('%s layout', (_name, board) => {
  it('has unique pin ids', () => {
    const ids = board.pins.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('keeps every pin inside the board', () => {
    for (const p of board.pins) {
      expect(p.x).toBeGreaterThan(0)
      expect(p.x).toBeLessThan(board.width)
      expect(p.y).toBeGreaterThan(0)
      expect(p.y).toBeLessThan(board.height)
    }
  })

  it('never puts two pins closer than a handle is wide', () => {
    for (const a of board.pins) {
      for (const b of board.pins) {
        if (a === b) continue
        expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(13)
      }
    }
  })
})

describe('real pinouts', () => {
  const count = (b: typeof UNO) => b.pins.length
  it('matches the physical pin counts', () => {
    expect(count(UNO)).toBe(18 + 8 + 6)
    expect(count(ESP32)).toBe(30)
    expect(count(PICO)).toBe(40)
  })

  it('exposes the documented inputs and outputs', () => {
    const ids = (b: typeof UNO, role: string) => b.pins.filter((p) => p.role === role).map((p) => p.id)
    expect(ids(UNO, 'in-num')).toEqual(['A0', 'A1', 'A2', 'A3', 'A4', 'A5'])
    expect(ids(UNO, 'out')).toEqual(['D13', 'D12', 'D11', 'D10', 'D9', 'D8'])
    expect(ids(PICO, 'in-num')).toEqual(['GP28', 'GP27', 'GP26'])
    expect(ids(ESP32, 'in-num')).toEqual(['VP', 'VN', 'D34', 'D35', 'D32', 'D33'])
    expect(ESP32.pins.find((p) => p.id === 'D2')?.role).toBe('out')
  })
})
