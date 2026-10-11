import { SqlTable, SqlColumn, SqlForeignKey } from '../types/uml'

function normalizeSql(sql: string): string {
  return sql
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseColumnDefinition(colStr: string): { column: SqlColumn | null; inlineFk: SqlForeignKey | null } {
  const match = colStr.match(/^(\w+)\s+(\w+(?:\([^)]*\))?)/i)
  if (!match) {
    return { column: null, inlineFk: null }
  }

  const name = match[1]
  const type = match[2].toUpperCase()

  const isPrimaryKey = /PRIMARY\s+KEY/i.test(colStr) ||
    /PRIMARY_KEY/i.test(colStr) ||
    colStr.toUpperCase().includes('PRIMARY KEY')
  const isNullable = !/NOT\s+NULL/i.test(colStr) || /PRIMARY\s+KEY/i.test(colStr)
  const isUnique = /UNIQUE/i.test(colStr)

  let defaultValue: string | undefined
  const defaultMatch = colStr.match(/DEFAULT\s+(?:('[^']*')|([\w]+(?:\([^)]*\))))/i)
  if (defaultMatch) {
    defaultValue = (defaultMatch[1] || defaultMatch[2])?.replace(/['"]+/g, '')
  }

  let inlineFk: SqlForeignKey | null = null
  const refMatch = colStr.match(/REFERENCES\s+(\w+)\s*\(\s*(\w+)\s*\)/i)
  if (refMatch) {
    let onDelete: string | undefined
    let onUpdate: string | undefined
    const deleteMatch = colStr.match(/ON\s+DELETE\s+(\w+(?:\s+\w+)?)/i)
    if (deleteMatch) onDelete = deleteMatch[1]
    const updateMatch = colStr.match(/ON\s+UPDATE\s+(\w+(?:\s+\w+)?)/i)
    if (updateMatch) onUpdate = updateMatch[1]

    inlineFk = {
      columnName: name,
      referencedTable: refMatch[1],
      referencedColumn: refMatch[2],
      onDelete,
      onUpdate
    }
  }

  return {
    column: {
      name,
      type,
      isPrimaryKey,
      isNullable: !isPrimaryKey && isNullable,
      isUnique,
      defaultValue
    },
    inlineFk
  }
}

function parseForeignKey(fkStr: string): SqlForeignKey | null {
  const match = fkStr.match(/FOREIGN\s+KEY\s*\(\s*(\w+)\s*\)\s*REFERENCES\s+(\w+)\s*\(\s*(\w+)\s*\)/i)
  if (!match) return null

  let onDelete: string | undefined
  let onUpdate: string | undefined

  const deleteMatch = fkStr.match(/ON\s+DELETE\s+(\w+)/i)
  if (deleteMatch) onDelete = deleteMatch[1]

  const updateMatch = fkStr.match(/ON\s+UPDATE\s+(\w+)/i)
  if (updateMatch) onUpdate = updateMatch[1]

  return {
    columnName: match[1],
    referencedTable: match[2],
    referencedColumn: match[3],
    onDelete,
    onUpdate
  }
}

function parseCreateTable(stmt: string): SqlTable | null {
  const match = stmt.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s*\(([\s\S]+)\)/i)
  if (!match) return null

  const tableName = match[1]
  const body = match[2]

  const parts = body.split(/,(?![^(]*\))/).map(p => p.trim())

  const columns: SqlColumn[] = []
  const foreignKeys: SqlForeignKey[] = []
  let primaryKeys: string[] = []

  for (const part of parts) {
    if (/^(?:CONSTRAINT\s+\w+\s+)?PRIMARY\s+KEY/i.test(part)) {
      const pkMatch = part.match(/PRIMARY\s+KEY\s*\(([^)]+)\)/i)
      if (pkMatch) {
        primaryKeys = pkMatch[1].split(',').map(k => k.trim().replace(/[`"]/g, ''))
      }
    } else if (/FOREIGN\s+KEY/i.test(part)) {
      const fk = parseForeignKey(part)
      if (fk) foreignKeys.push(fk)
    } else if (/^(?:KEY|INDEX|CONSTRAINT|UNIQUE|FULLTEXT|SPATIAL|CHECK)\b/i.test(part)) {
      // Skip standalone constraints
    } else if (/^\w/.test(part)) {
      const result = parseColumnDefinition(part)
      if (result.column) columns.push(result.column)
      if (result.inlineFk) {
        foreignKeys.push(result.inlineFk)
      }
    }
  }

  for (const pk of primaryKeys) {
    const col = columns.find(c => c.name.toLowerCase() === pk.toLowerCase())
    if (col) {
      col.isPrimaryKey = true
      col.isNullable = false
    }
  }

  const isJunctionTable = foreignKeys.length >= 2 &&
    foreignKeys.every(fk => {
      const otherFks = foreignKeys.filter(f => f !== fk)
      return otherFks.every(of => of.referencedTable !== fk.referencedTable)
    })

  return {
    name: tableName,
    columns,
    foreignKeys,
    isJunctionTable
  }
}

function parseAlterTable(stmt: string, tables: Map<string, SqlTable>): SqlTable | null {
  const addColumnMatch = stmt.match(/ALTER\s+TABLE\s+(\w+)\s+ADD\s+(?:COLUMN\s+)?(.+)/i)
  if (addColumnMatch) {
    const tableName = addColumnMatch[1]
    const table = tables.get(tableName.toLowerCase())
    if (table) {
      const result = parseColumnDefinition(addColumnMatch[2])
      if (result.column) {
        table.columns.push(result.column)
        if (result.inlineFk) {
          table.foreignKeys.push(result.inlineFk)
        }
        return table
      }
    }
  }

  const dropColumnMatch = stmt.match(/ALTER\s+TABLE\s+(\w+)\s+DROP\s+(?:COLUMN\s+)?(\w+)/i)
  if (dropColumnMatch) {
    const tableName = dropColumnMatch[1]
    const table = tables.get(tableName.toLowerCase())
    if (table) {
      table.columns = table.columns.filter(c => c.name.toLowerCase() !== dropColumnMatch[2].toLowerCase())
      return table
    }
  }

  const addFkMatch = stmt.match(/ALTER\s+TABLE\s+(\w+)\s+ADD\s+(?:CONSTRAINT\s+\w+\s+)?FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+(\w+)\s*\(([^)]+)\)/i)
  if (addFkMatch) {
    const tableName = addFkMatch[1]
    const table = tables.get(tableName.toLowerCase())
    if (table) {
      table.foreignKeys.push({
        columnName: addFkMatch[2],
        referencedTable: addFkMatch[3],
        referencedColumn: addFkMatch[4]
      })
      return table
    }
  }

  const dropFkMatch = stmt.match(/ALTER\s+TABLE\s+(\w+)\s+DROP\s+FOREIGN\s+KEY\s+(\w+)/i)
  if (dropFkMatch) {
    const tableName = dropFkMatch[1]
    const table = tables.get(tableName.toLowerCase())
    if (table) {
      const constraintName = dropFkMatch[2].toLowerCase()
      table.foreignKeys = table.foreignKeys.filter(fk => {
        const fkConstraintName = `fk_${fk.columnName}_${fk.referencedTable}`.toLowerCase()
        return fkConstraintName !== constraintName && fk.columnName.toLowerCase() !== constraintName
      })
      return table
    }
  }

  return null
}

function parseDropTable(stmt: string, tables: Map<string, SqlTable>): string | null {
  const match = stmt.match(/DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?(\w+)/i)
  if (match) {
    const tableName = match[1].toLowerCase()
    tables.delete(tableName)
    return tableName
  }
  return null
}

export function parseSql(sql: string): SqlTable[] {
  const normalized = normalizeSql(sql)
  const statements = normalized.split(/;/).filter(s => s.trim())

  const tables = new Map<string, SqlTable>()

  for (const stmt of statements) {
    const trimmed = stmt.trim()
    if (!trimmed) continue

    if (/^CREATE\s+TABLE/i.test(trimmed)) {
      const table = parseCreateTable(trimmed)
      if (table) {
        tables.set(table.name.toLowerCase(), table)
      }
    } else if (/^ALTER\s+TABLE/i.test(trimmed)) {
      parseAlterTable(trimmed, tables)
    } else if (/^DROP\s+TABLE/i.test(trimmed)) {
      parseDropTable(trimmed, tables)
    }
  }

  return Array.from(tables.values())
}