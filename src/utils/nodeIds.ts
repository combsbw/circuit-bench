let nodeSeq = 0

export function getNodeSeq() {
  return nodeSeq
}

export function setNodeSeq(next: number) {
  nodeSeq = next
}

export function syncNodeSeqFromNodes(nodes: { id: string }[]) {
  let max = 0
  for (const n of nodes) {
    const m = /^part-(\d+)$/.exec(n.id)
    if (m) max = Math.max(max, Number(m[1]))
  }
  nodeSeq = max
}

export function nextNodeId() {
  nodeSeq += 1
  return `part-${nodeSeq}`
}