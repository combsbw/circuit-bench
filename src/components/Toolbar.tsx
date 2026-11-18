type ToolbarProps = {
  mode: 'design' | 'build' | 'troubleshoot'
}

const MODES: { id: ToolbarProps['mode']; label: string; disabled?: boolean }[] =
  [
    { id: 'design', label: 'Design' },
    { id: 'build', label: 'Build', disabled: true },
    { id: 'troubleshoot', label: 'Troubleshoot', disabled: true },
  ]

export function Toolbar({ mode }: ToolbarProps) {
  return (
    <header className="toolbar">
      <div className="toolbar__brand">
        <span className="toolbar__logo" aria-hidden>
          ⚡
        </span>
        <div>
          <h1 className="toolbar__title">RAM Circuit Bench</h1>
          <p className="toolbar__subtitle">Offline circuit canvas</p>
        </div>
      </div>
      <nav className="toolbar__modes" aria-label="Editor mode">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`toolbar__mode${mode === m.id ? ' toolbar__mode--active' : ''}`}
            disabled={m.disabled}
            aria-current={mode === m.id ? 'page' : undefined}
          >
            {m.label}
            {m.disabled ? (
              <span className="toolbar__soon">Soon</span>
            ) : null}
          </button>
        ))}
      </nav>
    </header>
  )
}