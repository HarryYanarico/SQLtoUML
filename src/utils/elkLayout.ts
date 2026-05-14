import { Node, Edge } from '@xyflow/react'

function getLayoutedElements(nodes: Node[], edges: Edge[]): { nodes: Node[]; edges: Edge[] } {
  const nodeWidth = 280
  const nodeHeight = 80
  const hGap = 100
  const vGap = 120

  const junctionEdges = edges.filter(e => e.type === 'mnDashed')
  const junctionIds = new Set(junctionEdges.map(e => e.source))

  const mainNodes = nodes.filter(n => !junctionIds.has(n.id))

  const isIrrelevantEdge = (e: Edge) => junctionIds.has(e.source) || e.type === 'recursive'

  const hasIncoming = (id: string) =>
    edges.some(e => e.target === id && !isIrrelevantEdge(e))

  const roots = mainNodes.filter(n => !hasIncoming(n.id))

  const levels: string[][] = []
  const visited = new Set<string>()

  function assignLevel(ids: string[], depth: number) {
    if (ids.length === 0) return
    if (!levels[depth]) levels[depth] = []
    for (const id of ids) {
      if (!visited.has(id)) {
        levels[depth].push(id)
        visited.add(id)
      }
    }
    const nextIds = [...new Set(
      ids.flatMap(id =>
        edges.filter(e => e.source === id && !isIrrelevantEdge(e)).map(e => e.target)
      ).filter(id => !visited.has(id))
    )]
    assignLevel(nextIds, depth + 1)
  }

  assignLevel(roots.map(n => n.id), 0)

  const remaining = mainNodes.filter(n => !visited.has(n.id))
  for (const r of remaining) {
    if (!visited.has(r.id)) {
      visited.add(r.id)
      if (!levels[0]) levels[0] = []
      levels[0].push(r.id)
    }
  }

  const layoutedNodesMap = new Map<string, Node>()

  for (const node of mainNodes) {
    let level = 0
    let posInLevel = 0
    for (let l = 0; l < levels.length; l++) {
      const idx = levels[l].indexOf(node.id)
      if (idx !== -1) {
        level = l
        posInLevel = idx
        break
      }
    }

    const countInLevel = (levels[level] || []).length
    const totalWidth = countInLevel * nodeWidth + (countInLevel - 1) * hGap
    const startX = -totalWidth / 2 + nodeWidth / 2

    layoutedNodesMap.set(node.id, {
      ...node,
      position: {
        x: startX + posInLevel * (nodeWidth + hGap),
        y: level * (nodeHeight + vGap) + 50
      }
    })
  }

  for (const je of junctionEdges) {
    const parentTables: string[] | undefined = (je.data as Record<string, unknown>)?.parentTables as string[] | undefined
    if (!parentTables || parentTables.length !== 2) continue

    const [pa, pb] = parentTables
    const nA = layoutedNodesMap.get(pa)
    const nB = layoutedNodesMap.get(pb)

    if (!nA || !nB) continue

    const ax = nA.position.x + nodeWidth / 2
    const ay = nA.position.y + nodeHeight / 2
    const bx = nB.position.x + nodeWidth / 2
    const by = nB.position.y + nodeHeight / 2

    const midX = (ax + bx) / 2
    const midY = (ay + by) / 2

    const original = nodes.find(n => n.id === je.source)
    if (original) {
      layoutedNodesMap.set(original.id, {
        ...original,
        position: {
          x: midX - nodeWidth / 2,
          y: midY + vGap * 0.6
        }
      })
    }
  }

  const layoutedNodes = nodes.map(node =>
    layoutedNodesMap.get(node.id) || node
  )

  return { nodes: layoutedNodes, edges }
}

export { getLayoutedElements }