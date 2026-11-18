import { useMemo, useState } from 'react'
import type { Node } from '@xyflow/react'
import { CATALOG, findCatalogEntry, searchCatalog } from '../catalog/parts'
import type { PlaceholderNodeData } from './nodes/CircuitPartNode'
import type { PartKind } from '../types/circuit'

export type InspectorPatch = Partial<PlaceholderNodeData> & { kind?: PartKind }

type InspectorDrawerProps = {
  open: boolean
  node: Node<PlaceholderNodeData> | null
  onClose: () => void
  onPatch: (nodeId: string, patch: InspectorPatch) => void
  onOpenPinout: (catalogId: string) => void
}

export function InspectorDrawer({
  open,
  node,
  onClose,
  onPatch,
  onOpenPinout,
}: InspectorDrawerProps) {
  const [catalogQuery, setCatalogQuery] = useState('')

  const matches = useMemo(
    () => searchCatalog(catalogQuery),
    [catalogQuery],
  )

  if (!open || !node) return null

  const data = node.data
  const rotation = data.rotation ?? 0

  const applyCatalog = (catalogId: string) => {
    const entry = findCatalogEntry(catalogId)
    if (!entry) return
    onPatch(node.id, {
      kind: entry.kind,
      catalogId: entry.id,
      partNumber: entry.mpn,
      label: entry.defaultLabel ?? entry.name,
      value: entry.defaultValue ?? data.value,
    })
    if (entry.pinout?.length) onOpenPinout(entry.id)
  }

  return (
    <aside className="inspector" aria-label="Component inspector">
      <header className="inspector__head">
        <h2 className="inspector__title">Inspector</h2>
        <button type="button" className="inspector__close" onClick={onClose}>
          Close
        </button>
      </header>
      <p className="inspector__kind">{data.kind}</p>
      <label className="inspector__field">
        <span>Label</span>
        <input
          value={data.label ?? ''}
          onChange={(e) => onPatch(node.id, { label: e.target.value })}
        />
      </label>
      {data.kind !== 'ground' ? (
        <label className="inspector__field">
          <span>Value</span>
          <input
            value={data.value ?? ''}
            onChange={(e) => onPatch(node.id, { value: e.target.value })}
            placeholder="e.g. 10kΩ"
          />
        </label>
      ) : null}
      <label className="inspector__field">
        <span>Part number</span>
        <input
          value={data.partNumber ?? ''}
          onChange={(e) => onPatch(node.id, { partNumber: e.target.value })}
          placeholder="MPN"
        />
      </label>
      <div className="inspector__field">
        <span>Catalog</span>
        <input
          className="inspector__search"
          value={catalogQuery}
          onChange={(e) => setCatalogQuery(e.target.value)}
          placeholder="Search parts…"
        />
        <ul className="inspector__catalog">
          {matches.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                className={
                  data.catalogId === entry.id
                    ? 'inspector__catalog-btn inspector__catalog-btn--active'
                    : 'inspector__catalog-btn'
                }
                onClick={() => applyCatalog(entry.id)}
              >
                <strong>{entry.mpn}</strong>
                <span>{entry.name}</span>
              </button>
            </li>
          ))}
        </ul>
        {CATALOG.length === 0 ? null : null}
      </div>
      <div className="inspector__rotate">
        <span>Rotation</span>
        <button
          type="button"
          onClick={() => onPatch(node.id, { rotation: (rotation + 90) % 360 })}
        >
          Rotate 90° ({rotation}°)
        </button>
      </div>
      {data.catalogId ? (
        <button
          type="button"
          className="inspector__pinout-link"
          onClick={() => onOpenPinout(data.catalogId!)}
        >
          View pinout
        </button>
      ) : null}
    </aside>
  )
}