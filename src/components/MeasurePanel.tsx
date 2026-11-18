import { useMemo, useState } from 'react'
import type { Edge, Node } from '@xyflow/react'
import type { PlaceholderNodeData } from './nodes/CircuitPartNode'
import type { MeasureState } from '../store/types'
import { analyzeSelection, summarizePatterns } from '../solver/analyze'
import type { DetectedPattern } from '../solver/patterns'
import { formatResistance } from '../solver/formulas'
import { FilterTools } from './tools/FilterTools'
import { VoltageDividerTool } from './tools/VoltageDividerTool'

type MeasurePanelProps = {
  nodes: Node<PlaceholderNodeData>[]
  edges: Edge[]
  measure: MeasureState
  selectedNodeIds: string[]
  onMeasureChange: (next: MeasureState) => void
  onApplyValues: (
    componentIds: string[],
    slotToKind: Record<string, 'resistor' | 'capacitor' | 'inductor' | 'voltage_source'>,
    values: Record<string, string>,
  ) => void
}

export function MeasurePanel({
  nodes,
  edges,
  measure,
  selectedNodeIds,
  onMeasureChange,
  onApplyValues,
}: MeasurePanelProps) {
  const [activeTool, setActiveTool] = useState<
    'divider' | 'rc' | 'rl' | 'rlc' | 'notch'
  >('divider')

  const probeA = measure.probeA
  const probeB = measure.probeB

  const analysis = useMemo(
    () =>
      analyzeSelection(
        nodes,
        edges,
        selectedNodeIds,
        probeA ? { nodeId: probeA.nodeId, label: probeA.nodeId } : null,
        probeB ? { nodeId: probeB.nodeId, label: probeB.nodeId } : null,
      ),
    [nodes, edges, selectedNodeIds, probeA, probeB],
  )

  const bestPattern = analysis.patterns.find((p) => p.kind !== 'unknown')

  const prefill = bestPattern?.slots ?? {}

  function patternMatches(tool: typeof activeTool, p: DetectedPattern | undefined): boolean {
    if (!p) return false
    if (tool === 'divider') return p.kind === 'voltage_divider'
    if (tool === 'rc') return p.kind === 'rc_lowpass'
    if (tool === 'rl') return p.kind === 'rl_lowpass'
    if (tool === 'rlc') return p.kind === 'series_rlc'
    if (tool === 'notch') return p.kind === 'twin_t_notch'
    return false
  }

  const canApply = patternMatches(activeTool, bestPattern)

  return (
    <aside className="measure-panel" aria-label="Measure tools">
      <h2 className="measure-panel__title">Measure</h2>
      <p className="measure-panel__hint">
        Tap a node for probe A, then probe B. Multi-select parts for pattern
        detection. Not full SPICE — see docs for limits.
      </p>

      <div className="measure-panel__probes">
        <div>
          <span className="measure-panel__probe measure-panel__probe--a">A</span>
          {probeA ? (
            <code>{probeA.nodeId}</code>
          ) : (
            <span className="muted">Click canvas</span>
          )}
        </div>
        <div>
          <span className="measure-panel__probe measure-panel__probe--b">B</span>
          {probeB ? (
            <code>{probeB.nodeId}</code>
          ) : (
            <span className="muted">Click canvas</span>
          )}
        </div>
        <button
          type="button"
          className="measure-panel__clear"
          onClick={() =>
            onMeasureChange({
              ...measure,
              probeA: null,
              probeB: null,
            })
          }
        >
          Clear probes
        </button>
      </div>

      <section className="measure-panel__results" aria-live="polite">
        <h3>Live results</h3>
        {analysis.resistance ? (
          <p>
            R<sub>AB</sub> ={' '}
            {analysis.resistance.ohms != null
              ? formatResistance(analysis.resistance.ohms)
              : '—'}{' '}
            <span className={`conf conf--${analysis.resistance.confidence}`}>
              {analysis.resistance.confidence}
            </span>
          </p>
        ) : null}
        {analysis.probeVoltage?.volts != null ? (
          <p>
            V<sub>probe</sub> ≈ {analysis.probeVoltage.volts.toFixed(3)} V (
            {analysis.probeVoltage.confidence})
          </p>
        ) : null}
        <p className="measure-panel__patterns">
          {summarizePatterns(analysis.patterns)}
        </p>
        {analysis.filterInsights.map((f, i) => (
          <p key={i} className="measure-panel__filter">
            {f.summary}
          </p>
        ))}
      </section>

      <nav className="measure-panel__tools" aria-label="Calculator tools">
        {(
          [
            ['divider', 'Divider'],
            ['rc', 'RC'],
            ['rl', 'RL'],
            ['rlc', 'RLC'],
            ['notch', 'Notch'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`measure-panel__tool-tab${activeTool === id ? ' measure-panel__tool-tab--active' : ''}`}
            onClick={() => setActiveTool(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {activeTool === 'divider' ? (
        <VoltageDividerTool
          prefill={prefill}
          canApply={canApply && !!bestPattern}
          onApply={(v) =>
            bestPattern &&
            onApplyValues(
              bestPattern.componentIds,
              { R1: 'resistor', R2: 'resistor' },
              { R1: v.r1, R2: v.r2 },
            )
          }
        />
      ) : (
        <FilterTools
          variant={activeTool}
          prefill={prefill}
          canApply={canApply && !!bestPattern}
          onApply={(values) => {
            if (!bestPattern) return
            const map: Record<string, 'resistor' | 'capacitor' | 'inductor'> = {
              R: 'resistor',
              C: 'capacitor',
              L: 'inductor',
            }
            onApplyValues(bestPattern.componentIds, map, values)
          }}
        />
      )}
    </aside>
  )
}