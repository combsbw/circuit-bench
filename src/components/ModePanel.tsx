import { useMemo } from 'react'
import type { Edge, Node } from '@xyflow/react'
import type { PlaceholderNodeData } from './nodes/CircuitPartNode'
import {
  DEFAULT_BUILD_CHECKS,
  DEFAULT_TROUBLESHOOT_CHECKS,
  type AppMode,
  type ModeProgress,
} from '../store/types'
import { findOpenTerminals } from '../utils/openNets'

type ModePanelProps = {
  mode: AppMode
  nodes: Node<PlaceholderNodeData>[]
  edges: Edge[]
  buildProgress: ModeProgress
  troubleshootProgress: ModeProgress
  onBuildChange: (next: ModeProgress) => void
  onTroubleshootChange: (next: ModeProgress) => void
  onFocusNode?: (nodeId: string) => void
}

export function ModePanel({
  mode,
  nodes,
  edges,
  buildProgress,
  troubleshootProgress,
  onBuildChange,
  onTroubleshootChange,
  onFocusNode,
}: ModePanelProps) {
  if (mode === 'design') return null

  const isBuild = mode === 'build'
  const labels = isBuild ? DEFAULT_BUILD_CHECKS : DEFAULT_TROUBLESHOOT_CHECKS
  const progress = isBuild ? buildProgress : troubleshootProgress
  const onChange = isBuild ? onBuildChange : onTroubleshootChange

  const openTerminals = useMemo(
    () => (mode === 'troubleshoot' ? findOpenTerminals(nodes, edges) : []),
    [mode, nodes, edges],
  )

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

      {mode === 'troubleshoot' ? (
        <section className="mode-panel__open-nets" aria-labelledby="open-nets-heading">
          <h3 id="open-nets-heading" className="mode-panel__open-title">
            Open nets
          </h3>
          <p className="mode-panel__open-hint">
            Unwired terminals (same highlights as build mode). Tap a row to zoom
            to that part.
          </p>
          {openTerminals.length === 0 ? (
            <p className="muted mode-panel__open-empty">All expected pins wired.</p>
          ) : (
            <ul className="mode-panel__open-list">
              {openTerminals.map((t) => (
                <li key={`${t.nodeId}:${t.handleId}`}>
                  <button
                    type="button"
                    className="mode-panel__open-row"
                    onClick={() => onFocusNode?.(t.nodeId)}
                  >
                    {t.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

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