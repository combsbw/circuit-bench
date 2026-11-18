import {
  DEFAULT_BUILD_CHECKS,
  DEFAULT_TROUBLESHOOT_CHECKS,
  type AppMode,
  type ModeProgress,
} from '../store/types'

type ModePanelProps = {
  mode: AppMode
  buildProgress: ModeProgress
  troubleshootProgress: ModeProgress
  onBuildChange: (next: ModeProgress) => void
  onTroubleshootChange: (next: ModeProgress) => void
}

export function ModePanel({
  mode,
  buildProgress,
  troubleshootProgress,
  onBuildChange,
  onTroubleshootChange,
}: ModePanelProps) {
  if (mode === 'design') return null

  const isBuild = mode === 'build'
  const labels = isBuild ? DEFAULT_BUILD_CHECKS : DEFAULT_TROUBLESHOOT_CHECKS
  const progress = isBuild ? buildProgress : troubleshootProgress
  const onChange = isBuild ? onBuildChange : onTroubleshootChange

  return (
    <aside className="mode-panel" aria-label={`${mode} checklist`}>
      <h2 className="mode-panel__title">
        {isBuild ? 'Build progress' : 'Troubleshoot steps'}
      </h2>
      <ul className="mode-panel__list">
        {Object.entries(labels).map(([key, label]) => (
          <li key={key}>
            <label className="mode-panel__check">
              <input
                type="checkbox"
                checked={progress.checks[key] ?? false}
                onChange={(e) =>
                  onChange({
                    ...progress,
                    checks: { ...progress.checks, [key]: e.target.checked },
                  })
                }
              />
              <span>{label}</span>
            </label>
          </li>
        ))}
      </ul>
      <label className="mode-panel__notes">
        <span>Notes</span>
        <textarea
          rows={3}
          value={progress.notes}
          placeholder="Optional session notes…"
          onChange={(e) => onChange({ ...progress, notes: e.target.value })}
        />
      </label>
    </aside>
  )
}