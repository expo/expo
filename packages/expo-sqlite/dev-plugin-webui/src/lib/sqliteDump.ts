/**
 * SQLite Database Dump Implementation
 *
 * Based on the official SQLite dump implementation from sqlite3.c
 * Adapted for TypeScript and expo-sqlite async API
 *
 * Original: https://github.com/sqlite/sqlite/blob/master/ext/misc/dbdump.c
 */

import type * as SQLite from 'expo-sqlite';

interface DumpOptions {
  schema?: string;
  table?: string | null;
}

interface ColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: any;
  pk: number;
}

/**
 * Check if an identifier needs to be quoted
 * Returns '"' if quoting is required, null otherwise
 */
function quoteChar(name: string): '"' | null {
  if (!name) return '"';

  // Must start with letter or underscore
  if (!/^[a-zA-Z_]/.test(name[0])) return '"';

  // Must contain only alphanumeric and underscore
  if (!/^[a-zA-Z0-9_]+$/.test(name)) return '"';

  // Check if it's a SQLite keyword (common ones)
  const keywords = new Set([
    'abort',
    'action',
    'add',
    'after',
    'all',
    'alter',
    'analyze',
    'and',
    'as',
    'asc',
    'attach',
    'autoincrement',
    'before',
    'begin',
    'between',
    'by',
    'cascade',
    'case',
    'cast',
    'check',
    'collate',
    'column',
    'commit',
    'conflict',
    'constraint',
    'create',
    'cross',
    'current_date',
    'current_time',
    'current_timestamp',
    'database',
    'default',
    'deferrable',
    'deferred',
    'delete',
    'desc',
    'detach',
    'distinct',
    'drop',
    'each',
    'else',
    'end',
    'escape',
    'except',
    'exclusive',
    'exists',
    'explain',
    'fail',
    'for',
    'foreign',
    'from',
    'full',
    'glob',
    'group',
    'having',
    'if',
    'ignore',
    'immediate',
    'in',
    'index',
    'indexed',
    'initially',
    'inner',
    'insert',
    'instead',
    'intersect',
    'into',
    'is',
    'isnull',
    'join',
    'key',
    'left',
    'like',
    'limit',
    'match',
    'natural',
    'no',
    'not',
    'notnull',
    'null',
    'of',
    'offset',
    'on',
    'or',
    'order',
    'outer',
    'plan',
    'pragma',
    'primary',
    'query',
    'raise',
    'recursive',
    'references',
    'regexp',
    'reindex',
    'release',
    'rename',
    'replace',
    'restrict',
    'right',
    'rollback',
    'row',
    'savepoint',
    'select',
    'set',
    'table',
    'temp',
    'temporary',
    'then',
    'to',
    'transaction',
    'trigger',
    'union',
    'unique',
    'update',
    'using',
    'vacuum',
    'values',
    'view',
    'virtual',
    'when',
    'where',
    'with',
    'without',
  ]);

  if (keywords.has(name.toLowerCase())) return '"';

  return null;
}

/**
 * Quote an identifier if necessary
 */
function quoteIdentifier(name: string): string {
  const quote = quoteChar(name);
  if (quote) {
    return `"${name.replace(/"/g, '""')}"`;
  }
  return name;
}

/**
 * Find a string that is not found anywhere in text
 * Used for finding delimiters when escaping newlines/carriage returns
 */
function unusedString(text: string, tryA: string, tryB: string): string {
  if (!text.includes(tryA)) return tryA;
  if (!text.includes(tryB)) return tryB;

  let i = 0;
  let candidate: string;
  do {
    candidate = `(${tryA}${i++})`;
  } while (text.includes(candidate));

  return candidate;
}

/**
 * Output a quoted and escaped string for SQL
 * Handles single quotes, newlines, and carriage returns
 */
function quoteString(text: string): string {
  // Check if we need special handling for quotes, newlines, or carriage returns
  const hasSpecialChars = /['\\n\\r]/.test(text);

  if (!hasSpecialChars) {
    return `'${text}'`;
  }

  const hasNewline = text.includes('\n');
  const hasCR = text.includes('\r');

  // Build the escaped string
  let result = '';
  let nlDelimiter = '';
  let crDelimiter = '';

  if (hasNewline) {
    nlDelimiter = unusedString(text, '\\n', '\\012');
    result = 'replace(';
  }
  if (hasCR) {
    crDelimiter = unusedString(text, '\\r', '\\015');
    result += 'replace(';
  }

  // Quote the string, doubling single quotes
  result += "'";
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === "'") {
      result += "''";
    } else if (char === '\n') {
      result += nlDelimiter;
    } else if (char === '\r') {
      result += crDelimiter;
    } else {
      result += char;
    }
  }
  result += "'";

  // Close replace() calls
  if (hasCR) {
    result += `,'${crDelimiter}',char(13))`;
  }
  if (hasNewline) {
    result += `,'${nlDelimiter}',char(10))`;
  }

  return result;
}

/**
 * Get the list of columns for a table, including rowid if needed
 * Returns [rowidColumn, ...regularColumns]
 */
async function getTableColumnList(db: SQLite.SQLiteDatabase, tableName: string): Promise<string[]> {
  // Get table info
  const columns = await db.getAllAsync<ColumnInfo>(
    `PRAGMA table_info(${quoteIdentifier(tableName)})`
  );

  let rowidColumn: string | null = null;
  let nPK = 0;
  let isIPK = false;

  // Check for INTEGER PRIMARY KEY
  for (const col of columns) {
    if (col.pk) {
      nPK++;
      if (nPK === 1 && col.type.toUpperCase() === 'INTEGER') {
        isIPK = true;
      } else {
        isIPK = false;
      }
    }
  }

  let preserveRowid = true;

  // Don't preserve rowid for composite primary keys
  if (nPK > 1) {
    preserveRowid = false;
  } else if (isIPK) {
    // If there's an INTEGER PRIMARY KEY, check if it's a real alias or not
    const pkIndexCheck = await db.getAllAsync<{ origin: string }>(
      `SELECT origin FROM pragma_index_list(${quoteString(tableName)}) WHERE origin='pk'`
    );
    // If there's a 'pk' index, it's not a rowid alias
    // When INTEGER PRIMARY KEY is a rowid alias (no pk index), we don't need to preserve rowid separately
    preserveRowid = pkIndexCheck.length > 0;
  }

  // Try to find an accessible rowid column name
  if (preserveRowid) {
    const rowidNames = ['rowid', '_rowid_', 'oid'];
    const columnNames = new Set(columns.map((c) => c.name.toLowerCase()));

    for (const name of rowidNames) {
      if (!columnNames.has(name)) {
        // Verify this name actually works for rowid
        try {
          await db.getAllAsync(`SELECT ${name} FROM ${quoteIdentifier(tableName)} LIMIT 0`);
          rowidColumn = name;
          break;
        } catch {
          // This name doesn't work, try next
        }
      }
    }
  }

  const result: string[] = [];
  if (rowidColumn) {
    result.push(rowidColumn);
  }
  result.push(...columns.map((c) => c.name));

  return result;
}

/**
 * Format a value for SQL output based on its type
 */
function formatValue(value: any, type: number): string {
  switch (type) {
    case 1: // SQLITE_INTEGER
      return String(value);

    case 2: {
      // SQLITE_FLOAT
      const num = value as number;
      if (num === Infinity) return '1e999';
      if (num === -Infinity) return '-1e999';
      if (Number.isNaN(num)) return '0'; // SQLite doesn't have NaN
      // Use high precision
      return num.toExponential(20).replace(/e\+?/, 'e+');
    }

    case 5: // SQLITE_NULL
      return 'NULL';

    case 3: // SQLITE_TEXT
      return quoteString(String(value));

    case 4: {
      // SQLITE_BLOB
      const bytes = new Uint8Array(value);
      const hex = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      return `x'${hex}'`;
    }

    default:
      return 'NULL';
  }
}

/**
 * Dump a single table's data
 */
async function dumpTableData(
  db: SQLite.SQLiteDatabase,
  tableName: string,
  output: (text: string) => void
): Promise<void> {
  const columns = await getTableColumnList(db, tableName);
  if (columns.length === 0) return;

  const hasRowid = columns.length > 0 && ['rowid', '_rowid_', 'oid'].includes(columns[0]);

  // Build INSERT statement prefix
  let insertPrefix = `INSERT INTO ${quoteIdentifier(tableName)}`;
  if (hasRowid) {
    const quotedCols = columns.map(quoteIdentifier).join(',');
    insertPrefix += `(${quotedCols})`;
  }
  insertPrefix += ' VALUES(';

  // Build SELECT statement
  const selectCols = columns.map(quoteIdentifier).join(',');
  const selectStmt = `SELECT ${selectCols} FROM ${quoteIdentifier(tableName)}`;

  // Execute query and output INSERT statements
  const rows = await db.getAllAsync(selectStmt);

  for (const rowData of rows) {
    const row = rowData as Record<string, any>;
    const values: string[] = [];

    for (let i = 0; i < columns.length; i++) {
      const value = row[columns[i]];

      // Determine type
      let type: number;
      if (value === null || value === undefined) {
        type = 5; // NULL
      } else if (typeof value === 'number') {
        type = Number.isInteger(value) ? 1 : 2; // INTEGER or FLOAT
      } else if (typeof value === 'string') {
        type = 3; // TEXT
      } else if (value instanceof Uint8Array || value instanceof ArrayBuffer) {
        type = 4; // BLOB
      } else {
        type = 5; // NULL
      }

      values.push(formatValue(value, type));
    }

    output(`${insertPrefix}${values.join(',')});\n`);
  }
}

/**
 * Import SQL statements into a database
 * This reverses the dump process by executing SQL statements
 */
export async function importDatabase(db: SQLite.SQLiteDatabase, sqlDump: string): Promise<void> {
  // Split by semicolons and filter out comments and empty lines
  const lines = sqlDump.split('\n');
  let currentStatement = '';
  const statements: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comment lines
    if (trimmed.startsWith('--') || trimmed.length === 0) {
      continue;
    }

    currentStatement += line + '\n';

    // Check if statement is complete (ends with semicolon)
    if (trimmed.endsWith(';')) {
      statements.push(currentStatement.trim());
      currentStatement = '';
    }
  }

  // Add any remaining statement
  if (currentStatement.trim().length > 0) {
    statements.push(currentStatement.trim());
  }

  // Execute each statement
  for (const statement of statements) {
    if (statement.length > 0) {
      try {
        await db.execAsync(statement);
      } catch (err: any) {
        // Log error but continue - some statements might fail on import
        console.warn('Failed to execute statement:', statement.substring(0, 100), err.message);
      }
    }
  }
}

/**
 * Dump the entire database or a specific table to SQL
 */
export async function dumpDatabase(
  db: SQLite.SQLiteDatabase,
  options: DumpOptions = {}
): Promise<string> {
  const { schema = 'main', table = null } = options;
  const output: string[] = [];

  const append = (text: string) => output.push(text);

  // Start with pragmas and transaction
  append('PRAGMA foreign_keys=OFF;\n');
  append('BEGIN TRANSACTION;\n');

  try {
    // Dump table schemas
    const tableQuery = table
      ? `SELECT name, type, sql FROM "${schema}".sqlite_schema
         WHERE tbl_name=${quoteString(table)} COLLATE nocase
         AND type='table' AND sql NOT NULL`
      : `SELECT name, type, sql FROM "${schema}".sqlite_schema
         WHERE sql NOT NULL AND type='table' AND name!='sqlite_sequence'`;

    const tables = await db.getAllAsync<{ name: string; type: string; sql: string }>(tableQuery);

    // Output CREATE TABLE statements
    for (const tbl of tables) {
      if (tbl.name.startsWith('sqlite_')) {
        continue; // Skip internal tables
      }

      // Handle virtual tables specially
      if (tbl.sql.startsWith('CREATE VIRTUAL TABLE')) {
        append('PRAGMA writable_schema=ON;\n');
        append(
          `INSERT INTO sqlite_schema(type,name,tbl_name,rootpage,sql)` +
            `VALUES('table',${quoteString(tbl.name)},${quoteString(tbl.name)},0,${quoteString(tbl.sql)});\n`
        );
        append('PRAGMA writable_schema=OFF;\n');
      } else {
        // Convert CREATE TABLE to CREATE TABLE IF NOT EXISTS
        if (tbl.sql.match(/^CREATE TABLE /i)) {
          append('CREATE TABLE IF NOT EXISTS ');
          append(tbl.sql.substring(13)); // Skip "CREATE TABLE "
        } else {
          append(tbl.sql);
        }
        append(';\n');
      }
    }

    // Handle sqlite_sequence if it exists
    if (!table) {
      const seqCheck = await db.getAllAsync<{ name: string }>(
        `SELECT name FROM "${schema}".sqlite_schema WHERE name='sqlite_sequence'`
      );
      if (seqCheck.length > 0) {
        append('DELETE FROM sqlite_sequence;\n');
      }
    }

    // Dump table data
    for (const tbl of tables) {
      if (!tbl.name.startsWith('sqlite_')) {
        await dumpTableData(db, tbl.name, append);
      }
    }

    // Handle sqlite_sequence data
    if (!table) {
      const seqData = await db
        .getAllAsync<{ name: string; seq: number }>(`SELECT name, seq FROM sqlite_sequence`)
        .catch(() => []);

      for (const seq of seqData) {
        append(`INSERT INTO sqlite_sequence VALUES(${quoteString(seq.name)},${seq.seq});\n`);
      }
    }

    // Dump indexes, triggers, and views
    const indexQuery = table
      ? `SELECT sql FROM "${schema}".sqlite_schema
         WHERE sql NOT NULL AND type IN ('index','trigger','view')
         AND tbl_name=${quoteString(table)} COLLATE nocase`
      : `SELECT sql FROM "${schema}".sqlite_schema
         WHERE sql NOT NULL AND type IN ('index','trigger','view')`;

    const objects = await db.getAllAsync<{ sql: string }>(indexQuery);

    for (const obj of objects) {
      append(obj.sql);
      append(';\n');
    }

    append('COMMIT;\n');
  } catch (err) {
    append('ROLLBACK; -- due to errors\n');
    throw err;
  }

  return output.join('');
}
