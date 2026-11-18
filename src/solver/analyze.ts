import type { Edge, Node } from '@xyflow/react'
import type { PlaceholderNodeData } from '../components/nodes/CircuitPartNode'
import { resistanceBetween, dividerVoltage, type Confidence } from './dc'
import { buildCircuitGraph, netForNodeHandle } from './graph'
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
}

export function analyzeSelection(
  nodes: Node<PlaceholderNodeData>[],
  edges: Edge[],
  selectedNodeIds: string[],
  probeA: AnalysisProbe | null,
  probeB: AnalysisProbe | null,
): RegionAnalysis {
  const patterns = detectPatterns(nodes, edges, selectedNodeIds)
  const filterInsights = patterns
    .filter((p) => p.kind !== 'unknown')
    .map(insightFromPattern)

  const graph = buildCircuitGraph(nodes, edges)

  let resistance: RegionAnalysis['resistance'] = null
  if (probeA && probeB) {
    const netA = netForNodeHandle(graph, nodes, edges, probeA.nodeId, 'out')
    const netB = netForNodeHandle(graph, nodes, edges, probeB.nodeId, 'out')
    if (netA && netB) {
      resistance = resistanceBetween(graph, netA, netB)
    }
  }

  let probeVoltage: RegionAnalysis['probeVoltage'] = null
  if (probeA) {
    const tap = netForNodeHandle(graph, nodes, edges, probeA.nodeId, 'out')
    if (tap) probeVoltage = dividerVoltage(graph, tap)
  }

  return { patterns, filterInsights, resistance, probeVoltage }
}

export function summarizePatterns(patterns: DetectedPattern[]): string {
  if (patterns.length === 0) return 'No patterns in selection.'
  return patterns
    .map((p) => `${kindFromPattern(p.kind)} (${p.confidence})`)
  .join(' · ')
}