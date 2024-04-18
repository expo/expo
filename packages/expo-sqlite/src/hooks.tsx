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
   * Handle errors from SQLiteProvider.
   * @default rethrow the error
   */
  onError?: (error: Error) => void;

  /**
   * Enable [`React.Suspense`](https://react.dev/reference/react/Suspense) integration.
   * @default false
   * @example
   * ```tsx
   * export default function App() {
   *   return (
   *     <Suspense fallback={<Text>Loading...</Text>}>
   *       <SQLiteProvider databaseName="test.db" useSuspense={true}>
   *         <Main />
   *       </SQLiteProvider>
   *     </Suspense>
   *   );
   * }
   * ```
   */
  useSuspense?: boolean;
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
  children,
  onError,
  useSuspense = false,
  ...props
}: SQLiteProviderProps) {
  if (onError != null && useSuspense) {
    throw new Error('Cannot use `onError` with `useSuspense`, use error boundaries instead.');
  }

  if (useSuspense) {
    return <SQLiteProviderSuspense {...props}>{children}</SQLiteProviderSuspense>;
  }

  return (
    <SQLiteProviderNonSuspense {...props} onError={onError}>
      {children}
    </SQLiteProviderNonSuspense>
  );
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

//#region Internals

type DatabaseInstanceType = Pick<SQLiteProviderProps, 'databaseName' | 'options' | 'onInit'> & {
  promise: Promise<SQLiteDatabase> | null;
};

let databaseInstance: DatabaseInstanceType | null = null;

function SQLiteProviderSuspense({
  databaseName,
  options,
  children,
  onInit,
}: Omit<SQLiteProviderProps, 'onError' | 'useSuspense'>) {
  const databasePromise = getDatabaseAsync({
    databaseName,
    options,
    onInit,
  });
  const database = use(databasePromise);
  return <SQLiteContext.Provider value={database}>{children}</SQLiteContext.Provider>;
}

function SQLiteProviderNonSuspense({
  databaseName,
  options,
  children,
  onInit,
  onError,
}: Omit<SQLiteProviderProps, 'useSuspense'>) {
  const databaseRef = useRef<SQLiteDatabase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function setup() {
      try {
        const db = await openDatabaseWithInitAsync({ databaseName, options, onInit });
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
    return null;
  }
  return <SQLiteContext.Provider value={databaseRef.current}>{children}</SQLiteContext.Provider>;
}

function getDatabaseAsync({
  databaseName,
  options,
  onInit,
}: Pick<SQLiteProviderProps, 'databaseName' | 'options' | 'onInit'>): Promise<SQLiteDatabase> {
  if (
    databaseInstance?.promise != null &&
    databaseInstance?.databaseName === databaseName &&
    databaseInstance?.options === options &&
    databaseInstance?.onInit === onInit
  ) {
    return databaseInstance.promise;
  }

  let promise: Promise<SQLiteDatabase>;
  if (databaseInstance?.promise != null) {
    promise = databaseInstance.promise
      .then((db) => {
        db.closeAsync();
      })
      .then(() => {
        return openDatabaseWithInitAsync({ databaseName, options, onInit });
      });
  } else {
    promise = openDatabaseWithInitAsync({ databaseName, options, onInit });
  }
  databaseInstance = {
    databaseName,
    options,
    onInit,
    promise,
  };
  return promise;
}

async function openDatabaseWithInitAsync({
  databaseName,
  options,
  onInit,
}: Pick<SQLiteProviderProps, 'databaseName' | 'options' | 'onInit'>): Promise<SQLiteDatabase> {
  const database = await openDatabaseAsync(databaseName, options);
  if (onInit != null) {
    await onInit(database);
  }
  return database;
}

//#endregion

//#region Private Suspense API similar to `React.use`

// Referenced from https://github.com/vercel/swr/blob/1d8110900d1aee3747199bfb377b149b7ff6848e/_internal/src/types.ts#L27-L31
type ReactUsePromise<T, E extends Error = Error> = Promise<T> & {
  status?: 'pending' | 'fulfilled' | 'rejected';
  value?: T;
  reason?: E;
};

// Referenced from https://github.com/reactjs/react.dev/blob/6570e6cd79a16ac3b1a2902632eddab7e6abb9ad/src/content/reference/react/Suspense.md
/**
 * A custom hook like [`React.use`](https://react.dev/reference/react/use) hook using private Suspense implementation.
 */
function use<T>(promise: Promise<T> | ReactUsePromise<T>) {
  if (isReactUsePromise(promise)) {
    if (promise.status === 'fulfilled') {
      if (promise.value === undefined) {
        throw new Error('[use] Unexpected undefined value from promise');
      }
      return promise.value;
    } else if (promise.status === 'rejected') {
      throw promise.reason;
    } else if (promise.status === 'pending') {
      throw promise;
    }
    throw new Error('[use] Promise is in an invalid state');
  }

  const suspensePromise = promise as ReactUsePromise<T>;
  suspensePromise.status = 'pending';
  suspensePromise.then(
    (result: T) => {
      suspensePromise.status = 'fulfilled';
      suspensePromise.value = result;
    },
    (reason) => {
      suspensePromise.status = 'rejected';
      suspensePromise.reason = reason;
    }
  );
  throw suspensePromise;
}

function isReactUsePromise<T>(
  promise: Promise<T> | ReactUsePromise<T>
): promise is ReactUsePromise<T> {
  return typeof promise === 'object' && promise !== null && 'status' in promise;
}

//#endregion
