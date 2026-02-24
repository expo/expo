import AwaitLock from 'await-lock';
import type { DevToolsPluginClient } from 'expo/devtools';
import { startCliListenerAsync } from 'expo/devtools';

import type { SQLiteDatabase } from './SQLiteDatabase';
import { basename } from './pathUtils';

const DEVTOOLS_PLUGIN_NAME = 'expo-sqlite';
const LIST_TABLES_QUERY =
  "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name";

type SQLiteResponse =
  | { requestId: string; method: 'listDatabases'; databases: DatabaseInfo[] }
  | { method: 'getDatabase'; database: DatabaseInfo; data: Uint8Array }
  | { requestId: string; method: 'executeQuery'; result: QueryResult }
  | { requestId: string; method: 'listTables'; tables: string[] }
  | { requestId: string; method: 'getTableSchema'; schema: ColumnInfo[] }
  | { requestId: string; method: 'error'; error: string; originalMethod?: string };

interface DatabaseInfo {
  name: string;
  path: string;
}

interface ColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: any;
  pk: number;
}

interface QueryResult {
  rows: any[];
  columns: string[];
  changes?: number;
  lastInsertRowId?: number;
}

let client: DevToolsPluginClient | null = null;
const lock = new AwaitLock();
const registeredDatabases = new Map<string, WeakRef<SQLiteDatabase>>();

export async function registerDatabaseForDevToolsAsync(database: SQLiteDatabase): Promise<void> {
  if (!__DEV__) {
    return;
  }
  await maybeInitClientAsync();
  registeredDatabases.set(database.databasePath, new WeakRef(database));
}

export async function unregisterDatabaseForDevToolsAsync(database: SQLiteDatabase): Promise<void> {
  if (!__DEV__) {
    return;
  }
  registeredDatabases.delete(database.databasePath);
}

async function maybeInitClientAsync(): Promise<void> {
  if (!__DEV__ || client != null) {
    return;
  }

  await lock.acquireAsync();
  try {
    const { getDevToolsPluginClientAsync } =
      require('expo/devtools') as typeof import('expo/devtools');
    client = await getDevToolsPluginClientAsync(DEVTOOLS_PLUGIN_NAME, {
      websocketBinaryType: 'arraybuffer',
    });
    setupDevToolsListeners();
  } catch (error: unknown) {
    console.warn('Failed to initialize devtools client', error);
  } finally {
    lock.release();
  }
}

/**
 * Close the devtools client.
 * Exposed for testing purposes.
 */
export async function closeDevToolsClientAsync(): Promise<void> {
  await client?.closeAsync();
  client = null;
  registeredDatabases.clear();
}

function setupDevToolsListeners(): void {
  client?.addMessageListener('listDatabases', async (params: { requestId: string }) => {
    try {
      const databases = Array.from(registeredDatabases.keys()).map((databasePath) => ({
        name: basename(databasePath),
        path: databasePath,
      }));
      client?.sendMessage('response', {
        requestId: params.requestId,
        method: 'listDatabases',
        databases,
      } as SQLiteResponse);
    } catch (error: unknown) {
      client?.sendMessage('response', {
        requestId: params.requestId,
        method: 'error',
        error:
          typeof error === 'object' && error !== null && 'message' in error
            ? error.message
            : String(error),
        originalMethod: 'listDatabases',
      } as SQLiteResponse);
    }
  });

  // getDatabase uses method:requestId channel to support binary data
  client?.addMessageListener(
    'getDatabase',
    async (params: { requestId: string; database: string }) => {
      const eventName = `getDatabase:${params.requestId}`;
      try {
        const databasePath = Array.from(registeredDatabases.keys()).find(
          (path) => basename(path) === params.database
        );
        const database = databasePath ? registeredDatabases.get(databasePath)?.deref() : undefined;

        if (!database || !databasePath) {
          throw new Error('Database not found');
        }

        const serialized = await database.serializeAsync();
        client?.sendMessage(eventName, serialized);
      } catch (error: unknown) {
        client?.sendMessage(eventName, {
          method: 'error',
          error:
            typeof error === 'object' && error !== null && 'message' in error
              ? error.message
              : String(error),
          originalMethod: 'getDatabase',
        } as SQLiteResponse);
      }
    }
  );

  client?.addMessageListener(
    'executeQuery',
    async (params: { requestId: string; databasePath: string; query: string; params?: any[] }) => {
      try {
        const database = registeredDatabases.get(params.databasePath)?.deref();
        if (!database) {
          client?.sendMessage('response', {
            requestId: params.requestId,
            method: 'error',
            error: 'Database not found',
            originalMethod: 'executeQuery',
          } as SQLiteResponse);
          return;
        }

        const result = await executeQueryAsync(params.query, database);

        client?.sendMessage('response', {
          requestId: params.requestId,
          method: 'executeQuery',
          result,
        } as SQLiteResponse);
      } catch (error: unknown) {
        client?.sendMessage('response', {
          requestId: params.requestId,
          method: 'error',
          error:
            typeof error === 'object' && error !== null && 'message' in error
              ? error.message
              : String(error),
          originalMethod: 'executeQuery',
        } as SQLiteResponse);
      }
    }
  );

  client?.addMessageListener(
    'listTables',
    async (params: { requestId: string; databasePath: string }) => {
      try {
        const database = registeredDatabases.get(params.databasePath)?.deref();
        if (!database) {
          client?.sendMessage('response', {
            requestId: params.requestId,
            method: 'error',
            error: 'Database not found',
            originalMethod: 'listTables',
          } as SQLiteResponse);
          return;
        }

        const tables = await getTablesAsync(database);
        client?.sendMessage('response', {
          requestId: params.requestId,
          method: 'listTables',
          tables: tables.map((t) => t.name),
        } as SQLiteResponse);
      } catch (error: unknown) {
        client?.sendMessage('response', {
          requestId: params.requestId,
          method: 'error',
          error:
            typeof error === 'object' && error !== null && 'message' in error
              ? error.message
              : String(error),
          originalMethod: 'listTables',
        } as SQLiteResponse);
      }
    }
  );

  client?.addMessageListener(
    'getTableSchema',
    async (params: { requestId: string; databasePath: string; tableName: string }) => {
      try {
        const database = registeredDatabases.get(params.databasePath)?.deref();
        if (!database) {
          client?.sendMessage('response', {
            requestId: params.requestId,
            method: 'error',
            error: 'Database not found',
            originalMethod: 'getTableSchema',
          } as SQLiteResponse);
          return;
        }

        const schema = await fetchTableSchemaAsync(params.tableName, database);

        client?.sendMessage('response', {
          requestId: params.requestId,
          method: 'getTableSchema',
          schema,
        } as SQLiteResponse);
      } catch (error: unknown) {
        client?.sendMessage('response', {
          requestId: params.requestId,
          method: 'error',
          error:
            typeof error === 'object' && error !== null && 'message' in error
              ? error.message
              : String(error),
          originalMethod: 'getTableSchema',
        } as SQLiteResponse);
      }
    }
  );
}

/* Setup listeners for the cli extensions client. */
const EXTENSION_NAME = 'expo-sqlite-cli-extension';

startCliListenerAsync(EXTENSION_NAME).then(({ addMessageListener }) => {
  addMessageListener<Record<string, never>>('listDatabases', async ({ sendResponseAsync }) => {
    try {
      if (registeredDatabases.size === 0) {
        return sendResponseAsync('No databases registered.');
      }
      await sendResponseAsync(
        'Databases: ' +
          Array.from(registeredDatabases.keys())
            .map((databasePath) => basename(databasePath))
            .join(', ')
      );
    } catch (error: unknown) {
      await sendResponseAsync(
        'An error occurred while listing databases: ' +
          (typeof error === 'object' && error !== null && 'message' in error
            ? (String(error.message) ?? 'Unknown error')
            : String(error))
      );
    }
  });

  addMessageListener<{ name: string; query: string }>(
    'executeQuery',
    async ({ sendResponseAsync, params }) => {
      try {
        const database = findDatabase(params.name);
        if (!database) {
          return sendResponseAsync(`Database ${params.name} not found`);
        }
        const result = await executeQueryAsync(params.query, database);
        await sendResponseAsync(`\n\n${tableFormatHelper(result)}`);
      } catch (error: unknown) {
        await sendResponseAsync(
          'An error occurred while executing the query: ' +
            (typeof error === 'object' && error !== null && 'message' in error
              ? error.message
              : String(error))
        );
      }
    }
  );
  addMessageListener<{ name: string }>('listTables', async ({ sendResponseAsync, params }) => {
    try {
      const database = findDatabase(params.name);
      if (!database) {
        return sendResponseAsync(`Database ${params.name} not found`);
      }

      const tables = await getTablesAsync(database);
      await sendResponseAsync(
        `Tables in ${basename(database.databasePath)}: ` + tables.map((t) => t.name).join(', ')
      );
    } catch (error: unknown) {
      await sendResponseAsync(
        'An error occurred while listing tables: ' +
          (typeof error === 'object' && error !== null && 'message' in error
            ? error.message
            : String(error))
      );
    }
  });
  addMessageListener<{ name: string; table: string }>(
    'getTableSchema',
    async ({ sendResponseAsync, params }) => {
      try {
        const database = findDatabase(params.name);
        if (!database) {
          return sendResponseAsync(`Database ${params.name} not found`);
        }
        const schema = await fetchTableSchemaAsync(params.table, database);
        await sendResponseAsync(`\n\n${schemaFormatHelper(schema)}`);
      } catch (error: unknown) {
        await sendResponseAsync(
          'An error occurred while retrieving the table schema: ' +
            (typeof error === 'object' && error !== null && 'message' in error
              ? error.message
              : String(error))
        );
      }
    }
  );
});

async function getTablesAsync(database: SQLiteDatabase) {
  return (await database.getAllAsync(LIST_TABLES_QUERY)) as { name: string }[];
}

async function fetchTableSchemaAsync(table: string, database: SQLiteDatabase) {
  const tables = (await database.getAllAsync(
    "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
    [table]
  )) as { name: string }[];

  if (tables.length === 0) {
    throw new Error(`Table '${table}' not found`);
  }

  const schema = (await database.getAllAsync(`PRAGMA table_info(${table})`)) as ColumnInfo[];
  return schema;
}

async function executeQueryAsync(query: string, database: SQLiteDatabase) {
  const trimmedQuery = query.trim().toUpperCase();
  const isReadQuery = trimmedQuery.startsWith('SELECT') || trimmedQuery.startsWith('PRAGMA');

  let result: QueryResult;

  if (isReadQuery) {
    const rows = await database.getAllAsync(query, []);
    const columns =
      rows.length > 0 && rows[0] && typeof rows[0] === 'object' ? Object.keys(rows[0]) : [];
    result = { rows, columns };
  } else {
    const runResult = await database.runAsync(query, []);
    result = {
      rows: [],
      columns: [],
      changes: runResult.changes,
      lastInsertRowId: runResult.lastInsertRowId,
    };
  }
  return result;
}

function findDatabase(name: string): SQLiteDatabase | undefined {
  return Array.from(registeredDatabases.values())
    .find((ref) => {
      const db = ref.deref();
      return db?.databasePath.endsWith(name) || db?.databasePath.endsWith(name + '.db');
    })
    ?.deref();
}

/**
 * Formats the query result into a table-like string for better readability in the CLI.
 * Example output:
 * id | title | done
 * ---|-------|-----
 * 4  | Milk  | 0
 * 5  | Cake  | 0
 *
 * For a query like: SELECT id, title, done FROM todos;
 * Output: { "rows": [ { "id": 4, "title": "Milk", "done": 0},{"id": 5,"title": "Cake", "done": 0}],"columns": ["id","title","done"}
 */
function tableFormatHelper(results: QueryResult): string {
  const columnWidths = results.columns.map((col) => col.length);

  results.rows.forEach((row) => {
    results.columns.forEach((col, index) => {
      const cellLength = String(row[col]).length;
      if (cellLength > columnWidths[index]) {
        columnWidths[index] = cellLength;
      }
    });
  });

  const header = results.columns.map((col, index) => col.padEnd(columnWidths[index])).join(' | ');

  const separator = columnWidths.map((width) => '-'.repeat(width)).join('-|-');

  const rows = results.rows.map((row) =>
    results.columns.map((col, index) => String(row[col]).padEnd(columnWidths[index])).join(' | ')
  );

  return [header, separator, ...rows].join('\n');
}

/**
 * [ {"cid": 0, "name": "id","type": "INTEGER","notnull": 0,"dflt_value": null, "pk": 1},{"cid": 1,name": "title",type": "TEXT",null": 1,alue": null, "pk": 0}]
 * @param schema
 * @returns
 */
function schemaFormatHelper(schema: ColumnInfo[]): string {
  const columnWidths = ['cid', 'name', 'type', 'notnull', 'dflt_value', 'pk'].map((col) =>
    Math.max(col.length, ...schema.map((row) => String(row[col as keyof ColumnInfo]).length))
  );

  const header = ['cid', 'name', 'type', 'notnull', 'dflt_value', 'pk']
    .map((col, index) => col.padEnd(columnWidths[index]))
    .join(' | ');

  const separator = columnWidths.map((width) => '-'.repeat(width)).join('-|-');

  const rows = schema.map((row) =>
    ['cid', 'name', 'type', 'notnull', 'dflt_value', 'pk']
      .map((col, index) => String(row[col as keyof ColumnInfo]).padEnd(columnWidths[index]))
      .join(' | ')
  );

  return [header, separator, ...rows].join('\n');
}
