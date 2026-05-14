import { Node, Edge } from '@xyflow/react'
import { SqlTable, SqlForeignKey, UmlRelationship, UmlRelationshipType } from '../types/uml'

function getColumnMultiplicity(table: SqlTable, fk: SqlForeignKey): string {
  const col = table.columns.find(c => c.name.toLowerCase() === fk.columnName.toLowerCase())
  if (!col) return '0..*'

  if (col.isUnique && !col.isNullable) return '1'
  if (col.isUnique) return '0..1'
  if (!col.isNullable) return '1..*'
  return '0..*'
}

function getReferencedMultiplicity(_tables: SqlTable[], _referencedTableName: string, _fk: SqlForeignKey): string {
  return '1'
}

function determineRelationshipType(_table: SqlTable, _fk: SqlForeignKey): UmlRelationshipType {
  return 'association'
}

export function sqlToUml(tables: SqlTable[]): { nodes: Node[]; edges: Edge[] } {
  for (const table of tables) {
    const fkNames = new Set(table.foreignKeys.map(fk => fk.columnName.toLowerCase()))
    for (const col of table.columns) {
      col.isForeignKey = fkNames.has(col.name.toLowerCase())
    }
    const nonFk = table.columns.filter(c => !fkNames.has(c.name.toLowerCase()))
    const pkCols = nonFk.filter(c => c.isPrimaryKey)
    const otherCols = nonFk.filter(c => !c.isPrimaryKey)
    const fkCols = table.columns.filter(c => fkNames.has(c.name.toLowerCase()))
    table.columns = [...pkCols, ...otherCols, ...fkCols]
  }

  const nodes: Node[] = []
  const edges: Edge[] = []

  for (const table of tables) {
    nodes.push({
      id: table.name,
      type: 'umlClass',
      position: { x: 0, y: 0 },
      data: {
        id: table.name,
        name: table.name,
        columns: table.columns,
        isJunctionTable: table.isJunctionTable,
        label: table.name
      }
    })
  }

  const relationships: UmlRelationship[] = []
  let edgeId = 0

  const junctionTables = tables.filter(t => t.isJunctionTable)
  const junctionParentMap = new Map<string, string[]>()

  for (const jt of junctionTables) {
    const parents = [...new Set(jt.foreignKeys.map(fk => fk.referencedTable))]
    if (parents.length === 2) {
      junctionParentMap.set(jt.name, parents)
    }
  }

  const isJunctionFk = (tableName: string, refTable: string) =>
    junctionTables.some(jt => jt.name === tableName) ||
    [...junctionParentMap.entries()].some(
      ([, parents]) => parents.includes(tableName) && parents.includes(refTable)
    )

  for (const table of tables) {
    for (const fk of table.foreignKeys) {
      if (isJunctionFk(table.name, fk.referencedTable)) continue

      if (table.name.toLowerCase() === fk.referencedTable.toLowerCase()) {
        relationships.push({
          id: `edge-recursive-${edgeId++}`,
          source: table.name,
          target: table.name,
          type: 'recursive',
          sourceMultiplicity: getColumnMultiplicity(table, fk),
          targetMultiplicity: getReferencedMultiplicity(tables, table.name, fk),
          label: fk.columnName
        })
        continue
      }

      const existingRel = relationships.find(
        r => r.source === table.name && r.target === fk.referencedTable
      )
      if (existingRel) continue

      const relationship: UmlRelationship = {
        id: `edge-${edgeId++}`,
        source: table.name,
        target: fk.referencedTable,
        type: determineRelationshipType(table, fk),
        sourceMultiplicity: getColumnMultiplicity(table, fk),
        targetMultiplicity: getReferencedMultiplicity(tables, fk.referencedTable, fk),
        label: fk.columnName
      }
      relationships.push(relationship)
    }
  }

  for (const [junctionName, parents] of junctionParentMap) {
    const [parentA, parentB] = parents

    relationships.push({
      id: `mn-direct-${junctionName}`,
      source: parentA,
      target: parentB,
      type: 'mnDirect',
      sourceMultiplicity: '',
      targetMultiplicity: '',
      label: 'M:N'
    })

    relationships.push({
      id: `mn-dashed-${junctionName}`,
      source: junctionName,
      target: parentA,
      type: 'mnDashed',
      sourceMultiplicity: '',
      targetMultiplicity: '',
      label: ''
    })
  }

  for (const rel of relationships) {
    const edgeData: Record<string, unknown> = {
      ...rel
    }

    if (rel.type === 'mnDashed') {
      const entry = [...junctionParentMap.entries()].find(([name]) => name === rel.source)
      if (entry) {
        edgeData.parentTables = entry[1]
        edgeData.junctionTable = entry[0]
      }
    }

    edges.push({
      id: rel.id,
      source: rel.source,
      target: rel.target,
      type: rel.type === 'mnDirect' ? 'mnDirect' :
            rel.type === 'mnDashed' ? 'mnDashed' :
            rel.type === 'recursive' ? 'recursive' :
            'umlRelationship',
      data: edgeData
    })
  }

  return { nodes, edges }
}