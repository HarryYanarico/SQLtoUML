import { memo, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { BaseEdge, EdgeProps, useStore } from '@xyflow/react'
import { UmlRelationship } from '../types/uml'
import { useEdgeLabelContext } from '../contexts/EdgeLabelContext'
import MultiplicityEditor from './MultiplicityEditor'

function getBorderPoint(
  nx: number, ny: number, nw: number, nh: number,
  ox: number, oy: number
): { x: number; y: number } {
  const cx = nx + nw / 2
  const cy = ny + nh / 2
  const dx = ox - cx
  const dy = oy - cy

  if (dx === 0 && dy === 0) return { x: cx, y: cy }

  const candidates: { x: number; y: number; t: number }[] = []

  if (dx > 0) {
    const t = (nx + nw - cx) / dx
    const y = cy + dy * t
    if (y >= ny && y <= ny + nh) candidates.push({ x: nx + nw, y, t })
  } else if (dx < 0) {
    const t = (nx - cx) / dx
    const y = cy + dy * t
    if (y >= ny && y <= ny + nh) candidates.push({ x: nx, y, t })
  }

  if (dy > 0) {
    const t = (ny + nh - cy) / dy
    const x = cx + dx * t
    if (x >= nx && x <= nx + nw) candidates.push({ x, y: ny + nh, t })
  } else if (dy < 0) {
    const t = (ny - cy) / dy
    const x = cx + dx * t
    if (x >= nx && x <= nx + nw) candidates.push({ x, y: ny, t })
  }

  if (candidates.length === 0) return { x: cx, y: cy }
  candidates.sort((a, b) => a.t - b.t)
  return { x: candidates[0].x, y: candidates[0].y }
}

function multiplicityOffset(
  bp: { x: number; y: number },
  nx: number, ny: number, nw: number, nh: number
): { x: number; y: number } {
  const eps = 1
  if (Math.abs(bp.x - nx) < eps) return { x: -52, y: -11 }
  if (Math.abs(bp.x - (nx + nw)) < eps) return { x: 12, y: -11 }
  if (Math.abs(bp.y - ny) < eps) return { x: -30, y: -34 }
  if (Math.abs(bp.y - (ny + nh)) < eps) return { x: -30, y: 12 }
  return { x: 12, y: -11 }
}

function diamondOffset(
  bp: { x: number; y: number },
  nx: number, ny: number, nw: number, nh: number,
  size: number
): { dx: number; dy: number; orient: 'h' | 'v' } {
  const eps = 1
  if (Math.abs(bp.x - nx) < eps) return { dx: -size - 6, dy: 0, orient: 'h' }
  if (Math.abs(bp.x - (nx + nw)) < eps) return { dx: -6, dy: 0, orient: 'h' }
  if (Math.abs(bp.y - ny) < eps) return { dx: 0, dy: -size - 6, orient: 'v' }
  if (Math.abs(bp.y - (ny + nh)) < eps) return { dx: 0, dy: -6, orient: 'v' }
  return { dx: -6, dy: 0, orient: 'h' }
}

const NODE_DEFAULTS = { width: 260, height: 80 }

function UmlStraightRelationshipEdge({
  id,
  source,
  target,
  data,
}: EdgeProps) {
  const rel = data as UmlRelationship | undefined
  const { updateLabel, updateMultiplicity } = useEdgeLabelContext()
  const [isHovered, setIsHovered] = useState(false)
  const [editingField, setEditingField] = useState<'source' | 'target' | null>(null)
  const [editorAnchor, setEditorAnchor] = useState<{ x: number; y: number } | null>(null)

  const srcNode = useStore(s => {
    const n = s.nodeLookup.get(source)
    if (!n) return null
    const mw = n.measured?.width ?? NODE_DEFAULTS.width
    const mh = n.measured?.height ?? NODE_DEFAULTS.height
    return { x: n.position.x, y: n.position.y, w: mw, h: mh }
  })

  const tgtNode = useStore(s => {
    const n = s.nodeLookup.get(target)
    if (!n) return null
    const mw = n.measured?.width ?? NODE_DEFAULTS.width
    const mh = n.measured?.height ?? NODE_DEFAULTS.height
    return { x: n.position.x, y: n.position.y, w: mw, h: mh }
  })

  useEffect(() => {
    if (!editingField) setEditorAnchor(null)
  }, [editingField])

  if (!srcNode || !tgtNode) return null

  const cx1 = srcNode.x + srcNode.w / 2
  const cy1 = srcNode.y + srcNode.h / 2
  const cx2 = tgtNode.x + tgtNode.w / 2
  const cy2 = tgtNode.y + tgtNode.h / 2

  const srcBorder = getBorderPoint(srcNode.x, srcNode.y, srcNode.w, srcNode.h, cx2, cy2)
  const tgtBorder = getBorderPoint(tgtNode.x, tgtNode.y, tgtNode.w, tgtNode.h, cx1, cy1)

  const edgePath = `M ${cx1} ${cy1} L ${cx2} ${cy2}`
  const labelX = (cx1 + cx2) / 2
  const labelY = (cy1 + cy2) / 2

  const style = (() => {
    if (!rel) return { stroke: '#64748b', strokeWidth: 2 }
    switch (rel.type) {
      case 'inheritance': return { stroke: '#7c3aed', strokeWidth: 2 }
      case 'composition': return { stroke: '#dc2626', strokeWidth: 2 }
      case 'aggregation': return { stroke: '#059669', strokeWidth: 2 }
      case 'dependency': return { stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '5,5' }
      default: return { stroke: '#64748b', strokeWidth: 2 }
    }
  })()

  const multSrcOff = multiplicityOffset(srcBorder, srcNode.x, srcNode.y, srcNode.w, srcNode.h)
  const multTgtOff = multiplicityOffset(tgtBorder, tgtNode.x, tgtNode.y, tgtNode.w, tgtNode.h)

  const dimOff = diamondOffset(tgtBorder, tgtNode.x, tgtNode.y, tgtNode.w, tgtNode.h, 6)

  const userLabel = rel?.userLabel
  const srcMult = rel?.userSourceMultiplicity ?? rel?.sourceMultiplicity ?? ''
  const tgtMult = rel?.userTargetMultiplicity ?? rel?.targetMultiplicity ?? ''
  const diamondSize = 6

  const handleSourceClick = (e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    setEditorAnchor({ x: rect.left, y: rect.bottom + 4 })
    setEditingField('source')
  }

  const handleTargetClick = (e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    setEditorAnchor({ x: rect.left, y: rect.bottom + 4 })
    setEditingField('target')
  }

  return (
    <g onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <BaseEdge id={id} path={edgePath} style={style} interactionWidth={20} />
      <foreignObject
        x={srcBorder.x + multSrcOff.x}
        y={srcBorder.y + multSrcOff.y}
        width={60}
        height={22}
        requiredExtensions="http://www.w3.org/1999/xhtml"
        style={{ overflow: 'visible' }}
      >
        <div className="flex flex-col items-center" style={{ pointerEvents: 'auto' }}>
          <span
            className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-0.5 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600"
            onClick={handleSourceClick}
            title="Editar multiplicidad"
          >
            {srcMult || ''}
          </span>
        </div>
      </foreignObject>
      <foreignObject
        x={tgtBorder.x + multTgtOff.x}
        y={tgtBorder.y + multTgtOff.y}
        width={60}
        height={22}
        requiredExtensions="http://www.w3.org/1999/xhtml"
        style={{ overflow: 'visible' }}
      >
        <div className="flex flex-col items-center" style={{ pointerEvents: 'auto' }}>
          <span
            className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-0.5 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600"
            onClick={handleTargetClick}
            title="Editar multiplicidad"
          >
            {tgtMult || ''}
          </span>
        </div>
      </foreignObject>
      {rel?.type === 'composition' && (
        <polygon
          points={
            dimOff.orient === 'h'
              ? `${tgtBorder.x + dimOff.dx - diamondSize},${tgtBorder.y + dimOff.dy} ${tgtBorder.x + dimOff.dx},${tgtBorder.y + dimOff.dy - diamondSize} ${tgtBorder.x + dimOff.dx + diamondSize},${tgtBorder.y + dimOff.dy} ${tgtBorder.x + dimOff.dx},${tgtBorder.y + dimOff.dy + diamondSize}`
              : `${tgtBorder.x + dimOff.dx},${tgtBorder.y + dimOff.dy - diamondSize} ${tgtBorder.x + dimOff.dx + diamondSize},${tgtBorder.y + dimOff.dy} ${tgtBorder.x + dimOff.dx},${tgtBorder.y + dimOff.dy + diamondSize} ${tgtBorder.x + dimOff.dx - diamondSize},${tgtBorder.y + dimOff.dy}`
          }
          fill="#dc2626" stroke="#dc2626" strokeWidth={2}
        />
      )}
      {rel?.type === 'aggregation' && (
        <polygon
          points={
            dimOff.orient === 'h'
              ? `${tgtBorder.x + dimOff.dx - diamondSize},${tgtBorder.y + dimOff.dy} ${tgtBorder.x + dimOff.dx},${tgtBorder.y + dimOff.dy - diamondSize} ${tgtBorder.x + dimOff.dx + diamondSize},${tgtBorder.y + dimOff.dy} ${tgtBorder.x + dimOff.dx},${tgtBorder.y + dimOff.dy + diamondSize}`
              : `${tgtBorder.x + dimOff.dx},${tgtBorder.y + dimOff.dy - diamondSize} ${tgtBorder.x + dimOff.dx + diamondSize},${tgtBorder.y + dimOff.dy} ${tgtBorder.x + dimOff.dx},${tgtBorder.y + dimOff.dy + diamondSize} ${tgtBorder.x + dimOff.dx - diamondSize},${tgtBorder.y + dimOff.dy}`
          }
          fill="white" stroke="#059669" strokeWidth={2}
        />
      )}
      {rel?.type === 'inheritance' && (
        <polygon
          points={`${tgtBorder.x - 12},${tgtBorder.y - 8} ${tgtBorder.x - 12},${tgtBorder.y + 8} ${tgtBorder.x},${tgtBorder.y}`}
          fill="white" stroke="#7c3aed" strokeWidth={2}
        />
      )}
      {(userLabel || isHovered) && (
        <foreignObject
          x={labelX - 40}
          y={labelY - 12}
          width={80}
          height={24}
          requiredExtensions="http://www.w3.org/1999/xhtml"
          style={{ overflow: 'visible' }}
        >
          <div className="flex items-center justify-center w-full h-full">
            {userLabel ? (
              <span
                className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 whitespace-nowrap cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600"
                onClick={() => {
                  const label = window.prompt('Editar etiqueta:', userLabel)
                  if (label !== null) updateLabel(id, label)
                }}
              >
                {userLabel}
              </span>
            ) : (
              <span
                className="w-5 h-5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-full shadow-sm hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-300 text-sm leading-none flex items-center justify-center cursor-pointer"
                onClick={() => {
                  const label = window.prompt('Añadir etiqueta:', '')
                  if (label !== null) updateLabel(id, label)
                }}
                title="Añadir etiqueta"
              >
                +
              </span>
            )}
          </div>
        </foreignObject>
      )}
      {editorAnchor && editingField && (
        <Portal>
          <div
            style={{
              position: 'fixed',
              left: editorAnchor.x,
              top: editorAnchor.y,
              zIndex: 9999,
            }}
          >
            <div onClick={e => e.stopPropagation()}>
              <MultiplicityEditor
                currentValue={editingField === 'source' ? srcMult : tgtMult}
                onSelect={val => {
                  updateMultiplicity(id, editingField === 'source' ? 'sourceMultiplicity' : 'targetMultiplicity', val)
                  setEditingField(null)
                }}
                onClose={() => setEditingField(null)}
              />
            </div>
          </div>
        </Portal>
      )}
    </g>
  )
}

function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true); return () => setMounted(false) }, [])
  if (!mounted) return null
  return createPortal(children, document.body)
}

export default memo(UmlStraightRelationshipEdge)
