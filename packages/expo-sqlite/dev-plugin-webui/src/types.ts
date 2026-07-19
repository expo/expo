// Message types for SQLite inspector DevTools communication

export type SQLiteMessage =
  | { type: 'listDatabases' }
  | { type: 'listTables'; database: string }
  | { type: 'getTableSchema'; database: string; table: string }
  | { type: 'executeQuery'; database: string; query: string; params?: any[] }
  | {
      type: 'getTableData';
      database: string;
      table: string;
      limit?: number;
      offset?: number;
    }
  | {
      type: 'insertRow';
      database: string;
      table: string;
      values: Record<string, any>;
    }
  | {
      type: 'updateRow';
      database: string;
      table: string;
      values: Record<string, any>;
      where: string;
      whereParams?: any[];
    }
  | {
      type: 'deleteRow';
      database: string;
      table: string;
      where: string;
      whereParams?: any[];
    };

export type SQLiteResponse =
  | { method: 'listDatabases'; databases: DatabaseInfo[] }
  | { method: 'listTables'; tables: string[] }
  | { method: 'getTableSchema'; schema: ColumnInfo[] }
  | { method: 'executeQuery'; result: QueryResult }
  | { method: 'getTableData'; result: QueryResult }
  | { method: 'insertRow'; success: boolean; rowId?: number }
  | { method: 'updateRow'; success: boolean; changes: number }
  | { method: 'deleteRow'; success: boolean; changes: number }
  | { method: 'error'; error: string; originalMethod?: string };

export interface DatabaseInfo {
  name: string;
  path: string;
}

export interface ColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: any;
  pk: number;
}

export interface QueryResult {
  rows: any[];
  columns?: string[];
  rowsAffected?: number;
  insertId?: number;
  lastInsertRowId?: number;
  changes?: number;
}
