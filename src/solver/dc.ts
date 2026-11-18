import type { CircuitGraph, ComponentBranch, NetId } from './graph'

export type Confidence = 'exact' | 'approximate' | 'unsupported'

export interface ResistanceResult {
  ohms: number | null
  confidence: Confidence
  detail: string
}

const MAX_THEVENIN_BRANCHES = 24

/** Equivalent resistance between two nets (DC, resistors only; L open, C open). */
export function resistanceBetween(
  graph: CircuitGraph,
  netA: NetId,
  netB: NetId,
): ResistanceResult {
  if (netA === netB) {
    return { ohms: 0, confidence: 'exact', detail: 'Same electrical node.' }
  }

  const resistors = graph.branches.filter(
    (b) => b.kind === 'resistor' && b.resistance != null && b.resistance > 0,
  )

  if (resistors.length === 0) {
    return {
      ohms: null,
      confidence: 'unsupported',
      detail: 'No resistors in network — cannot infer DC resistance.',
    }
  }

  if (resistors.length > MAX_THEVENIN_BRANCHES) {
    return {
      ohms: null,
      confidence: 'unsupported',
      detail: `Graph has ${resistors.length} resistors (limit ${MAX_THEVENIN_BRANCHES}). Use a smaller region.`,
    }
  }

  const subtree = subtreeBetween(graph, netA, netB, resistors)
  if (!subtree) {
    return {
      ohms: null,
      confidence: 'unsupported',
      detail: 'No resistive path between probe nets (may need MNA for bridges).',
    }
  }

  const req = reduceTree(subtree, netA, netB)
  if (req == null) {
    return {
      ohms: null,
      confidence: 'unsupported',
      detail: 'Topology not reducible as series/parallel tree — full MNA later.',
    }
  }

  const hasNonResistive = graph.branches.some(
    (b) =>
      b.kind === 'capacitor' ||
      b.kind === 'inductor' ||
      b.kind === 'voltage_source',
  )

  return {
    ohms: req,
    confidence: hasNonResistive ? 'approximate' : 'exact',
    detail: hasNonResistive
      ? 'DC R with C/L/sources present (C open, L open at DC).'
      : 'Series/parallel reduction on resistive subgraph.',
  }
}

function subtreeBetween(
  _graph: CircuitGraph,
  netA: NetId,
  netB: NetId,
  resistors: ComponentBranch[],
): ComponentBranch[] | null {
  const allowedNets = new Set<NetId>()
  const stack = [netA]
  allowedNets.add(netA)
  while (stack.length) {
    const n = stack.pop()!
    for (const r of resistors) {
      let other: NetId | null = null
      if (r.netA === n) other = r.netB
      else if (r.netB === n) other = r.netA
      if (other && !allowedNets.has(other)) {
        allowedNets.add(other)
        stack.push(other)
      }
    }
  }
  if (!allowedNets.has(netB)) return null
  return resistors.filter(
    (r) => allowedNets.has(r.netA) && allowedNets.has(r.netB),
  )
}

/**
 * Attempt Thevenin R via 1 V test source — conductance stamping for small graphs.
 * Falls back when Y-matrix is singular.
 */
function reduceTree(
  branches: ComponentBranch[],
  netA: NetId,
  netB: NetId,
): number | null {
  const nets = new Set<NetId>()
  for (const b of branches) {
    nets.add(b.netA)
    nets.add(b.netB)
  }
  if (!nets.has(netA) || !nets.has(netB)) return null

  const netList = [...nets]
  const idx = new Map(netList.map((n, i) => [n, i]))

  const n = netList.length
  if (n < 2) return null

  const g = Array.from({ length: n }, () => Array(n).fill(0))

  for (const b of branches) {
    const r = b.resistance!
    const gi = 1 / r
    const i = idx.get(b.netA)!
    const j = idx.get(b.netB)!
    g[i]![i]! += gi
    g[j]![j]! += gi
    g[i]![j]! -= gi
    g[j]![i]! -= gi
  }

  const ref = idx.get(netB)!
  const probe = idx.get(netA)!
  if (ref === probe) return 0

  const size = n - 1
  const matrix: number[][] = []
  const rhs = new Array(size).fill(0)

  let row = 0
  for (let i = 0; i < n; i++) {
    if (i === ref) continue
    const rowVec = new Array(size).fill(0)
    let col = 0
    for (let j = 0; j < n; j++) {
      if (j === ref) continue
      rowVec[col] = g[i]![j]!
      col++
    }
    matrix.push(rowVec)
    if (i === probe) rhs[row] = 1
    row++
  }

  const v = solveLinear(matrix, rhs)
  if (!v) return null

  let vProbe = 0
  let vCol = 0
  for (let j = 0; j < n; j++) {
    if (j === ref) continue
    if (j === probe) vProbe = v[vCol]!
    vCol++
  }

  if (Math.abs(vProbe) < 1e-12) return null
  return 1 / vProbe
}

function solveLinear(a: number[][], b: number[]): number[] | null {
  const n = b.length
  const aug = a.map((row, i) => [...row, b[i]!])

  for (let col = 0; col < n; col++) {
    let pivot = col
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(aug[r]![col]!) > Math.abs(aug[pivot]![col]!)) pivot = r
    }
    if (Math.abs(aug[pivot]![col]!) < 1e-15) return null
    ;[aug[col], aug[pivot]] = [aug[pivot]!, aug[col]!]

    const div = aug[col]![col]!
    for (let c = col; c <= n; c++) aug[col]![c]! /= div

    for (let r = 0; r < n; r++) {
      if (r === col) continue
      const factor = aug[r]![col]!
      for (let c = col; c <= n; c++) aug[r]![c]! -= factor * aug[col]![c]!
    }
  }

  return aug.map((row) => row[n]!)
}

export function dividerVoltage(
  graph: CircuitGraph,
  tapNet: NetId,
): { volts: number | null; confidence: Confidence; detail: string } {
  const gnd = [...graph.groundNets][0]
  if (!gnd) {
    return {
      volts: null,
      confidence: 'unsupported',
      detail: 'No ground symbol — pick GND reference.',
    }
  }

  const sources = graph.branches.filter(
    (b) => b.kind === 'voltage_source' && b.voltage != null,
  )
  const resistors = graph.branches.filter(
    (b) => b.kind === 'resistor' && b.resistance != null,
  )

  if (sources.length === 1 && resistors.length === 2) {
    const vSrc = sources[0]!
    const posNet = vSrc.netB
    const negNet = vSrc.netA
    const r1 = resistors.find((r) =>
      netsShare(r, posNet, tapNet),
    )
    const r2 = resistors.find((r) =>
      netsShare(r, tapNet, negNet) || netsShare(r, tapNet, gnd),
    )
    if (r1 && r2 && r1 !== r2) {
      const R1 = r1.resistance!
      const R2 = r2.resistance!
      const vIn = vSrc.voltage!
      const vOut = (vIn * R2) / (R1 + R2)
      if (
        (r1.netA === tapNet || r1.netB === tapNet) &&
        (r2.netA === tapNet || r2.netB === tapNet)
      ) {
        return {
          volts: vOut,
          confidence: 'exact',
          detail: 'Classic divider from source to tap node.',
        }
      }
    }
  }

  return {
    volts: null,
    confidence: 'unsupported',
    detail: 'Divider voltage needs source + two series R to tap (MNA later).',
  }
}

function netsShare(b: ComponentBranch, a: NetId, c: NetId): boolean {
  return (
    (b.netA === a && b.netB === c) ||
    (b.netA === c && b.netB === a) ||
    (b.netA === a || b.netB === a)
  )
}