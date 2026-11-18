import { useEffect, useState } from 'react'
import type { CircuitDocument } from '../store/types'

type DocumentMenuProps = {
  open: boolean
  onClose: () => void
  designs: CircuitDocument[]
  currentName: string | null
  saving: boolean
  onNew: () => void
  onSave: (name: string, overwrite: boolean) => void
  onLoad: (id: string) => void
  onExport: () => void
  canInstall: boolean
  onInstall: () => void
  showIosHint: boolean
}

export function DocumentMenu({
  open,
  onClose,
  designs,
  currentName,
  saving,
  onNew,
  onSave,
  onLoad,
  onExport,
  canInstall,
  onInstall,
  showIosHint,
}: DocumentMenuProps) {
  const [saveName, setSaveName] = useState(currentName ?? '')

  useEffect(() => {
    if (open) setSaveName(currentName ?? '')
  }, [open, currentName])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const overwrite = Boolean(
    currentName &&
      saveName.trim().toLowerCase() === currentName.trim().toLowerCase(),
  )

  return (
    <div className="doc-menu__backdrop" role="presentation" onClick={onClose}>
      <div
        className="doc-menu"
        role="dialog"
        aria-labelledby="doc-menu-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="doc-menu__header">
          <h2 id="doc-menu-title">Designs</h2>
          <button type="button" className="doc-menu__close" onClick={onClose}>
            Close
          </button>
        </header>

        <section className="doc-menu__section">
          <h3>Save</h3>
          <div className="doc-menu__row">
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Design name"
              aria-label="Design name"
            />
            <button
              type="button"
              disabled={!saveName.trim() || saving}
              onClick={() => onSave(saveName.trim(), overwrite)}
            >
              {overwrite ? 'Save' : 'Save as'}
            </button>
          </div>
          {currentName ? (
            <p className="doc-menu__meta">Current: {currentName}</p>
          ) : null}
        </section>

        <section className="doc-menu__section">
          <h3>Open</h3>
          {designs.length === 0 ? (
            <p className="doc-menu__empty">No saved designs yet.</p>
          ) : (
            <ul className="doc-menu__list">
              {designs.map((d) => (
                <li key={d.id}>
                  <button type="button" onClick={() => onLoad(d.id)}>
                    <span className="doc-menu__design-name">{d.name}</span>
                    <span className="doc-menu__design-date">
                      {new Date(d.updatedAt).toLocaleString()}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="doc-menu__section doc-menu__actions">
          <button type="button" className="doc-menu__secondary" onClick={onNew}>
            New design
          </button>
          <button
            type="button"
            className="doc-menu__icon-btn"
            onClick={onExport}
            title="Export JSON"
            aria-label="Export design as JSON"
          >
            <DownloadIcon />
            Export
          </button>
        </section>

        {canInstall || showIosHint ? (
          <section className="doc-menu__section doc-menu__install">
            <h3>Install app</h3>
            {canInstall ? (
              <button type="button" onClick={onInstall}>
                Install Circuit Bench
              </button>
            ) : null}
            {showIosHint ? (
              <p className="doc-menu__ios-hint">
                On iPhone: Share → <strong>Add to Home Screen</strong> for
                offline use.
              </p>
            ) : null}
          </section>
        ) : null}
      </div>
    </div>
  )
}

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M12 16l-5-5h3V4h4v7h3l-5 5zm-7 2h14v2H5v-2z"
      />
    </svg>
  )
}