import { findCatalogEntry, PALETTE_SECTIONS } from '../catalog/parts'
import { PALETTE_DRAG_TYPE, type PartKind } from '../types/circuit'

export type PaletteItem = {
  kind: PartKind
  label: string
  defaultValue?: string
  catalogId?: string
  partNumber?: string
}

function sectionItemToPaletteItem(item: (typeof PALETTE_SECTIONS)[0]['items'][0]): PaletteItem {
  const catalog = item.catalogId ? findCatalogEntry(item.catalogId) : undefined
  return {
    kind: item.kind,
    label: item.label,
    defaultValue: item.defaultValue ?? catalog?.defaultValue,
    catalogId: item.catalogId ?? catalog?.id,
    partNumber: catalog?.mpn,
  }
}

type ComponentPaletteProps = {
  onAddPart: (item: PaletteItem) => void
}

export function ComponentPalette({ onAddPart }: ComponentPaletteProps) {
  return (
    <aside className="palette" aria-label="Component library">
      <h2 className="palette__heading">Components</h2>
      <p className="palette__hint">Drag onto canvas or tap to place</p>
      {PALETTE_SECTIONS.map((section) => (
        <section key={section.id} className="palette__section">
          <h3 className="palette__section-title">{section.title}</h3>
          <ul className="palette__list">
            {section.items.map((item) => {
              const paletteItem = sectionItemToPaletteItem(item)
              return (
                <li key={`${section.id}-${item.kind}-${item.catalogId ?? ''}`}>
                  <button
                    type="button"
                    className="palette__item"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData(
                        PALETTE_DRAG_TYPE,
                        JSON.stringify(paletteItem),
                      )
                      e.dataTransfer.effectAllowed = 'move'
                    }}
                    onClick={() => onAddPart(paletteItem)}
                  >
                    <span className="palette__symbol" aria-hidden>
                      {item.kind.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="palette__name">{item.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
      <p className="palette__footer">
        Select a part on canvas to edit values and assign catalog MPNs.
      </p>
    </aside>
  )
}