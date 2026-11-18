import type { Node, Edge } from '@xyflow/react'
import type { PlaceholderNodeData } from '../components/nodes/CircuitPartNode'
import { buildCircuitGraph, type ComponentBranch } from './graph'
import { parseResistance } from './formulas'

export type PatternKind =
  | 'voltage_divider'
  | 'rc_lowpass'
  | 'rl_lowpass'
  | 'series_rlc'
  | 'twin_t_notch'
  | 'unknown'

export type PatternConfidence = 'exact' | 'approximate' | 'partial'

export interface DetectedPattern {
  kind: PatternKind
  confidence: PatternConfidence
  componentIds: string[]
  /** Named slots for tool prefill */
  slots: Record<string, number | undefined>
  message: string
}

export function detectPatterns(
  nodes: Node<PlaceholderNodeData>[],
  edges: Edge[],
  selectedIds?: string[],
): DetectedPattern[] {
  const subset =
    selectedIds && selectedIds.length > 0
      ? nodes.filter((n) => selectedIds.includes(n.id))
      : nodes

  if (subset.length === 0) return []

  const graph = buildCircuitGraph(nodes, edges)
  const idSet = new Set(subset.map((n) => n.id))
  const branches = graph.branches.filter((b) => idSet.has(b.componentId))

  const results: DetectedPattern[] = []

  const divider = matchVoltageDivider(branches)
  if (divider && divider.componentIds.every((id) => idSet.has(id))) {
    results.push(divider)
  }

  const rc = matchRc(branches)
  if (rc && rc.componentIds.every((id) => idSet.has(id))) results.push(rc)

  const rl = matchRl(branches)
  if (rl && rl.componentIds.every((id) => idSet.has(id))) results.push(rl)

  const rlc = matchSeriesRlc(branches)
  if (rlc && rlc.componentIds.every((id) => idSet.has(id))) results.push(rlc)

  const notch = matchTwinT(branches, nodes)
  if (notch && notch.componentIds.every((id) => idSet.has(id))) results.push(notch)

  if (results.length === 0 && branches.length > 0) {
    results.push({
      kind: 'unknown',
      confidence: 'partial',
      componentIds: branches.map((b) => b.componentId),
      slots: {},
      message: 'Selection has parts but no recognized template yet.',
    })
  }

  return results
}

function matchVoltageDivider(branches: ComponentBranch[]): DetectedPattern | null {
  const resistors = branches.filter(
    (b) => b.kind === 'resistor' && b.resistance != null,
  )
  if (resistors.length !== 2) return null

  const [r1, r2] = resistors
  const sharedNet =
    r1.netA === r2.netA || r1.netA === r2.netB
      ? r1.netA
      : r1.netB === r2.netA || r1.netB === r2.netB
        ? r1.netB
        : null

  if (!sharedNet) return null

  return {
    kind: 'voltage_divider',
    confidence: 'exact',
    componentIds: [r1.componentId, r2.componentId],
    slots: { R1: r1.resistance, R2: r2.resistance, V_in: 5 },
    message: 'Two series resistors share a tap node (divider).',
  }
}

function matchRc(branches: ComponentBranch[]): DetectedPattern | null {
  const r = branches.find((b) => b.kind === 'resistor' && b.resistance)
  const c = branches.find((b) => b.kind === 'capacitor' && b.capacitance)
  if (!r || !c) return null
  const shares = r.netA === c.netA || r.netA === c.netB || r.netB === c.netA || r.netB === c.netB
  return {
    kind: 'rc_lowpass',
    confidence: shares ? 'exact' : 'approximate',
    componentIds: [r.componentId, c.componentId],
    slots: { R: r.resistance, C: c.capacitance },
    message: shares
      ? 'R and C share a node (one-pole RC).'
      : 'R and C in selection; verify shunt vs series wiring.',
  }
}

function matchRl(branches: ComponentBranch[]): DetectedPattern | null {
  const r = branches.find((b) => b.kind === 'resistor' && b.resistance)
  const l = branches.find((b) => b.kind === 'inductor' && b.inductance)
  if (!r || !l) return null
  return {
    kind: 'rl_lowpass',
    confidence: 'approximate',
    componentIds: [r.componentId, l.componentId],
    slots: { R: r.resistance, L: l.inductance },
    message: 'R and L in selection (RL one-pole).',
  }
}

function matchSeriesRlc(branches: ComponentBranch[]): DetectedPattern | null {
  const rs = branches.filter((b) => b.kind === 'resistor' && b.resistance)
  const cs = branches.filter((b) => b.kind === 'capacitor' && b.capacitance)
  const ls = branches.filter((b) => b.kind === 'inductor' && b.inductance)
  if (rs.length < 1 || cs.length < 1 || ls.length < 1) return null

  const ids = [
    rs[0]!.componentId,
    cs[0]!.componentId,
    ls[0]!.componentId,
  ]

  return {
    kind: 'series_rlc',
    confidence: 'approximate',
    componentIds: ids,
    slots: {
      R: rs[0]!.resistance,
      C: cs[0]!.capacitance,
      L: ls[0]!.inductance,
    },
    message: 'R, L, and C present — treated as series RLC when wired in line.',
  }
}

function matchTwinT(
  branches: ComponentBranch[],
  nodes: Node<PlaceholderNodeData>[],
): DetectedPattern | null {
  const rs = branches.filter((b) => b.kind === 'resistor')
  const cs = branches.filter((b) => b.kind === 'capacitor')
  const ls = branches.filter((b) => b.kind === 'inductor')
  if (rs.length < 3 || cs.length < 1 || ls.length < 1) return null

  const rVals = rs.map((b) => b.resistance).filter((v) => v != null)
  const similarR =
    rVals.length >= 3 &&
    Math.max(...rVals as number[]) / Math.min(...rVals as number[]) < 1.5

  if (!similarR) return null

  const c = cs[0]!
  const l = ls[0]!
  const r = rs[0]!.resistance ?? parseResistance(
    nodes.find((n) => n.id === rs[0]!.componentId)?.data.value,
  )

  return {
    kind: 'twin_t_notch',
    confidence: 'approximate',
    componentIds: branches
      .filter((b) => ['resistor', 'capacitor', 'inductor'].includes(b.kind))
      .map((b) => b.componentId),
    slots: {
      R: r ?? undefined,
      C: c.capacitance,
      L: l.inductance,
    },
    message: 'Twin-T style R–C–R / R–L–R notch (topology heuristic).',
  }
}

export function kindFromPattern(p: PatternKind): string {
  switch (p) {
    case 'voltage_divider':
      return 'Voltage divider'
    case 'rc_lowpass':
      return 'RC low-pass'
    case 'rl_lowpass':
      return 'RL low-pass'
    case 'series_rlc':
      return 'Series RLC'
    case 'twin_t_notch':
      return 'Twin-T notch'
    default:
      return 'Unknown'
  }
}