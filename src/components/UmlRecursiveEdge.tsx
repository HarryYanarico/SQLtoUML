import { memo, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { BaseEdge, EdgeProps, useStore, MarkerType } from '@xyflow/react'
import { SqlColumn, UmlRelationship } from '../types/uml'
import { useEdgeLabelContext } from '../contexts/EdgeLabelContext'
import MultiplicityEditor from './MultiplicityEditor'

const FALLBACK_W = 260
const FALLBACK_H = 80

function UmlRecursiveEdge({
  id,
  source,
  data,
}: EdgeProps) {
  const rel = data as UmlRelationship | undefined
  const { updateLabel, updateMultiplicity } = useEdgeLabelContext()
  const [isHovered, setIsHovered] = useState(false)
  const [editingField, setEditingField] = useState<'source' | 'target' | null>(null)
  const [editorAnchor, setEditorAnchor] = useState<{ x: number; y: number } | null>(null)

  const nodeInfo = useStore(s => {
    const node = s.nodeLookup.get(source)
    if (!node) return null
    const { width = FALLBACK_W, height = FALLBACK_H } = node.measured ?? {}
    const columns = (node.data as Record<string, unknown>)?.columns as SqlColumn[] | undefined
    return { x: node.position.x, y: node.position.y, width, height, columns: columns ?? [] }
  })

  useEffect(() => {
    if (!editingField) setEditorAnchor(null)
  }, [editingField])

  if (!nodeInfo) return null

  const { x, y, width, height, columns } = nodeInfo

  const pkIndex = columns.findIndex(c => c.isPrimaryKey)
  const headerH = 36
  const padTop = 8
  const rowH = 20

  const srcY = y + headerH + padTop + pkIndex * rowH + rowH / 2
  const rightX = x + width
  const bottomY = y + height
  const centerX = x + width / 2
  const offset = 50

  const edgePath = `M ${rightX} ${srcY} L ${rightX + offset} ${srcY} L ${rightX + offset} ${bottomY + offset} L ${centerX} ${bottomY + offset} L ${centerX} ${bottomY}`

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

  return (
    <g onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{ stroke: '#64748b', strokeWidth: 2 }}
        markerEnd={MarkerType.ArrowClosed}
        interactionWidth={20}
      />
      <foreignObject
        x={rightX + 6}
        y={srcY - 10}
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
        x={centerX - 30}
        y={bottomY + 2}
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
      {(userLabel || isHovered) && (
        <foreignObject
          x={rightX + offset + 4}
          y={srcY + (bottomY + offset - srcY) / 2 - 10}
          width={60}
          height={20}
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

export default memo(UmlRecursiveEdge)
