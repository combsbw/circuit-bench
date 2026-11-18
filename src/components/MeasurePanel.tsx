import { useMemo, useState } from 'react'
import type { Edge, Node } from '@xyflow/react'
import type { PlaceholderNodeData } from './nodes/CircuitPartNode'
import type { DmmTool, MeasureState } from '../store/types'
import { analyzeSelection, summarizePatterns } from '../solver/analyze'
import type { DetectedPattern } from '../solver/patterns'
import {
  formatCapacitance,
  formatInductance,
  formatResistance,
} from '../solver/formulas'
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

const DMM_TOOLS: { id: DmmTool; label: string; hint: string }[] = [
  { id: 'resistance', label: 'R', hint: 'Two probes · equivalent DC resistance' },
  { id: 'dc_voltage', label: 'V DC', hint: 'Probe A vs ground' },
  { id: 'capacitance', label: 'C', hint: 'Two probes · series/parallel C stub' },
]

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
  const [assistOpen, setAssistOpen] = useState(false)

  const dmmTool = measure.dmmTool
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
        dmmTool,
      ),
    [nodes, edges, selectedNodeIds, probeA, probeB, dmmTool],
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
  const activeDmm = DMM_TOOLS.find((t) => t.id === dmmTool)!

  function labelForNode(id: string): string {
    const n = nodes.find((x) => x.id === id)
  const d = n?.data
    return (d?.label as string) || id
  }

  return (
    <aside className="measure-panel" aria-label="Measure tools">
      <h2 className="measure-panel__title">Measure</h2>

      <div className="measure-strip" role="toolbar" aria-label="DMM functions">
        {DMM_TOOLS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`measure-strip__btn${
              dmmTool === t.id ? ' measure-strip__btn--active' : ''
            }`}
            aria-pressed={dmmTool === t.id}
            onClick={() =>
              onMeasureChange({ ...measure, dmmTool: t.id })
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <p className="measure-panel__hint">{activeDmm.hint}</p>

      <div className="measure-panel__probes">
        <div>
          <span className="measure-panel__probe measure-panel__probe--a">A</span>
          {probeA ? (
            <code>{labelForNode(probeA.nodeId)}</code>
          ) : (
            <span className="muted">Tap canvas</span>
          )}
        </div>
        {dmmTool !== 'dc_voltage' ? (
          <div>
            <span className="measure-panel__probe measure-panel__probe--b">B</span>
            {probeB ? (
              <code>{labelForNode(probeB.nodeId)}</code>
            ) : (
              <span className="muted">Tap second node</span>
            )}
          </div>
        ) : null}
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
        <h3>DMM reading</h3>
        {dmmTool === 'resistance' && analysis.resistance ? (
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
        {dmmTool === 'resistance' && analysis.resistance ? (
          <p className="measure-panel__detail">{analysis.resistance.detail}</p>
        ) : null}

        {dmmTool === 'dc_voltage' && analysis.probeVoltage ? (
          <p>
            V<sub>GND</sub> ={' '}
            {analysis.probeVoltage.volts != null
              ? `${analysis.probeVoltage.volts.toFixed(3)} V`
              : '—'}{' '}
            <span className={`conf conf--${analysis.probeVoltage.confidence}`}>
              {analysis.probeVoltage.confidence}
            </span>
          </p>
        ) : null}
        {dmmTool === 'dc_voltage' && analysis.probeVoltage ? (
          <p className="measure-panel__detail">{analysis.probeVoltage.detail}</p>
        ) : null}

        {dmmTool === 'capacitance' && analysis.capacitance ? (
          <p>
            C<sub>AB</sub> ={' '}
            {analysis.capacitance.farads != null
              ? formatCapacitance(analysis.capacitance.farads)
              : '—'}{' '}
            <span className={`conf conf--${analysis.capacitance.confidence}`}>
              {analysis.capacitance.confidence}
            </span>
          </p>
        ) : null}
        {dmmTool === 'capacitance' && analysis.capacitance ? (
          <p className="measure-panel__detail">{analysis.capacitance.detail}</p>
        ) : null}
        {dmmTool === 'capacitance' && analysis.inductanceHint?.henries != null ? (
          <p className="measure-panel__filter">
            L<sub>AB</sub> ≈ {formatInductance(analysis.inductanceHint.henries)} (
            {analysis.inductanceHint.confidence})
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

      <button
        type="button"
        className="measure-panel__assist-toggle"
        aria-expanded={assistOpen}
        onClick={() => setAssistOpen((v) => !v)}
      >
        {assistOpen ? 'Hide' : 'Show'} calculator assist
      </button>

      {assistOpen ? (
        <>
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
                className={`measure-panel__tool-tab${
                  activeTool === id ? ' measure-panel__tool-tab--active' : ''
                }`}
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
        </>
      ) : null}
    </aside>
  )
}