import type { PartKind } from '../types/circuit'

export type InspectorValueHint = {
  label: string
  placeholder: string
  showColor?: boolean
}

export function inspectorValueHint(kind: PartKind): InspectorValueHint | null {
  switch (kind) {
    case 'ground':
      return null
    case 'resistor':
      return { label: 'Resistance', placeholder: 'e.g. 10kΩ' }
    case 'capacitor':
      return { label: 'Capacitance', placeholder: 'e.g. 100nF' }
    case 'inductor':
      return { label: 'Inductance', placeholder: 'e.g. 10mH' }
    case 'voltage_source':
      return { label: 'Voltage', placeholder: 'e.g. 5V' }
    case 'fuse':
      return { label: 'Current rating', placeholder: 'e.g. 1A' }
    case 'led':
      return {
        label: 'Vf / color',
        placeholder: 'e.g. 2V red',
        showColor: true,
      }
    case 'zener':
      return { label: 'Zener Vz', placeholder: 'e.g. 5.1V' }
    case 'tvs':
      return { label: 'Breakdown Vbr', placeholder: 'e.g. 12V SMBJ12A' }
    case 'diode':
      return { label: 'Rating / type', placeholder: 'e.g. 1A rectifier' }
    case 'switch':
      return { label: 'Rating (optional)', placeholder: 'e.g. 3A SPST' }
    case 'module':
    case 'gate_driver':
      return null
    default:
      return { label: 'Value', placeholder: 'e.g. —' }
  }
}

export function showsInlineValue(kind: PartKind): boolean {
  return inspectorValueHint(kind) !== null
}