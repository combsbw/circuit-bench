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
  | 'diode'
  | 'led'
  | 'zener'
  | 'tvs'
  | 'switch'
  | 'fuse'
  | 'placeholder'

export type PaletteCategory =
  | 'passive'
  | 'sources'
  | 'semiconductors'
  | 'diodes'
  | 'modules'

export interface PartAttributes {
  label: string
  value?: string
  partNumber?: string
  catalogId?: string
  rotation?: number
  /** LED tint (optional; value holds Vf / color text). */
  color?: string
  probeMark?: 'A' | 'B'
  /** Handle ids with at least one edge (build-mode highlight helper). */
  connectedHandles?: string[]
}

export const PALETTE_DRAG_TYPE = 'application/circuit-bench-part'