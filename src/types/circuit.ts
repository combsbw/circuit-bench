/** Part kinds on the canvas (expanded in analysis pass). */
export type PartKind =
  | 'resistor'
  | 'capacitor'
  | 'inductor'
  | 'ground'
  | 'voltage_source'
  | 'placeholder'

export interface PartAttributes {
  label: string
  value?: string
  partNumber?: string
  probeMark?: 'A' | 'B'
}

export const PALETTE_DRAG_TYPE = 'application/circuit-bench-part'