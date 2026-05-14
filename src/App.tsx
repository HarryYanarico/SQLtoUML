import { useState, useCallback, useRef, useEffect } from 'react'
import { useNodesState, useEdgesState } from '@xyflow/react'
import SqlEditor from './components/SqlEditor'
import DiagramCanvas, { DiagramCanvasRef } from './components/DiagramCanvas'
import { parseSql } from './parsers/sqlParser'
import { sqlToUml } from './converters/sqlToUml'
import { getLayoutedElements } from './utils/elkLayout'

const defaultSql = `-- Ejemplo de SQL con relaciones
CREATE TABLE cliente (
  id INT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE,
  telefono VARCHAR(20),
  fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pedido (
  id INT PRIMARY KEY,
  cliente_id INT NOT NULL,
  fecha_pedido DATETIME NOT NULL,
  total DECIMAL(10,2),
  estado VARCHAR(20) DEFAULT 'pendiente',
  FOREIGN KEY (cliente_id) REFERENCES cliente(id) ON DELETE CASCADE
);

CREATE TABLE producto (
  id INT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10,2) NOT NULL,
  stock INT DEFAULT 0
);

CREATE TABLE pedidos_producto (
  pedido_id INT NOT NULL,
  producto_id INT NOT NULL,
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (pedido_id, producto_id),
  FOREIGN KEY (pedido_id) REFERENCES pedido(id) ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES producto(id)
);

CREATE TABLE categoria (
  id INT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  padre_id INT,
  FOREIGN KEY (padre_id) REFERENCES categoria(id)
);`

export default function App() {
  const [sql, setSql] = useState(defaultSql)
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [useStraightLines, setUseStraightLines] = useState(false)
  const [panelVisible, setPanelVisible] = useState(true)
  const [fontScale, setFontScale] = useState(1)
  const [darkMode, setDarkMode] = useState(false)
  const diagramRef = useRef<DiagramCanvasRef>(null)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  useEffect(() => {
    setNodes(nds => nds.map(n => ({
      ...n,
      data: { ...n.data, fontScale }
    })))
  }, [fontScale])

  const handleParse = useCallback(() => {
    try {
      const tables = parseSql(sql)
      if (tables.length === 0) {
        alert('No se encontraron tablas en el SQL proporcionado')
        return
      }

      const { nodes: umlNodes, edges: umlEdges } = sqlToUml(tables)

      const catNode = umlNodes.find(n => n.id.toLowerCase() === 'categoria')
      if (catNode) {
        const data = catNode.data as Record<string, unknown>
        console.log('Nodo categoria:', data.name, 'cols:', data.columns)
      }

      const layouted = getLayoutedElements(umlNodes, umlEdges)

      setNodes([...layouted.nodes] as never[])
      setEdges([...layouted.edges] as never[])
    } catch (error) {
      console.error('Error parsing SQL:', error)
      alert('Error al procesar el SQL')
    }
  }, [sql, setNodes, setEdges])

  const handleUpdateEdgeLabel = useCallback((edgeId: string, label: string) => {
    setEdges(eds => eds.map(e =>
      e.id === edgeId
        ? { ...e, data: { ...e.data, userLabel: label } }
        : e
    ))
  }, [setEdges])

  const handleUpdateMultiplicity = useCallback((edgeId: string, field: 'sourceMultiplicity' | 'targetMultiplicity', value: string) => {
    setEdges(eds => eds.map(e =>
      e.id === edgeId
        ? { ...e, data: { ...e.data, [field === 'sourceMultiplicity' ? 'userSourceMultiplicity' : 'userTargetMultiplicity']: value } }
        : e
    ))
  }, [setEdges])

  const handleExport = useCallback(async () => {
    const dataUrl = await diagramRef.current?.captureDiagram()
    if (!dataUrl) {
      alert('Error al generar la imagen')
      return
    }

    const link = document.createElement('a')
    link.download = 'diagrama-uml.png'
    link.href = dataUrl
    link.click()
  }, [])

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <div
        className="flex flex-col border-r border-slate-300 transition-all duration-300 overflow-hidden"
        style={{
          width: panelVisible ? '33.333%' : '0px',
          minWidth: panelVisible ? '300px' : '0px',
          maxWidth: panelVisible ? '500px' : '0px',
        }}
      >
        <SqlEditor
          value={sql}
          onChange={setSql}
          onParse={handleParse}
          onExport={handleExport}
          onToggleLineStyle={setUseStraightLines}
          useStraightLines={useStraightLines}
        />
      </div>

      <button
        onClick={() => setPanelVisible(v => !v)}
        className="flex-shrink-0 w-6 bg-slate-100 hover:bg-slate-200 border-r border-slate-300 flex items-center justify-center cursor-pointer transition-colors z-10"
        title={panelVisible ? 'Ocultar panel' : 'Mostrar panel'}
      >
        <svg
          className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${panelVisible ? '' : 'rotate-180'}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="flex-1 bg-slate-100 flex flex-col relative">
        <button
          onClick={() => setDarkMode(v => !v)}
          className="absolute top-2 right-2 z-30 px-2.5 py-1.5 text-xs rounded transition-colors bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300"
          title={darkMode ? 'Modo claro' : 'Modo oscuro'}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
        {nodes.length > 0 && (
          <div className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 z-20">
            <span className="text-xs text-slate-500 dark:text-slate-400 mr-1">Texto:</span>
            {[1, 1.25].map(s => (
              <button
                key={s}
                onClick={() => setFontScale(s)}
                className={`px-2 py-1 text-xs rounded transition-colors ${fontScale === s ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
              >
                A{s > 1 ? '+' : ''}
              </button>
            ))}
            {fontScale !== 1 && (
              <button
                onClick={() => setFontScale(1)}
                className="px-2 py-1 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
              >
                Normal
              </button>
            )}
          </div>
        )}
        {nodes.length > 0 ? (
          <div className="flex-1">
            <DiagramCanvas
              ref={diagramRef}
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange as never}
              onEdgesChange={onEdgesChange as never}
              useStraightLines={useStraightLines}
              onUpdateEdgeLabel={handleUpdateEdgeLabel}
              onUpdateMultiplicity={handleUpdateMultiplicity}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              <p className="text-lg">Escribe tu SQL y presiona "Generar Diagrama"</p>
              <p className="text-sm mt-2">El diagrama UML se mostrará aquí</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}