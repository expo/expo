import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

import type { SQLiteOpenOptions } from './NativeDatabase';
import { openDatabaseAsync, type SQLiteDatabase } from './SQLiteDatabase';

export interface SQLiteProviderProps {
  /**
   * The name of the database file to open.
   */
  databaseName: string;

  /**
   * Open options.
   */
  options?: SQLiteOpenOptions;

  /**
   * The children to render.
   */
  children: React.ReactNode;

  /**
   * A custom initialization handler to run before rendering the children.
   * You can use this to run database migrations or other setup tasks.
   */
  onInit?: (db: SQLiteDatabase) => Promise<void>;

  /**
   * A custom loading fallback to render before the database is ready.
   * @default null
   */
  loadingFallback?: React.ReactNode;

  /**
   * Handle errors from SQLiteProvider.
   * @default rethrow the error
   */
  onError?: (error: Error) => void;
}

/**
 * Create a context for the SQLite database
 */
const SQLiteContext = createContext<SQLiteDatabase | null>(null);

/**
 * Context.Provider component that provides a SQLite database to all children.
 * All descendants of this component will be able to access the database using the [`useSQLiteContext`](#usesqlitecontext) hook.
 */
export function SQLiteProvider({
  databaseName,
  options,
  children,
  onInit,
  loadingFallback,
  onError,
}: SQLiteProviderProps) {
  const databaseRef = useRef<SQLiteDatabase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function setup() {
      try {
        const db = await openDatabaseAsync(databaseName, options);
        if (onInit != null) {
          await onInit(db);
        }
        databaseRef.current = db;
        setLoading(false);
      } catch (e) {
        setError(e);
      }
    }

    async function teardown(db: SQLiteDatabase | null) {
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
  }, [databaseName, options, onInit]);

  if (error != null) {
    const handler =
      onError ??
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

/**
 * A global hook for accessing the SQLite database across components.
 * This hook should only be used within a [`<SQLiteProvider>`](#sqliteprovider) component.
 *
 * @example
 * ```tsx
 * export default function App() {
 *   return (
 *     <SQLiteProvider databaseName="test.db">
 *       <Main />
 *     </SQLiteProvider>
 *   );
 * }
 *
 * export function Main() {
 *   const db = useSQLiteContext();
 *   console.log('sqlite version', db.getSync('SELECT sqlite_version()'));
 *   return <View />
 * }
 * ```
 */
export function useSQLiteContext(): SQLiteDatabase {
  const context = useContext(SQLiteContext);
  if (context == null) {
    throw new Error('useSQLiteContext must be used within a <SQLiteProvider>');
  }
  return context;
}
