import type { AppMode } from '../store/types'

type ToolbarProps = {
  mode: AppMode
  onModeChange: (mode: AppMode) => void
  designLabel: string | null
  isDirty: boolean
  onOpenMenu: () => void
  onQuickSave: () => void
  onNew: () => void
  onExport: () => void
}

const MODES: { id: AppMode; label: string }[] = [
  { id: 'design', label: 'Design' },
  { id: 'build', label: 'Build' },
  { id: 'troubleshoot', label: 'Troubleshoot' },
]

export function Toolbar({
  mode,
  onModeChange,
  designLabel,
  isDirty,
  onOpenMenu,
  onQuickSave,
  onNew,
  onExport,
}: ToolbarProps) {
  return (
    <header className="toolbar">
      <div className="toolbar__brand">
        <span className="toolbar__logo" aria-hidden>
          ⚡
        </span>
        <div>
          <h1 className="toolbar__title">Circuit Bench</h1>
          <p className="toolbar__subtitle">
            {designLabel
              ? `${designLabel}${isDirty ? ' · unsaved changes' : ''}`
              : 'Offline circuit canvas'}
          </p>
        </div>
      </div>

      <div className="toolbar__cluster">
        <nav className="toolbar__modes" aria-label="Editor mode">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`toolbar__mode${mode === m.id ? ' toolbar__mode--active' : ''}`}
              onClick={() => onModeChange(m.id)}
              aria-current={mode === m.id ? 'page' : undefined}
            >
              {m.label}
            </button>
          ))}
        </nav>

        <div className="toolbar__docs" aria-label="Design actions">
          <button type="button" className="toolbar__action" onClick={onNew}>
            New
          </button>
          <button type="button" className="toolbar__action" onClick={onOpenMenu}>
            Open
          </button>
          <button type="button" className="toolbar__action" onClick={onQuickSave}>
            Save
          </button>
          <button
            type="button"
            className="toolbar__icon-btn"
            onClick={onExport}
            title="Export JSON"
            aria-label="Export design as JSON"
          >
            <DownloadIcon />
          </button>
          <button
            type="button"
            className="toolbar__action toolbar__action--primary"
            onClick={onOpenMenu}
          >
            Menu
          </button>
        </div>
      </div>
    </header>
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