/** Part kinds on the canvas (expanded in analysis pass). */
export type PartKind =
  | 'resistor'
  | 'capacitor'
  | 'inductor'
  | 'ground'
  | 'voltage_source'
  | 'op_amp'
  | 'npn'
  | 'nmos'
  | 'pmos'
  | 'regulator'
  | 'gate_driver'
  | 'module'
  | 'placeholder'

export type PaletteCategory = 'passive' | 'sources' | 'semiconductors' | 'modules'

export interface PartAttributes {
  label: string
  value?: string
  partNumber?: string
  catalogId?: string
  rotation?: number
  probeMark?: 'A' | 'B'
  /** Handle ids with at least one edge (build-mode highlight helper). */
  connectedHandles?: string[]
}

export const PALETTE_DRAG_TYPE = 'application/circuit-bench-part'