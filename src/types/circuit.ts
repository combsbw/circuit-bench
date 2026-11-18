/** Placeholder part kinds — expanded in later phases. */
export type PartKind = 'resistor' | 'capacitor' | 'placeholder'

export interface PartAttributes {
  label: string
  value?: string
  partNumber?: string
}

export const PALETTE_DRAG_TYPE = 'application/circuit-bench-part'