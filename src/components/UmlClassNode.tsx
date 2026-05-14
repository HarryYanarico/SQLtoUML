import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { SqlColumn } from '../types/uml'

interface UmlClassNodeData {
  id: string
  name: string
  columns: SqlColumn[]
  isJunctionTable: boolean
  label: string
}

const fontSizes = { name: 0.875, col: 0.75, badg: 0.6875, fkBadg: 0.5625 }

function UmlClassNode({ data }: NodeProps) {
  const { name, columns, isJunctionTable, fontScale = 1 } = data as unknown as UmlClassNodeData & { fontScale?: number }
  const s = (n: number) => `${n * fontScale}rem`

  return (
    <div className={`min-w-[260px] bg-white dark:bg-slate-800 rounded-lg shadow-lg border-2 overflow-hidden ${isJunctionTable ? 'border-amber-500 dark:border-amber-600' : 'border-slate-700 dark:border-slate-600'}`}>
      <Handle type="target" position={Position.Top} className="!bg-slate-700 dark:!bg-slate-400" />

      <div className={`px-3 py-2 border-b ${isJunctionTable ? 'bg-amber-100 dark:bg-amber-900' : 'bg-slate-100 dark:bg-slate-700'} ${isJunctionTable ? 'border-amber-300 dark:border-amber-700' : 'border-slate-300 dark:border-slate-600'}`}>
        <div className="font-bold text-center text-slate-800 dark:text-slate-100" style={{ fontSize: s(fontSizes.name) }}>{name}</div>
      </div>

      <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 max-h-[300px] overflow-y-auto">
        {columns && columns.length > 0 ? columns.map((col, idx) => (
          <div key={idx} className={`font-mono py-0.5 flex items-center flex-wrap gap-x-1 ${col.isPrimaryKey ? 'bg-blue-50 dark:bg-blue-900/40 -mx-3 px-3 rounded-none' : ''}`} style={{ fontSize: s(fontSizes.col) }}>
            <span className="text-slate-500 dark:text-slate-400 shrink-0 w-4 text-center">
              {col.isPrimaryKey ? '🔑' : col.isForeignKey ? '🔗' : col.isUnique ? '⚡' : '•'}
            </span>
            {col.isPrimaryKey && <span className="font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded leading-none" style={{ fontSize: s(fontSizes.badg) }}>PK</span>}
            {col.isForeignKey && <span className="font-bold bg-orange-500 text-white px-1 py-0.5 rounded leading-none" style={{ fontSize: s(fontSizes.fkBadg) }}>FK</span>}
            <span className="text-blue-700 dark:text-blue-300 font-semibold">{col.name}</span>
            <span className="text-slate-400 dark:text-slate-500">:</span>
            <span className="text-purple-700 dark:text-purple-300">{col.type}</span>
            {!col.isNullable && <span className="text-red-500 dark:text-red-400 ml-1">*</span>}
          </div>
        )) : <div className="text-red-500 font-bold" style={{ fontSize: s(fontSizes.col) }}>⚠️ Sin columnas</div>}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-slate-700 dark:!bg-slate-400" />
      <Handle type="source" position={Position.Right} className="!bg-slate-700 dark:!bg-slate-400" />
      <Handle type="target" position={Position.Left} className="!bg-slate-700 dark:!bg-slate-400" />
    </div>
  )
}

export default memo(UmlClassNode)
