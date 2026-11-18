import type { Edge, Node } from '@xyflow/react'
import type { PlaceholderNodeData } from '../components/nodes/CircuitPartNode'
import type { DmmTool } from '../store/types'
import { resistanceBetween, voltageAtNet, type Confidence } from './dc'
import { buildCircuitGraph, netForNodeHandle } from './graph'
import { capacitanceBetween, inductanceBetween } from './lcr'
import { detectPatterns, kindFromPattern, type DetectedPattern } from './patterns'
import { insightFromPattern, type FilterInsight } from './filters'

export interface AnalysisProbe {
  nodeId: string
  label: string
}

export interface RegionAnalysis {
  patterns: DetectedPattern[]
  filterInsights: FilterInsight[]
  resistance: { ohms: number | null; confidence: Confidence; detail: string } | null
  probeVoltage: { volts: number | null; confidence: Confidence; detail: string } | null
  capacitance: {
    farads: number | null
    confidence: Confidence
    detail: string
  } | null
  inductanceHint: {
    henries: number | null
    confidence: Confidence
    detail: string
  } | null
}

export function analyzeSelection(
  nodes: Node<PlaceholderNodeData>[],
  edges: Edge[],
  selectedNodeIds: string[],
  probeA: AnalysisProbe | null,
  probeB: AnalysisProbe | null,
  dmmTool: DmmTool = 'resistance',
): RegionAnalysis {
  const patterns = detectPatterns(nodes, edges, selectedNodeIds)
  const filterInsights = patterns
    .filter((p) => p.kind !== 'unknown')
    .map(insightFromPattern)

  const graph = buildCircuitGraph(nodes, edges)

  let resistance: RegionAnalysis['resistance'] = null
  let probeVoltage: RegionAnalysis['probeVoltage'] = null
  let capacitance: RegionAnalysis['capacitance'] = null
  let inductanceHint: RegionAnalysis['inductanceHint'] = null

  const netA =
    probeA && netForNodeHandle(graph, nodes, edges, probeA.nodeId, 'out')
  const netB =
    probeB && netForNodeHandle(graph, nodes, edges, probeB.nodeId, 'out')

  if (dmmTool === 'resistance' && netA && netB) {
    resistance = resistanceBetween(graph, netA, netB)
  }

  if (dmmTool === 'dc_voltage' && netA) {
    probeVoltage = voltageAtNet(graph, netA)
  }

  if (dmmTool === 'capacitance' && netA && netB) {
    const c = capacitanceBetween(graph, netA, netB)
    capacitance = {
      farads: c.value,
      confidence: c.confidence,
      detail: c.detail,
    }
    const l = inductanceBetween(graph, netA, netB)
    if (l.value != null) {
      inductanceHint = {
        henries: l.value,
        confidence: l.confidence,
        detail: l.detail,
      }
    }
  }

  return {
    patterns,
    filterInsights,
    resistance,
    probeVoltage,
    capacitance,
    inductanceHint,
  }
}

export function summarizePatterns(patterns: DetectedPattern[]): string {
  if (patterns.length === 0) return 'No patterns in selection.'
  return patterns
    .map((p) => `${kindFromPattern(p.kind)} (${p.confidence})`)
  .join(' · ')
}