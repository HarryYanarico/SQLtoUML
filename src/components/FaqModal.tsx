
interface FaqModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function FaqModal({ isOpen, onClose }: FaqModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="faq-title"
    >
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <span className="text-xl">📘</span>
            <h2 id="faq-title" className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Guía y Preguntas Frecuentes (FAQ)
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar guía"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <section>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base mb-1">
              ¿Qué es SQL to UML y para qué sirve?
            </h3>
            <p>
              <strong>SQL to UML</strong> es una herramienta online gratuita diseñada para desarrolladores, diseñadores de bases de datos y estudiantes. Permite transformar sentencias SQL <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 font-mono text-xs">CREATE TABLE</code> en diagramas entidad-relación (DER) y diagramas de clases UML de forma visual, editable e interactiva.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base mb-1">
              ¿Cómo generar un diagrama a partir de mi código SQL?
            </h3>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Pega tus sentencias de creación de tablas en el editor izquierdo.</li>
              <li>Asegúrate de definir las claves primarias (<code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-700 font-mono text-xs">PRIMARY KEY</code>) y claves foráneas (<code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-700 font-mono text-xs">FOREIGN KEY (...) REFERENCES ...</code>).</li>
              <li>Presiona el botón <strong>"Generar Diagrama"</strong>. Las tablas se organizarán automáticamente mediante el algoritmo de diseño ELK.</li>
              <li>Puedes arrastrar tablas, alternar entre líneas rectas y curvas, o editar las multiplicidades haciendo clic sobre ellas.</li>
            </ol>
          </section>

          <section>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base mb-1">
              ¿Qué dialectos SQL son compatibles?
            </h3>
            <p>
              El motor soporta la sintaxis estándar ANSI SQL, siendo totalmente compatible con sentencias de <strong>PostgreSQL, MySQL, MariaDB, SQLite y SQL Server (T-SQL)</strong>. Soporta tipos de datos comunes, restricciones <code className="font-mono text-xs">NOT NULL</code>, <code className="font-mono text-xs">UNIQUE</code>, valores <code className="font-mono text-xs">DEFAULT</code> y acciones como <code className="font-mono text-xs">ON DELETE CASCADE</code>.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base mb-1">
              ¿Mis datos o consultas SQL se guardan en algún servidor?
            </h3>
            <p>
              <strong>No.</strong> Todo el procesamiento del código SQL, cálculo de relaciones y generación gráfica se ejecuta <strong>100% de manera local en tu navegador</strong>. Tu esquema de base de datos nunca viaja a ningún servidor externo, garantizando total privacidad y seguridad.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base mb-1">
              ¿Cómo exportar el diagrama?
            </h3>
            <p>
              Simplemente presiona el botón <strong>"Exportar PNG"</strong> ubicado en la parte inferior del editor para descargar una imagen en alta definición de tu diagrama de base de datos, lista para incluir en tu documentación técnica o presentaciones.
            </p>
          </section>
        </div>

        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}
