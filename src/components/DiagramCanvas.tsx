import { forwardRef, useImperativeHandle, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  ReactFlowProvider
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import UmlClassNode from './UmlClassNode'
import UmlRelationshipEdge from './UmlRelationshipEdge'
import UmlStraightRelationshipEdge from './UmlStraightRelationshipEdge'
import UmlMnDirectEdge from './UmlMnDirectEdge'
import UmlMnDashedEdge from './UmlMnDashedEdge'
import UmlRecursiveEdge from './UmlRecursiveEdge'
import EdgeLabelContext from '../contexts/EdgeLabelContext'

const nodeTypes = {
  umlClass: UmlClassNode
}

const edgeTypes = {
  umlRelationship: UmlRelationshipEdge,
  umlStraightRelationship: UmlStraightRelationshipEdge,
  mnDirect: UmlMnDirectEdge,
  mnDashed: UmlMnDashedEdge,
  recursive: UmlRecursiveEdge
}

interface DiagramCanvasProps {
  nodes: Node[]
  edges: Edge[]
  onNodesChange: (changes: unknown) => void
  onEdgesChange: (changes: unknown) => void
  useStraightLines?: boolean
  onUpdateEdgeLabel?: (edgeId: string, label: string) => void
  onUpdateMultiplicity?: (edgeId: string, field: 'sourceMultiplicity' | 'targetMultiplicity', value: string) => void
}

export interface DiagramCanvasRef {
  captureDiagram: () => Promise<string>
}

const DiagramCanvas = forwardRef<DiagramCanvasRef, DiagramCanvasProps>(
  function DiagramCanvas({ nodes, edges, onNodesChange, onEdgesChange, useStraightLines = false, onUpdateEdgeLabel, onUpdateMultiplicity }, ref) {
    const reactFlowWrapper = useRef<HTMLDivElement>(null)
    const reactFlowInstance = useRef<unknown>(null)

    useImperativeHandle(ref, () => ({
      captureDiagram: async () => {
        const instance = reactFlowInstance.current as { fitView: (opts?: { padding: number; duration: number }) => void; getViewport: () => { x: number; y: number; zoom: number }; setViewport: (vp: { x: number; y: number; zoom: number }) => void } | null
        if (!instance) return ''

        const prevViewport = instance.getViewport()

        instance.fitView({ padding: 0.2, duration: 0 })
        await new Promise(r => setTimeout(r, 50))

        const element = reactFlowWrapper.current?.querySelector('.react-flow__viewport') as HTMLElement | null
        if (!element) return ''

        try {
          const { toPng } = await import('html-to-image')
          const dataUrl = await toPng(element, {
            backgroundColor: '#ffffff',
            pixelRatio: 2,
            filter: (node) => {
              if (node?.classList?.contains('react-flow__minimap')) return false
              if (node?.classList?.contains('react-flow__controls')) return false
              return true
            }
          })
          instance.setViewport(prevViewport)
          return dataUrl
        } catch (error) {
          console.error('Error capturing diagram:', error)
          instance.setViewport(prevViewport)
          return ''
        }
      }
    }))

    const displayEdges = edges.map(edge => {
      if (edge.type === 'umlRelationship') {
        return {
          ...edge,
          type: useStraightLines ? 'umlStraightRelationship' : 'umlRelationship'
        }
      }
      return edge
    })

    return (
      <ReactFlowProvider>
        <div ref={reactFlowWrapper} className="w-full h-full">
          <EdgeLabelContext.Provider value={{ updateLabel: onUpdateEdgeLabel ?? (() => {}), updateMultiplicity: onUpdateMultiplicity ?? (() => {}) }}>
          <ReactFlow
            nodes={nodes}
            edges={displayEdges}
            onNodesChange={onNodesChange as never}
            onEdgesChange={onEdgesChange as never}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            onInit={(instance) => { reactFlowInstance.current = instance }}
            className="bg-slate-50 dark:bg-slate-900"
          >
            <Background color="#cbd5e1" gap={20} />
            <Controls className="!bg-white dark:!bg-slate-700 !border-slate-200 dark:!border-slate-600 !shadow-md [&_button]:dark:text-slate-200" />
            <MiniMap
              nodeColor="#e2e8f0"
              maskColor="rgba(248, 250, 252, 0.8)"
              className="!bg-white dark:!bg-slate-700 !border-slate-200 dark:!border-slate-600 !shadow-md"
            />
          </ReactFlow>
          </EdgeLabelContext.Provider>
        </div>
      </ReactFlowProvider>
    )
  }
)

export default DiagramCanvas