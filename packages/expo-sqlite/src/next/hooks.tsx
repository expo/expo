import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

import { openDatabaseAsync, type Database } from './Database';
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
   * A custom initialization handler to run before rendering the children.
   * You can use this to run database migrations or other setup tasks.
   */
  initHandler?: (db: Database) => Promise<void>;

  /**
   * A custom loading fallback to render before the database is ready.
   * @default null
   */
  loadingFallback?: React.ReactNode;

  /**
   * Handle errors from SQLiteProvider.
   * @default rethrow the error
   */
  errorHandler?: (error: Error) => void;
}

// Create a context for the SQLite database
const SQLiteContext = createContext<Database | null>(null);

// Create a provider component
export function SQLiteProvider({
  dbName,
  options,
  children,
  initHandler,
  loadingFallback,
  errorHandler,
}: SQLiteProviderProps) {
  const databaseRef = useRef<Database | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function setup() {
      try {
        const db = await openDatabaseAsync(dbName, options);
        if (initHandler != null) {
          await initHandler(db);
        }
        databaseRef.current = db;
        setLoading(false);
      } catch (e) {
        setError(e);
      }
    }

    async function teardown(db: Database | null) {
      try {
        await db?.closeAsync();
      } catch (e) {
        setError(e);
      }
    }

    setup();

    return () => {
      const db = databaseRef.current;
      teardown(db);
      databaseRef.current = null;
      setLoading(true);
    };
  }, [dbName, options, initHandler]);

  if (error != null) {
    const handler =
      errorHandler ??
      ((e) => {
        throw e;
      });
    handler(error);
  }

  if (loading || !databaseRef.current) {
    return loadingFallback != null ? <>{loadingFallback}</> : null;
  }
  return <SQLiteContext.Provider value={databaseRef.current}>{children}</SQLiteContext.Provider>;
}

// Create a hook for accessing the SQLite database context
export function useSQLiteContext() {
  const context = useContext(SQLiteContext);
  if (context == null) {
    throw new Error('useSQLiteContext must be used within a <SQLiteProvider>');
  }
  return context;
}
