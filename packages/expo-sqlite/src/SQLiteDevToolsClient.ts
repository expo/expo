import AwaitLock from 'await-lock';
import type { DevToolsPluginClient } from 'expo/devtools';

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

        const trimmedQuery = params.query.trim().toUpperCase();
        const isReadQuery = trimmedQuery.startsWith('SELECT') || trimmedQuery.startsWith('PRAGMA');

        let result: QueryResult;

        if (isReadQuery) {
          const rows = await database.getAllAsync(params.query, params.params || []);
          const columns =
            rows.length > 0 && rows[0] && typeof rows[0] === 'object' ? Object.keys(rows[0]) : [];
          result = { rows, columns };
        } else {
          const runResult = await database.runAsync(params.query, params.params || []);
          result = {
            rows: [],
            columns: [],
            changes: runResult.changes,
            lastInsertRowId: runResult.lastInsertRowId,
          };
        }

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

        const tables = (await database.getAllAsync(LIST_TABLES_QUERY)) as { name: string }[];
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

        const tables = (await database.getAllAsync(
          "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
          [params.tableName]
        )) as { name: string }[];

        if (tables.length === 0) {
          throw new Error(`Table '${params.tableName}' not found`);
        }

        const schema = (await database.getAllAsync(
          `PRAGMA table_info(${params.tableName})`
        )) as ColumnInfo[];

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
