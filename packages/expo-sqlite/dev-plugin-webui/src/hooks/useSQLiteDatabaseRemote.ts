import { useCallback, useMemo, useState } from 'react';

import { useDevToolsConnectionContext } from './useDevToolsConnection';
import * as shared from './useSQLiteDatabase.shared';

import type { ColumnInfo, QueryResult } from '@/types';

/**
 * Hook for remote database operations through DevTools.
 * Unlike useSQLiteDatabase which operates on a local copy,
 * this hook sends queries directly to the app's native database.
 */
export function useSQLiteDatabaseRemote() {
  const {
    isConnected,
    executeQuery: executeQueryRemote,
    listTables: listTablesRemote,
    getTableSchema: getTableSchemaRemote,
    getDatabase: getDatabaseRemote,
  } = useDevToolsConnectionContext();
  const [databasePath, setDatabasePath] = useState<string | null>(null);
  const [dbName, setDbName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isKVStore, setIsKVStore] = useState(false);

  const openDatabase = useCallback(
    async (path: string, name: string) => {
      setDatabasePath(path);
      setDbName(name);
      setError(null);

      try {
        const kvStore = await shared.checkIsKVStore(
          () => listTablesRemote(path),
          (tableName: string) => getTableSchemaRemote(path, tableName)
        );
        setIsKVStore(kvStore);
      } catch {
        setIsKVStore(false);
      }
    },
    [listTablesRemote, getTableSchemaRemote]
  );

  const closeDatabase = useCallback(async () => {
    setDatabasePath(null);
    setDbName(null);
    setError(null);
    setIsKVStore(false);
  }, []);

  const dbOps = useMemo(() => {
    if (!databasePath) return null;

    return shared.createDatabaseOperations({
      executor: {
        executeQuery: (query: string, params?: any[]) =>
          executeQueryRemote(databasePath, query, params),
      },
      setLoading,
      setError,
    });
  }, [databasePath, executeQueryRemote]);

  const listTables = useCallback(async (): Promise<string[]> => {
    if (!databasePath) {
      throw new Error('No database open');
    }

    try {
      setLoading(true);
      setError(null);
      return await listTablesRemote(databasePath);
    } catch (err: any) {
      const message = err.message || 'Failed to list tables';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [databasePath, listTablesRemote]);

  const getTableSchema = useCallback(
    async (tableName: string): Promise<ColumnInfo[]> => {
      if (!databasePath) {
        throw new Error('No database open');
      }

      try {
        setLoading(true);
        setError(null);
        return await getTableSchemaRemote(databasePath, tableName);
      } catch (err: any) {
        const message = err.message || 'Failed to get table schema';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [databasePath, getTableSchemaRemote]
  );

  const executeQueryMethod = useCallback(
    async (query: string, params: any[] = []): Promise<QueryResult> => {
      if (!databasePath) {
        throw new Error('No database open');
      }

      try {
        setLoading(true);
        setError(null);
        return await executeQueryRemote(databasePath, query, params);
      } catch (err: any) {
        const message = err.message || 'Failed to execute query';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [databasePath, executeQueryRemote]
  );

  const exportDatabase = useCallback(async (): Promise<Uint8Array> => {
    if (!dbName) {
      throw new Error('No database open');
    }

    try {
      setLoading(true);
      setError(null);
      return await getDatabaseRemote(dbName);
    } catch (err: any) {
      const message = err.message || 'Failed to export database';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dbName, getDatabaseRemote]);

  const exportDatabaseAsSQL = useCallback(async (): Promise<string> => {
    if (!dbName) {
      throw new Error('No database open');
    }

    try {
      setLoading(true);
      setError(null);

      const data = await getDatabaseRemote(dbName);
      const SQLite = await import('expo-sqlite');
      const { dumpDatabase } = await import('@/lib/sqliteDump');
      const db = await SQLite.deserializeDatabaseAsync(data);

      try {
        const timestamp = new Date().toISOString();
        const header = `-- SQLite Database Dump\n-- Generated: ${timestamp}\n-- Source: Remote database via DevTools\n--\n`;
        const dump = await dumpDatabase(db, { schema: 'main' });
        return header + dump;
      } finally {
        await db.closeAsync();
      }
    } catch (err: any) {
      const message = err.message || 'Failed to export database as SQL';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dbName, getDatabaseRemote]);

  const throwNoDatabaseError = (...args: any[]): any => {
    return Promise.reject(new Error('No database open'));
  };

  const ensureOperation = <T extends (...args: any[]) => any>(op: T | undefined): T => {
    return (op || throwNoDatabaseError) as T;
  };

  return {
    db: databasePath,
    dbName,
    dbSource: 'devtools' as const,
    isKVStore,
    loading,
    error,
    setError,
    isConnected,
    openDatabase,
    closeDatabase,
    listTables,
    getTableSchema,
    executeQuery: executeQueryMethod,
    exportDatabase,
    exportDatabaseAsSQL,
    getTableData: ensureOperation(dbOps?.getTableData),
    insertRow: ensureOperation(dbOps?.insertRow),
    updateRow: ensureOperation(dbOps?.updateRow),
    deleteRow: ensureOperation(dbOps?.deleteRow),
    getKVStoreKeys: ensureOperation(dbOps?.getKVStoreKeys),
    getKVStoreItem: ensureOperation(dbOps?.getKVStoreItem),
    setKVStoreItem: ensureOperation(dbOps?.setKVStoreItem),
    removeKVStoreItem: ensureOperation(dbOps?.removeKVStoreItem),
    clearKVStore: ensureOperation(dbOps?.clearKVStore),
    getKVStoreLength: ensureOperation(dbOps?.getKVStoreLength),
    openDatabaseFromData: async () => {
      throw new Error('openDatabaseFromData is not supported in remote mode');
    },
  };
}
