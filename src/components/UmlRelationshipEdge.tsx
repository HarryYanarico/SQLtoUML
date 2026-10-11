import { memo, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { BaseEdge, EdgeProps, getBezierPath, useStore } from '@xyflow/react'
import { UmlRelationship } from '../types/uml'
import { useEdgeLabelContext } from '../contexts/EdgeLabelContext'
import MultiplicityEditor from './MultiplicityEditor'
import { NODE_DEFAULTS, getBorderPoint, borderToPosition, multiplicityOffset, diamondOffset, sanitizeLabel } from '../utils/edgeGeometry'

function UmlRelationshipEdge({
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

  const srcPos = borderToPosition(srcBorder, srcNode.x, srcNode.y, srcNode.w, srcNode.h)
  const tgtPos = borderToPosition(tgtBorder, tgtNode.x, tgtNode.y, tgtNode.w, tgtNode.h)

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: cx1,
    sourceY: cy1,
    sourcePosition: srcPos,
    targetX: cx2,
    targetY: cy2,
    targetPosition: tgtPos
  })

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

  const handleEditLabel = () => {
    const label = sanitizeLabel(window.prompt('Editar etiqueta:', userLabel))
    if (label !== null) updateLabel(id, label)
  }

  const handleAddLabel = () => {
    const label = sanitizeLabel(window.prompt('Añadir etiqueta:', ''))
    if (label !== null) updateLabel(id, label)
  }

  const diamondSize = 6

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
                onClick={handleEditLabel}
              >
                {userLabel}
              </span>
            ) : (
              <span
                className="w-5 h-5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-full shadow-sm hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-300 text-sm leading-none flex items-center justify-center cursor-pointer"
                onClick={handleAddLabel}
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

export default memo(UmlRelationshipEdge)
