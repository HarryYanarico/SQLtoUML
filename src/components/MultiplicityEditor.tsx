import { useState, useRef, useEffect } from 'react'

const OPTIONS = ['1..1', '0..1', '1..*', '*..*']

interface MultiplicityEditorProps {
  currentValue: string
  onSelect: (value: string) => void
  onClose: () => void
}

export default function MultiplicityEditor({ onSelect, onClose }: MultiplicityEditorProps) {
  const [custom, setCustom] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <div
      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-1.5 flex flex-col gap-1"
      style={{ minWidth: 140 }}
      onMouseDown={e => e.stopPropagation()}
    >
      <div className="flex gap-1">
        {OPTIONS.map(opt => (
          <button
            key={opt}
            className="px-1.5 py-0.5 text-xs rounded border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-mono cursor-pointer"
            onClick={() => onSelect(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
      <div className="flex gap-1">
        <input
          ref={inputRef}
          className="flex-1 px-1.5 py-0.5 text-xs border border-slate-200 dark:border-slate-600 rounded outline-none focus:border-slate-400 dark:bg-slate-700 dark:text-slate-200 font-mono"
          placeholder="custom..."
          value={custom}
          onChange={e => setCustom(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && custom.trim()) {
              onSelect(custom.trim())
            }
            if (e.key === 'Escape') {
              onClose()
            }
          }}
        />
        {custom.trim() && (
          <button
            className="px-1.5 py-0.5 text-xs rounded bg-slate-700 dark:bg-slate-600 text-white hover:bg-slate-800 dark:hover:bg-slate-500 cursor-pointer"
            onClick={() => onSelect(custom.trim())}
          >
            OK
          </button>
        )}
      </div>
    </div>
  )
}
