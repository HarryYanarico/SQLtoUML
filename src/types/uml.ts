export interface SqlColumn {
  name: string
  type: string
  isPrimaryKey: boolean
  isForeignKey?: boolean
  isNullable: boolean
  isUnique: boolean
  defaultValue?: string
}

export interface SqlTable {
  name: string
  columns: SqlColumn[]
  foreignKeys: SqlForeignKey[]
  isJunctionTable: boolean
}

export interface SqlForeignKey {
  columnName: string
  referencedTable: string
  referencedColumn: string
  onDelete?: string
  onUpdate?: string
}

export type UmlRelationshipType =
  | 'association'
  | 'aggregation'
  | 'composition'
  | 'inheritance'
  | 'dependency'
  | 'mnDirect'
  | 'mnDashed'
  | 'recursive'

export interface UmlRelationship {
  id: string
  source: string
  target: string
  type: UmlRelationshipType
  sourceMultiplicity: string
  targetMultiplicity: string
  label?: string
  userLabel?: string
  userSourceMultiplicity?: string
  userTargetMultiplicity?: string
}

export interface UmlMnDashedData {
  type: 'mnDashed'
  parentTables: [string, string]
  junctionTable: string
}

export interface UmlClass {
  id: string
  name: string
  columns: SqlColumn[]
  isJunctionTable: boolean
}

export type UmlNodeData = UmlClass & {
  label: string
}

export type UmlEdgeData = UmlRelationship | UmlMnDashedData