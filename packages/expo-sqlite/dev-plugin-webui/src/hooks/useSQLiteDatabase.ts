import * as SQLite from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';

import * as shared from './useSQLiteDatabase.shared';

import { dumpDatabase, importDatabase } from '@/lib/sqliteDump';
import type { ColumnInfo, QueryResult } from '@/types';

export function useSQLiteDatabase() {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [dbName, setDbName] = useState<string | null>(null);
  const [dbSource, setDbSource] = useState<'file' | 'devtools' | null>(null);
  const [isKVStore, setIsKVStore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkIsKVStoreLocal = useCallback(
    async (database: SQLite.SQLiteDatabase): Promise<boolean> => {
      const listTables = async () => {
        const tables = await database.getAllAsync<{ name: string }>(
          "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
        );
        return tables.map((t) => t.name);
      };

      const getTableSchema = async (tableName: string) => {
        return await database.getAllAsync<ColumnInfo>(`PRAGMA table_info(${tableName})`);
      };

      return shared.checkIsKVStore(listTables, getTableSchema);
    },
    []
  );

  const openDatabaseFromData = useCallback(
    async (data: Uint8Array, name: string, source: 'file' | 'devtools') => {
      try {
        setLoading(true);
        setError(null);

        // Check if it's a binary SQLite file or SQL dump
        const textDecoder = new TextDecoder('utf-8');
        const header = textDecoder.decode(data.slice(0, 16));

        if (header.startsWith('SQLite format')) {
          // Binary SQLite file - use deserializeDatabaseAsync
          const database = await SQLite.deserializeDatabaseAsync(data);

          const kvStore = await checkIsKVStoreLocal(database);

          setDb(database);
          setDbName(name);
          setDbSource(source);
          setIsKVStore(kvStore);
          setError(null); // Clear any previous errors
        } else {
          // SQL dump file - use importDatabase
          const text = textDecoder.decode(data);
          const dbFileName = name.replace(/\.[^/.]+$/, '') || 'database';
          const database = await SQLite.openDatabaseAsync(dbFileName);

          try {
            await importDatabase(database, text);
          } catch (sqlError: any) {
            console.error('SQL import error:', sqlError);
            throw new Error(`Failed to import SQL: ${sqlError.message}`);
          }

          const kvStore = await checkIsKVStoreLocal(database);

          setDb(database);
          setDbName(name);
          setDbSource(source);
          setIsKVStore(kvStore);
          setError(null); // Clear any previous errors
        }
      } catch (err: any) {
        setError(err.message || 'Failed to open database');
        console.error('Database open error:', err);
      } finally {
        setLoading(false);
      }
    },
    [checkIsKVStoreLocal]
  );

  const openDatabase = useCallback(
    async (file: File) => {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      await openDatabaseFromData(uint8Array, file.name, 'file');
    },
    [openDatabaseFromData]
  );

  const closeDatabase = useCallback(async () => {
    if (db) {
      await db.closeAsync();
      setDb(null);
      setDbName(null);
      setDbSource(null);
      setIsKVStore(false);
    }
  }, [db]);

  // Create a DatabaseExecutor wrapper for shared utilities
  const createExecutor = useCallback((): shared.DatabaseExecutor => {
    if (!db) {
      throw new Error('No database open');
    }
    return {
      executeQuery: async (query: string, params?: any[]): Promise<QueryResult> => {
        const result = await db.getAllAsync(query, params || []);
        return {
          rows: result,
          columns: result.length > 0 && result[0] ? Object.keys(result[0] as object) : [],
        };
      },
      getAllAsync: (query: string, params?: any[]) => db.getAllAsync(query, params || []),
      getFirstAsync: db.getFirstAsync.bind(db),
      runAsync: db.runAsync.bind(db),
    };
  }, [db]);

  // Create shared database operations
  const dbOps = useMemo(() => {
    if (!db) return null;

    return shared.createDatabaseOperations({
      executor: createExecutor(),
      setLoading,
      setError,
    });
  }, [db, createExecutor]);

  const listTables = useCallback(async (): Promise<string[]> => {
    if (!db) {
      throw new Error('No database open');
    }

    try {
      setLoading(true);
      setError(null);
      const result = await db.getAllAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
      );
      setError(null); // Clear error on success
      return result.map((row) => row.name);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to list tables';
      setError(errorMessage);
      console.error('List tables error:', errorMessage, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [db]);

  const getTableSchema = useCallback(
    async (tableName: string): Promise<ColumnInfo[]> => {
      if (!db) {
        throw new Error('No database open');
      }

      try {
        setLoading(true);
        setError(null);
        const schema = await db.getAllAsync<ColumnInfo>(`PRAGMA table_info(${tableName})`);
        return schema;
      } catch (err: any) {
        setError(err.message || 'Failed to get table schema');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [db]
  );

  const executeQuery = useCallback(
    async (query: string, params: any[] = []): Promise<QueryResult> => {
      if (!db) {
        throw new Error('No database open');
      }

      try {
        setLoading(true);
        setError(null);
        const result = await db.getAllAsync(query, params);
        return {
          rows: result,
          columns:
            result.length > 0 && result[0] ? Object.keys(result[0] as Record<string, unknown>) : [],
        };
      } catch (err: any) {
        setError(err.message || 'Failed to execute query');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [db]
  );

  const exportDatabase = useCallback(async (): Promise<Uint8Array> => {
    if (!db) {
      throw new Error('No database open');
    }

    try {
      setLoading(true);
      const serialized = await db.serializeAsync();
      return serialized;
    } catch (err: any) {
      setError(err.message || 'Failed to export database');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [db]);

  const exportDatabaseAsSQL = useCallback(async (): Promise<string> => {
    if (!db) {
      throw new Error('No database open');
    }

    try {
      setLoading(true);
      const timestamp = new Date().toISOString();
      const header = `-- SQLite Database Dump\n-- Generated: ${timestamp}\n--\n`;
      const dump = await dumpDatabase(db, { schema: 'main' });
      return header + dump;
    } catch (err: any) {
      setError(err.message || 'Failed to export database as SQL');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [db]);

  // Helper to ensure operations exist even when no database is open
  const throwNoDatabaseError = (...args: any[]): any => {
    return Promise.reject(new Error('No database open'));
  };

  // Helper to get operation or fallback
  const getOp = <T extends (...args: any[]) => any>(op: T | undefined): T => {
    return (op || throwNoDatabaseError) as T;
  };

  return {
    db,
    dbName,
    dbSource,
    isKVStore,
    loading,
    error,
    setError,
    openDatabase,
    openDatabaseFromData,
    closeDatabase,
    exportDatabase,
    exportDatabaseAsSQL,
    listTables,
    getTableSchema,
    executeQuery,
    getTableData: getOp(dbOps?.getTableData),
    insertRow: getOp(dbOps?.insertRow),
    updateRow: getOp(dbOps?.updateRow),
    deleteRow: getOp(dbOps?.deleteRow),
    // KV-Store operations
    getKVStoreKeys: getOp(dbOps?.getKVStoreKeys),
    getKVStoreItem: getOp(dbOps?.getKVStoreItem),
    setKVStoreItem: getOp(dbOps?.setKVStoreItem),
    removeKVStoreItem: getOp(dbOps?.removeKVStoreItem),
    clearKVStore: getOp(dbOps?.clearKVStore),
    getKVStoreLength: getOp(dbOps?.getKVStoreLength),
  };
}
