import type { PartKind, PaletteCategory } from '../types/circuit'

export type CatalogPin = {
  number: number | string
  name: string
  function: string
}

export type CatalogEntry = {
  id: string
  mpn: string
  name: string
  category: PaletteCategory
  kind: PartKind
  defaultValue?: string
  defaultLabel?: string
  pinout?: CatalogPin[]
}

export const CATALOG: CatalogEntry[] = [
  {
    id: 'esp32-s3-supermini',
    mpn: 'ESP32-S3 Supermini',
    name: 'ESP32-S3 Supermini',
    category: 'modules',
    kind: 'module',
    defaultLabel: 'ESP32-S3',
    pinout: [
      { number: 1, name: '5V', function: 'USB / 5 V input' },
      { number: 2, name: 'GND', function: 'Ground' },
      { number: 3, name: '3V3', function: '3.3 V regulator output' },
      { number: 4, name: 'GPIO4', function: 'GPIO / ADC' },
      { number: 5, name: 'GPIO5', function: 'GPIO' },
      { number: 6, name: 'GPIO6', function: 'GPIO' },
      { number: 7, name: 'GPIO7', function: 'GPIO' },
      { number: 8, name: 'GPIO15', function: 'GPIO / strap' },
      { number: 9, name: 'GPIO16', function: 'GPIO' },
      { number: 10, name: 'GPIO17', function: 'GPIO' },
      { number: 11, name: 'GPIO18', function: 'GPIO' },
      { number: 12, name: 'GPIO8', function: 'GPIO' },
    ],
  },
  {
    id: 'tc4420',
    mpn: 'TC4420',
    name: 'TC4420 MOSFET driver',
    category: 'semiconductors',
    kind: 'gate_driver',
    defaultLabel: 'TC4420',
    pinout: [
      { number: 1, name: 'NC', function: 'No connect' },
      { number: 2, name: 'IN', function: 'Logic input' },
      { number: 3, name: 'GND', function: 'Ground' },
      { number: 4, name: 'OUT', function: 'Gate drive output' },
      { number: 5, name: 'VDD', function: 'Supply 4.5–18 V' },
      { number: 6, name: 'NC', function: 'No connect' },
      { number: 7, name: 'NC', function: 'No connect' },
      { number: 8, name: 'NC', function: 'No connect' },
    ],
  },
  {
    id: 'tl072',
    mpn: 'TL072',
    name: 'TL072 dual JFET op-amp',
    category: 'semiconductors',
    kind: 'op_amp',
    defaultLabel: 'TL072',
    pinout: [
      { number: 1, name: 'OUT A', function: 'Channel A output' },
      { number: 2, name: 'IN− A', function: 'Channel A inverting' },
      { number: 3, name: 'IN+ A', function: 'Channel A non-inverting' },
      { number: 4, name: 'V−', function: 'Negative supply' },
      { number: 5, name: 'IN+ B', function: 'Channel B non-inverting' },
      { number: 6, name: 'IN− B', function: 'Channel B inverting' },
      { number: 7, name: 'OUT B', function: 'Channel B output' },
      { number: 8, name: 'V+', function: 'Positive supply' },
    ],
  },
  {
    id: 'lm7812',
    mpn: 'LM7812',
    name: 'LM7812 +12 V regulator',
    category: 'semiconductors',
    kind: 'regulator',
    defaultValue: '12V',
    defaultLabel: '7812',
    pinout: [
      { number: 1, name: 'IN', function: 'Unregulated input' },
      { number: 2, name: 'GND', function: 'Ground / tab' },
      { number: 3, name: 'OUT', function: '+12 V regulated' },
    ],
  },
  {
    id: '2n7002',
    mpn: '2N7002',
    name: '2N7002 N-channel MOSFET',
    category: 'semiconductors',
    kind: 'nmos',
    defaultLabel: '2N7002',
    pinout: [
      { number: 1, name: 'G', function: 'Gate' },
      { number: 2, name: 'S', function: 'Source' },
      { number: 3, name: 'D', function: 'Drain' },
    ],
  },
]

export function findCatalogEntry(idOrMpn: string): CatalogEntry | undefined {
  const key = idOrMpn.toLowerCase()
  return CATALOG.find(
    (e) => e.id === key || e.mpn.toLowerCase() === key,
  )
}

export function searchCatalog(query: string): CatalogEntry[] {
  const q = query.trim().toLowerCase()
  if (!q) return CATALOG
  return CATALOG.filter(
    (e) =>
      e.mpn.toLowerCase().includes(q) ||
      e.name.toLowerCase().includes(q) ||
      e.id.includes(q),
  )
}

export const PALETTE_SECTIONS: {
  id: PaletteCategory
  title: string
  items: {
    kind: PartKind
    label: string
    defaultValue?: string
    catalogId?: string
  }[]
}[] = [
  {
    id: 'passive',
    title: 'Passive',
    items: [
      { kind: 'resistor', label: 'Resistor', defaultValue: '10kΩ' },
      { kind: 'capacitor', label: 'Capacitor', defaultValue: '100nF' },
      { kind: 'inductor', label: 'Inductor', defaultValue: '10mH' },
    ],
  },
  {
    id: 'sources',
    title: 'Sources',
    items: [
      { kind: 'ground', label: 'Ground' },
      { kind: 'voltage_source', label: 'DC source', defaultValue: '5V' },
    ],
  },
  {
    id: 'semiconductors',
    title: 'Semiconductors',
    items: [
      { kind: 'op_amp', label: 'Op-amp', catalogId: 'tl072' },
      { kind: 'npn', label: 'NPN BJT' },
      { kind: 'nmos', label: 'N-MOSFET', catalogId: '2n7002' },
      { kind: 'pmos', label: 'P-MOSFET' },
      { kind: 'regulator', label: 'Linear reg', catalogId: 'lm7812' },
      { kind: 'gate_driver', label: 'Gate driver', catalogId: 'tc4420' },
    ],
  },
  {
    id: 'modules',
    title: 'Modules',
    items: [
      {
        kind: 'module',
        label: 'ESP32-S3 Supermini',
        catalogId: 'esp32-s3-supermini',
      },
    ],
  },
]