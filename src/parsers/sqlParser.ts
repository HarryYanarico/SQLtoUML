import { SqlTable, SqlColumn, SqlForeignKey } from '../types/uml'

function normalizeSql(sql: string): string {
  return sql
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseColumnDefinition(colStr: string): SqlColumn | null {
  const match = colStr.match(/^(\w+)\s+(\w+(?:\([^)]+\))?)/i)
  if (!match) return null

  const name = match[1]
  const type = match[2].toUpperCase()

  const isPrimaryKey = /PRIMARY\s+KEY/i.test(colStr) ||
    /PRIMARY_KEY/i.test(colStr) ||  // Algunos generadores usan esto
    colStr.toUpperCase().includes('PRIMARY KEY')
  const isNullable = !/NOT\s+NULL/i.test(colStr) || /PRIMARY\s+KEY/i.test(colStr)
  const isUnique = /UNIQUE/i.test(colStr)

  let defaultValue: string | undefined
  const defaultMatch = colStr.match(/DEFAULT\s+('[^']*'|\w+)/i)
  if (defaultMatch) {
    defaultValue = defaultMatch[1]
  }

  return {
    name,
    type,
    isPrimaryKey,
    isNullable: !isPrimaryKey && isNullable,
    isUnique,
    defaultValue
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
      // Skip standalone constraints (only if they START the part)
    } else if (/^\w/.test(part)) {
      const col = parseColumnDefinition(part)
      if (col) columns.push(col)
    }
  }

  for (const pk of primaryKeys) {
    const col = columns.find(c => c.name.toLowerCase() === pk.toLowerCase())
    if (col) {
      col.isPrimaryKey = true
      col.isNullable = false  // Las PK nunca son NULL
    }
  }

  const isJunctionTable = foreignKeys.length >= 2 &&
    foreignKeys.every(fk => {
      const otherFks = foreignKeys.filter(f => f !== fk)
      return otherFks.every(of => of.referencedTable !== fk.referencedTable)
    })
  console.log('📋 Tabla parseada:', {
    name: tableName,
    columns: columns.map(c => ({
      name: c.name,
      isPrimaryKey: c.isPrimaryKey,
      isForeignKey: foreignKeys.some(fk => fk.columnName === c.name)
    }))
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
      const col = parseColumnDefinition(addColumnMatch[2])
      if (col) {
        table.columns.push(col)
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
      table.foreignKeys = table.foreignKeys.filter((_, i) => i !== parseInt(dropFkMatch[2]) - 1)
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
  console.log('🟢 parseSql ejecutándose, SQL recibido:', sql)
  const normalized = normalizeSql(sql)
  const statements = normalized.split(/;/).filter(s => s.trim())
  console.log('📊 Statements encontrados:', statements.length)

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