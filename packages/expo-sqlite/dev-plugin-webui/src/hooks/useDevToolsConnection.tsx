import { useDevToolsPluginClient } from 'expo/devtools';
import React, { type ReactNode, createContext, use, useCallback, useEffect, useMemo } from 'react';

import { DEVTOOLS_PLUGIN_NAME } from '@/lib/constants';
import { DevToolsRequestHelper } from '@/lib/devToolsRequestHelper';

interface DatabaseInfo {
  name: string;
  path: string;
}

type SQLiteResponse =
  | { requestId: string; method: 'listDatabases'; databases: DatabaseInfo[] }
  | Uint8Array // getDatabase response
  | { requestId: string; method: 'executeQuery'; result: any }
  | { requestId: string; method: 'listTables'; tables: string[] }
  | { requestId: string; method: 'getTableSchema'; schema: any[] }
  | { requestId: string; method: 'error'; error: string; originalMethod?: string };

interface DevToolsConnectionContextValue {
  isConnected: boolean;
  listDatabases: () => Promise<DatabaseInfo[]>;
  getDatabase: (databaseName: string) => Promise<Uint8Array>;
  executeQuery: (databasePath: string, query: string, params?: any[]) => Promise<any>;
  listTables: (databasePath: string) => Promise<string[]>;
  getTableSchema: (databasePath: string, tableName: string) => Promise<any[]>;
}

const DevToolsConnectionContext = createContext<DevToolsConnectionContextValue | null>(null);

/**
 * Internal hook - exported for testing purposes only.
 * DO NOT use directly in application code. Use useDevToolsConnectionContext instead.
 * @internal
 */
export function useDevToolsConnection() {
  const client = useDevToolsPluginClient(DEVTOOLS_PLUGIN_NAME, {
    websocketBinaryType: 'arraybuffer',
  });
  const requestHelper = useMemo(() => new DevToolsRequestHelper<SQLiteResponse>(client), [client]);

  useEffect(() => {
    return () => {
      requestHelper.dispose();
    };
  }, [requestHelper]);

  const listDatabases = useCallback(async (): Promise<DatabaseInfo[]> => {
    const response = await requestHelper.sendMessageAsync('listDatabases');
    if (!(response instanceof Uint8Array)) {
      if (response.method === 'error') {
        throw new Error(response.error);
      }
      if (response.method === 'listDatabases') {
        return response.databases;
      }
    }
    throw new Error('Unexpected response method');
  }, [requestHelper]);

  const getDatabase = useCallback(
    async (databaseName: string): Promise<Uint8Array> => {
      const serialized = await requestHelper.sendMessageAsync('getDatabase', {
        database: databaseName,
      });
      if (serialized instanceof Uint8Array) {
        return serialized;
      }
      if (serialized.method === 'error') {
        throw new Error(serialized.error);
      }
      throw new Error('Unexpected response method');
    },
    [requestHelper]
  );

  const executeQuery = useCallback(
    async (databasePath: string, query: string, params?: any[]): Promise<any> => {
      const response = await requestHelper.sendMessageAsync('executeQuery', {
        databasePath,
        query,
        params,
      });
      if (!(response instanceof Uint8Array)) {
        if (response.method === 'error') {
          throw new Error(response.error);
        }
        if (response.method === 'executeQuery') {
          return response.result;
        }
      }
      throw new Error('Unexpected response method');
    },
    [requestHelper]
  );

  const listTables = useCallback(
    async (databasePath: string): Promise<string[]> => {
      const response = await requestHelper.sendMessageAsync('listTables', { databasePath });
      if (!(response instanceof Uint8Array)) {
        if (response.method === 'error') {
          throw new Error(response.error);
        }
        if (response.method === 'listTables') {
          return response.tables;
        }
      }
      throw new Error('Unexpected response method');
    },
    [requestHelper]
  );

  const getTableSchema = useCallback(
    async (databasePath: string, tableName: string): Promise<any[]> => {
      const response = await requestHelper.sendMessageAsync('getTableSchema', {
        databasePath,
        tableName,
      });
      if (!(response instanceof Uint8Array)) {
        if (response.method === 'error') {
          throw new Error(response.error);
        }
        if (response.method === 'getTableSchema') {
          return response.schema;
        }
      }
      throw new Error('Unexpected response method');
    },
    [requestHelper]
  );

  return {
    isConnected: client?.isConnected() ?? false,
    listDatabases,
    getDatabase,
    executeQuery,
    listTables,
    getTableSchema,
  };
}

/**
 * Provider component that should be placed at the root of your app.
 * Provides a single DevTools connection instance to all child components.
 */
export function DevToolsConnectionProvider({ children }: { children: ReactNode }) {
  const connection = useDevToolsConnection();

  return (
    <DevToolsConnectionContext.Provider value={connection}>
      {children}
    </DevToolsConnectionContext.Provider>
  );
}

/**
 * Hook to access the DevTools connection.
 * Must be used within a DevToolsConnectionProvider.
 */
export function useDevToolsConnectionContext() {
  const context = use(DevToolsConnectionContext);

  if (!context) {
    throw new Error('useDevToolsConnectionContext must be used within DevToolsConnectionProvider');
  }
  return context;
}
