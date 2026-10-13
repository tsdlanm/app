import { memo } from 'react'
import Esp32Art from './Esp32Art'
import PicoArt from './PicoArt'
import UnoArt from './UnoArt'
import type { ArtProps } from './parts'

export type { ArtProps }

/** The realistic artwork for a microcontroller board, picked by component kind. */
function BoardArt({ kind, ...props }: { kind: string } & ArtProps) {
  switch (kind) {
    case 'mcu-uno':
      return <UnoArt {...props} />
    case 'mcu-esp32':
      return <Esp32Art {...props} />
    case 'mcu-pico':
      return <PicoArt {...props} />
    default:
      return null
  }
}

// Only the running flag and the pins that drive on-board LEDs change the picture.
const same = (a: { kind: string } & ArtProps, b: { kind: string } & ArtProps) =>
  a.kind === b.kind && a.running === b.running && a.outputs?.D13 === b.outputs?.D13 && a.outputs?.D2 === b.outputs?.D2

export default memo(BoardArt, same)
