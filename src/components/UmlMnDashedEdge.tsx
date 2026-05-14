import { memo, useState } from 'react'
import { BaseEdge, EdgeProps, useStore } from '@xyflow/react'
import { UmlMnDashedData } from '../types/uml'
import { useEdgeLabelContext } from '../contexts/EdgeLabelContext'

function UmlMnDashedEdge({
  id,
  source,
  sourceX,
  sourceY,
  data,
}: EdgeProps) {
  const { updateLabel } = useEdgeLabelContext()
  const [isHovered, setIsHovered] = useState(false)
  const mnData = data as UmlMnDashedData | undefined
  const [parentA, parentB] = mnData?.parentTables ?? ['', '']

  const junctionCenter = useStore(s => {
    const node = s.nodeLookup.get(source)
    if (!node) return null
    const { width = 0, height = 0 } = node.measured ?? {}
    return { x: node.position.x + width / 2, y: node.position.y + height / 2 }
  })

  const paCenter = useStore(s => {
    const node = s.nodeLookup.get(parentA)
    if (!node) return null
    const { width = 0, height = 0 } = node.measured ?? {}
    return { x: node.position.x + width / 2, y: node.position.y + height / 2 }
  })

  const pbCenter = useStore(s => {
    const node = s.nodeLookup.get(parentB)
    if (!node) return null
    const { width = 0, height = 0 } = node.measured ?? {}
    return { x: node.position.x + width / 2, y: node.position.y + height / 2 }
  })

  const jx = junctionCenter?.x ?? sourceX
  const jy = junctionCenter?.y ?? sourceY

  const mx = paCenter && pbCenter ? (paCenter.x + pbCenter.x) / 2 : jx
  const my = paCenter && pbCenter ? (paCenter.y + pbCenter.y) / 2 : jy

  const edgePath = `M ${jx} ${jy} L ${mx} ${my}`

  const midX = (jx + mx) / 2
  const midY = (jy + my) / 2
  const userLabel = (data as Record<string, unknown>)?.userLabel as string | undefined

  return (
    <g onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: '#f59e0b',
          strokeWidth: 2,
          strokeDasharray: '6,4',
        }}
        interactionWidth={20}
      />
      {(userLabel || isHovered) && (
        <foreignObject
          x={midX - 40}
          y={midY - 30}
          width={80}
          height={24}
          requiredExtensions="http://www.w3.org/1999/xhtml"
          style={{ overflow: 'visible' }}
        >
          <div className="flex items-center justify-center w-full h-full">
            {userLabel ? (
              <span
                className="bg-slate-100 px-1.5 py-0.5 rounded text-xs text-slate-600 border border-slate-200 whitespace-nowrap cursor-pointer hover:bg-slate-200"
                onClick={() => {
                  const label = window.prompt('Editar etiqueta:', userLabel)
                  if (label !== null) updateLabel(id, label)
                }}
              >
                {userLabel}
              </span>
            ) : (
              <span
                className="w-5 h-5 bg-white border border-slate-300 rounded-full shadow-sm hover:bg-slate-100 text-slate-500 text-sm leading-none flex items-center justify-center cursor-pointer"
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
    </g>
  )
}

export default memo(UmlMnDashedEdge)
