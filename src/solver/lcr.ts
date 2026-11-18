import type { CircuitGraph, ComponentBranch, NetId } from './graph'
import type { Confidence } from './dc'
import { solveLinear } from './dc'

export interface LcrMeasureResult {
  value: number | null
  unit: 'F' | 'H'
  confidence: Confidence
  detail: string
}

const MAX_LCR_BRANCHES = 24

function subtreeBetween(
  netA: NetId,
  netB: NetId,
  branches: ComponentBranch[],
): ComponentBranch[] | null {
  const allowedNets = new Set<NetId>()
  const stack = [netA]
  allowedNets.add(netA)
  while (stack.length) {
    const n = stack.pop()!
    for (const b of branches) {
      let other: NetId | null = null
      if (b.netA === n) other = b.netB
      else if (b.netB === n) other = b.netA
      if (other && !allowedNets.has(other)) {
        allowedNets.add(other)
        stack.push(other)
      }
    }
  }
  if (!allowedNets.has(netB)) return null
  return branches.filter(
    (r) => allowedNets.has(r.netA) && allowedNets.has(r.netB),
  )
}

/**
 * Series/parallel reduction with elastance S=1/C stamped as conductance analog.
 */
function reduceCapacitance(
  branches: ComponentBranch[],
  netA: NetId,
  netB: NetId,
): number | null {
  const stamped: ComponentBranch[] = []
  for (const b of branches) {
    const c = b.capacitance
    if (c == null || c <= 0) continue
    stamped.push({ ...b, resistance: 1 / c })
  }
  if (stamped.length === 0) return null
  const sEq = reduceTreeOhms(stamped, netA, netB)
  if (sEq == null || sEq <= 0) return null
  return 1 / sEq
}

/** Inductors: L values stamp like resistors in the same reduction graph. */
function reduceInductance(
  branches: ComponentBranch[],
  netA: NetId,
  netB: NetId,
): number | null {
  const stamped: ComponentBranch[] = []
  for (const b of branches) {
    const l = b.inductance
    if (l == null || l <= 0) continue
    stamped.push({ ...b, resistance: l })
  }
  if (stamped.length === 0) return null
  return reduceTreeOhms(stamped, netA, netB)
}

function reduceTreeOhms(
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

export function capacitanceBetween(
  graph: CircuitGraph,
  netA: NetId,
  netB: NetId,
): LcrMeasureResult {
  if (netA === netB) {
    return {
      value: null,
      unit: 'F',
      confidence: 'unsupported',
      detail: 'Same net — pick two distinct probe points.',
    }
  }

  const caps = graph.branches.filter(
    (b) => b.kind === 'capacitor' && b.capacitance != null && b.capacitance > 0,
  )
  if (caps.length === 0) {
    return {
      value: null,
      unit: 'F',
      confidence: 'unsupported',
      detail: 'No capacitors in schematic.',
    }
  }
  if (caps.length > MAX_LCR_BRANCHES) {
    return {
      value: null,
      unit: 'F',
      confidence: 'unsupported',
      detail: `Too many capacitors (${caps.length}); limit ${MAX_LCR_BRANCHES}.`,
    }
  }

  const subtree = subtreeBetween(netA, netB, caps)
  if (!subtree?.length) {
    return {
      value: null,
      unit: 'F',
      confidence: 'unsupported',
      detail: 'No capacitive path between probe nets.',
    }
  }

  const ceq = reduceCapacitance(subtree, netA, netB)
  if (ceq == null) {
    return {
      value: null,
      unit: 'F',
      confidence: 'unsupported',
      detail: 'C network not reducible as series/parallel tree.',
    }
  }

  const hasOther = graph.branches.some(
    (b) => b.kind === 'resistor' || b.kind === 'inductor' || b.kind === 'voltage_source',
  )

  return {
    value: ceq,
    unit: 'F',
    confidence: hasOther ? 'approximate' : 'exact',
    detail: hasOther
      ? 'Ideal C only between probes (ignores R/L/sources in parallel paths).'
      : 'Series/parallel reduction on capacitor subgraph.',
  }
}

export function inductanceBetween(
  graph: CircuitGraph,
  netA: NetId,
  netB: NetId,
): LcrMeasureResult {
  if (netA === netB) {
    return {
      value: null,
      unit: 'H',
      confidence: 'unsupported',
      detail: 'Same net — pick two distinct probe points.',
    }
  }

  const coils = graph.branches.filter(
    (b) => b.kind === 'inductor' && b.inductance != null && b.inductance > 0,
  )
  if (coils.length === 0) {
    return {
      value: null,
      unit: 'H',
      confidence: 'unsupported',
      detail: 'No inductors in schematic.',
    }
  }
  if (coils.length > MAX_LCR_BRANCHES) {
    return {
      value: null,
      unit: 'H',
      confidence: 'unsupported',
      detail: `Too many inductors (${coils.length}); limit ${MAX_LCR_BRANCHES}.`,
    }
  }

  const subtree = subtreeBetween(netA, netB, coils)
  if (!subtree?.length) {
    return {
      value: null,
      unit: 'H',
      confidence: 'unsupported',
      detail: 'No inductive path between probe nets.',
    }
  }

  const leq = reduceInductance(subtree, netA, netB)
  if (leq == null) {
    return {
      value: null,
      unit: 'H',
      confidence: 'unsupported',
      detail: 'L network not reducible as series/parallel tree.',
    }
  }

  return {
    value: leq,
    unit: 'H',
    confidence: 'exact',
    detail: 'Series/parallel reduction on inductor subgraph.',
  }
}