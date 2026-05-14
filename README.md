<div align="center">
  <img src="public/favicon.svg" width="64" height="64" alt="SQLtoUML logo" />
  <h1>SQLtoUML</h1>
  <p>Convierte sentencias SQL <code>CREATE TABLE</code> en diagramas entidad-relación (DER/UML) de forma visual e interactiva.</p>
</div>

## Características

- ✏️ Editor SQL con resaltado
- 🔄 Generación automática de diagramas DER/UML
- 🏷️ Etiquetas y multiplicidades editables en las relaciones
- 🌙 Modo oscuro / claro
- 🔍 Zoom, pan y minimapa
- 📸 Exportar diagrama como PNG
- ↔️ Líneas rectas o curvas
- 🔗 Soporte para relaciones recursivas y M:N

## Cómo usar

1. Escribe sentencias `CREATE TABLE` con sus `FOREIGN KEY` en el panel izquierdo
2. Presiona **"Generar Diagrama"**
3. Las tablas se ordenan automáticamente con el layout ELK
4. Arrastra tablas para reordenarlas
5. Haz clic en las multiplicidades o etiquetas para editarlas

## Tecnologías

- **React** + **TypeScript**
- **React Flow** (renderizado del diagrama)
- **Tailwind CSS** (estilos)
- **ELK** (layout automático)
- **Vite** (bundler)

## Instalación

```bash
git clone https://github.com/HarryYanarico/SQLtoUML.git
cd SQLtoUML
npm install
npm run dev
```

## Licencia

[MIT](LICENSE)
