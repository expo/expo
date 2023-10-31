import React, { createContext, useContext, useEffect, useState } from 'react';

import { openDatabaseAsync, Database } from './Database';
import type { OpenOptions } from './NativeDatabase';

export interface SQLiteProviderProps {
  /**
   * The name of the database file to open.
   */
  dbName: string;

  /**
   * Open options.
   */
  options?: OpenOptions;

  /**
   * The children to render.
   */
  children: React.ReactNode;

  /**
   * Handle errors from SQLiteProvider.
   * @default throw
   */
  errorHandler?: (error: Error) => void;
}

// Create a context for the SQLite database
const SQLiteContext = createContext<Database | null>(null);

// Create a provider component
export function SQLiteProvider({ dbName, options, children, errorHandler }: SQLiteProviderProps) {
  const [database, setDatabase] = useState<Database | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function setup() {
      try {
        const db = await openDatabaseAsync(dbName, options);
        setDatabase(db);
      } catch (e) {
        setError(e);
      }
    }

    async function teardown() {
      try {
        await database?.closeAsync();
      } catch (e) {
        setError(e);
      }
    }

    setup();

    return () => {
      teardown();
    };
  }, [dbName, options]);

  if (error != null) {
    const handler =
      errorHandler ??
      ((e) => {
        throw e;
      });
    handler(error);
  }

  if (database == null) {
    return null;
  }
  return <SQLiteContext.Provider value={database}>{children}</SQLiteContext.Provider>;
}

// Create a hook for accessing the SQLite database context
export function useSQLiteContext() {
  const context = useContext(SQLiteContext);
  if (context == null) {
    throw new Error('useSQLiteContext must be used within a <SQLiteProvider>');
  }
  return context;
}
