import { PALETTE_DRAG_TYPE, type PartKind } from '../types/circuit'

export type PaletteItem = {
  kind: PartKind
  label: string
  symbol: string
  defaultValue?: string
}

const ITEMS: PaletteItem[] = [
  { kind: 'resistor', label: 'Resistor', symbol: 'R', defaultValue: '10kΩ' },
  { kind: 'capacitor', label: 'Capacitor', symbol: 'C', defaultValue: '100nF' },
  { kind: 'inductor', label: 'Inductor', symbol: 'L', defaultValue: '10mH' },
  { kind: 'ground', label: 'Ground', symbol: '⏚' },
  {
    kind: 'voltage_source',
    label: 'DC source',
    symbol: 'V',
    defaultValue: '5V',
  },
]

type ComponentPaletteProps = {
  onAddPart: (item: PaletteItem) => void
}

export function ComponentPalette({ onAddPart }: ComponentPaletteProps) {
  return (
    <aside className="palette" aria-label="Component library">
      <h2 className="palette__heading">Components</h2>
      <p className="palette__hint">Drag onto canvas or tap to place</p>
      <ul className="palette__list">
        {ITEMS.map((item) => (
          <li key={item.kind}>
            <button
              type="button"
              className="palette__item"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData(
                  PALETTE_DRAG_TYPE,
                  JSON.stringify(item),
                )
                e.dataTransfer.effectAllowed = 'move'
              }}
              onClick={() => onAddPart(item)}
            >
              <span className="palette__symbol" aria-hidden>
                {item.symbol}
              </span>
              <span className="palette__name">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="palette__footer">
        Op-amps, MOSFETs, and catalog parts arrive in later phases.
      </p>
    </aside>
  )
}