import { useState, useEffect } from 'react'

interface SqlEditorProps {
  value: string
  onChange: (value: string) => void
  onParse: () => void
  onExport: () => void
  onToggleLineStyle: (useStraightLines: boolean) => void
  useStraightLines?: boolean
  onOpenFaq?: () => void
}

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

export default function SqlEditor({
  value,
  onChange,
  onParse,
  onExport,
  onToggleLineStyle,
  useStraightLines = false,
  onOpenFaq
}: SqlEditorProps) {
  const [localValue, setLocalValue] = useState(value)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalValue(e.target.value)
    onChange(e.target.value)
  }

  const handleLoadSample = () => {
    setLocalValue(defaultSql)
    onChange(defaultSql)
  }

  const handleToggleLineStyle = () => {
    onToggleLineStyle(!useStraightLines)
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/70">
        <div className="flex items-center gap-2 min-w-0">
          <img src="favicon.svg" alt="Logo de SQL to UML" className="w-5 h-5 flex-shrink-0" />
          <div className="min-w-0">
            <h1 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate">
              SQL to UML
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block leading-none">
              Generador DER
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {onOpenFaq && (
            <button
              onClick={onOpenFaq}
              title="Guía y Preguntas Frecuentes"
              aria-label="Abrir guía de ayuda y preguntas frecuentes"
              className="px-2 py-1 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors font-medium flex items-center gap-1"
            >
              <span>Ayuda</span>
            </button>
          )}
          <button
            onClick={handleLoadSample}
            aria-label="Cargar ejemplo de SQL"
            className="px-2.5 py-1 text-xs bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 rounded transition-colors"
          >
            Ejemplo
          </button>
          <button
            onClick={onParse}
            aria-label="Generar diagrama UML"
            className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors font-medium shadow-sm"
          >
            Generar Diagrama
          </button>
        </div>
      </div>

      <textarea
        value={localValue}
        onChange={handleChange}
        className="flex-1 w-full p-4 font-mono text-sm bg-slate-900 dark:bg-slate-950 text-slate-100 resize-none focus:outline-none"
        placeholder="Escribe tus sentencias SQL aquí..."
        spellCheck={false}
      />

        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Soporta: CREATE TABLE, ALTER TABLE, DROP TABLE
            </span>
            <button
              onClick={handleToggleLineStyle}
              className="px-3 py-1.5 text-sm bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 rounded transition-colors font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              {useStraightLines ? 'Líneas Curvas' : 'Líneas Rectas'}
            </button>
          </div>
          <button
            onClick={onExport}
            className="px-3 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors font-medium flex items-center gap-1"
          >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Exportar PNG
        </button>
      </div>
    </div>
  )
}