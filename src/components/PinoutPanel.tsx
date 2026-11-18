import { findCatalogEntry } from '../catalog/parts'

type PinoutPanelProps = {
  catalogId: string | null
  onClose: () => void
}

export function PinoutPanel({ catalogId, onClose }: PinoutPanelProps) {
  if (!catalogId) return null
  const entry = findCatalogEntry(catalogId)
  if (!entry?.pinout?.length) return null

  return (
  <aside className="pinout-panel" aria-label={`Pinout for ${entry.mpn}`}>
      <header className="pinout-panel__head">
        <div>
          <h2 className="pinout-panel__title">{entry.mpn}</h2>
          <p className="pinout-panel__sub">{entry.name}</p>
        </div>
        <button type="button" className="pinout-panel__close" onClick={onClose}>
          ×
        </button>
      </header>
      <table className="pinout-panel__table">
        <thead>
          <tr>
            <th>Pin</th>
            <th>Name</th>
            <th>Function</th>
          </tr>
        </thead>
        <tbody>
          {entry.pinout.map((pin) => (
            <tr key={`${pin.number}-${pin.name}`}>
              <td>{pin.number}</td>
              <td>{pin.name}</td>
              <td>{pin.function}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </aside>
  )
}