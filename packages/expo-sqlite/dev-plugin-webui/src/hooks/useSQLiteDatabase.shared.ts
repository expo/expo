import type { ColumnInfo, QueryResult } from '@/types';

/**
 * Shared database operation utilities used by both local and remote database hooks.
 */

export interface DatabaseExecutor {
  executeQuery(query: string, params?: any[]): Promise<QueryResult>;
  getAllAsync?<T = any>(query: string, params?: any[]): Promise<T[]>;
  getFirstAsync?<T = any>(query: string, ...params: any[]): Promise<T | null>;
  runAsync?(query: string, ...params: any[]): Promise<{ lastInsertRowId: number; changes: number }>;
}

export interface DatabaseOperations {
  executor: DatabaseExecutor;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

/**
 * Check if a database has a KV-store table with the correct schema
 */
export async function checkIsKVStore(
  listTables: () => Promise<string[]>,
  getTableSchema: (tableName: string) => Promise<ColumnInfo[]>
): Promise<boolean> {
  try {
    const tables = await listTables();
    if (!tables.includes('storage')) {
      return false;
    }

    // Verify the schema matches KV-store pattern
    const schema = await getTableSchema('storage');
    const hasKey = schema.some((col) => col.name === 'key');
    const hasValue = schema.some((col) => col.name === 'value');

    return hasKey && hasValue;
  } catch (err) {
    console.warn('Failed to check for KV store:', err);
    return false;
  }
}

/**
 * Create database operation functions with automatic loading/error handling
 */
export function createDatabaseOperations(ops: DatabaseOperations) {
  const { executor, setLoading, setError } = ops;

  const withLoadingAndError = async <T>(errorMessage: string, fn: () => Promise<T>): Promise<T> => {
    try {
      setLoading(true);
      setError(null);
      return await fn();
    } catch (err: any) {
      const message = err.message || errorMessage;
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    insertRow: async (tableName: string, values: Record<string, any>): Promise<number> => {
      return withLoadingAndError('Failed to insert row', async () => {
        const columns = Object.keys(values);
        const placeholders = columns.map(() => '?').join(', ');
        const params = Object.values(values);
        const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

        if (executor.runAsync) {
          const result = await executor.runAsync(query, ...params);
          return result.lastInsertRowId;
        }

        const result = await executor.executeQuery(query, params);
        return result.lastInsertRowId || result.insertId || 0;
      });
    },

    updateRow: async (
      tableName: string,
      values: Record<string, any>,
      where: string,
      whereParams: any[] = []
    ): Promise<number> => {
      return withLoadingAndError('Failed to update row', async () => {
        const columns = Object.keys(values);
        const setClause = columns.map((col) => `${col} = ?`).join(', ');
        const params = [...Object.values(values), ...whereParams];
        const query = `UPDATE ${tableName} SET ${setClause} WHERE ${where}`;

        if (executor.runAsync) {
          const result = await executor.runAsync(query, ...params);
          return result.changes;
        }

        const result = await executor.executeQuery(query, params);
        return result.changes || result.rowsAffected || 0;
      });
    },

    deleteRow: async (
      tableName: string,
      where: string,
      whereParams: any[] = []
    ): Promise<number> => {
      return withLoadingAndError('Failed to delete row', async () => {
        const query = `DELETE FROM ${tableName} WHERE ${where}`;

        if (executor.runAsync) {
          const result = await executor.runAsync(query, ...whereParams);
          return result.changes;
        }

        const result = await executor.executeQuery(query, whereParams);
        return result.changes || result.rowsAffected || 0;
      });
    },

    getTableData: async (
      tableName: string,
      limit: number = 50,
      offset: number = 0
    ): Promise<QueryResult> => {
      return withLoadingAndError('Failed to get table data', async () => {
        const result = await executor.executeQuery(`SELECT * FROM ${tableName} LIMIT ? OFFSET ?`, [
          limit,
          offset,
        ]);
        return {
          rows: result.rows,
          columns: result.columns || (result.rows.length > 0 ? Object.keys(result.rows[0]) : []),
        };
      });
    },

    // KV-Store operations
    getKVStoreKeys: async (): Promise<string[]> => {
      return withLoadingAndError('Failed to get KV-store keys', async () => {
        const result = await executor.executeQuery('SELECT key FROM storage ORDER BY key', []);
        return result.rows.map((row: any) => row.key);
      });
    },

    getKVStoreItem: async (key: string): Promise<string | null> => {
      return withLoadingAndError('Failed to get KV-store item', async () => {
        const result = await executor.executeQuery('SELECT value FROM storage WHERE key = ?', [
          key,
        ]);
        return result.rows[0]?.value ?? null;
      });
    },

    setKVStoreItem: async (key: string, value: string): Promise<void> => {
      return withLoadingAndError('Failed to set KV-store item', async () => {
        await executor.executeQuery(
          'INSERT INTO storage (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
          [key, value]
        );
      });
    },

    removeKVStoreItem: async (key: string): Promise<boolean> => {
      return withLoadingAndError('Failed to remove KV-store item', async () => {
        if (executor.runAsync) {
          const result = await executor.runAsync('DELETE FROM storage WHERE key = ?', key);
          return result.changes > 0;
        }

        const result = await executor.executeQuery('DELETE FROM storage WHERE key = ?', [key]);
        return (result.changes || result.rowsAffected || 0) > 0;
      });
    },

    clearKVStore: async (): Promise<void> => {
      return withLoadingAndError('Failed to clear KV-store', async () => {
        await executor.executeQuery('DELETE FROM storage', []);
      });
    },

    getKVStoreLength: async (): Promise<number> => {
      return withLoadingAndError('Failed to get KV-store length', async () => {
        const result = await executor.executeQuery('SELECT COUNT(*) as count FROM storage', []);
        return result.rows[0]?.count ?? 0;
      });
    },
  };
}
