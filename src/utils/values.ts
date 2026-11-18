import {
  formatResistance,
  parseCapacitance,
  parseInductance,
  parseResistance,
  parseVoltage,
} from '../solver/formulas'
import type { PartKind } from '../types/circuit'

export function formatForKind(kind: PartKind, si: number): string {
  switch (kind) {
    case 'resistor':
      return formatResistance(si)
    case 'capacitor': {
      if (si >= 1e-3) return `${(si * 1e3).toFixed(2)} mF`
      if (si >= 1e-6) return `${(si * 1e6).toFixed(2)} µF`
      if (si >= 1e-9) return `${(si * 1e9).toFixed(2)} nF`
      return `${si.toExponential(2)} F`
    }
    case 'inductor': {
      if (si >= 1) return `${si.toFixed(2)} H`
      if (si >= 1e-3) return `${(si * 1e3).toFixed(2)} mH`
      return `${(si * 1e6).toFixed(2)} µH`
    }
    case 'voltage_source':
      return `${si.toFixed(2)} V`
    default:
      return String(si)
  }
}

export function parseForKind(kind: PartKind, raw: string): number | null {
  switch (kind) {
    case 'resistor':
      return parseResistance(raw)
    case 'capacitor':
      return parseCapacitance(raw)
    case 'inductor':
      return parseInductance(raw)
    case 'voltage_source':
      return parseVoltage(raw)
    default:
      return null
  }
}