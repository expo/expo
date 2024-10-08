import { Asset } from 'expo-asset';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

import ExpoSQLite from './ExpoSQLite';
import type { SQLiteOpenOptions } from './NativeDatabase';
import { openDatabaseAsync, type SQLiteDatabase } from './SQLiteDatabase';
import { createDatabasePath } from './pathUtils';

export interface SQLiteProviderAssetSource {
  /**
   * The asset ID returned from the `require()` call.
   */
  assetId: number;

  /**
   * Force overwrite the local database file even if it already exists.
   * @default false
   */
  forceOverwrite?: boolean;
}

export interface SQLiteProviderProps {
  /**
   * The name of the database file to open.
   */
  databaseName: string;

  /**
   * The directory where the database file is located.
   * @default defaultDatabaseDirectory
   */
  directory?: string;

  /**
   * Open options.
   */
  options?: SQLiteOpenOptions;

  /**
   * Import a bundled database file from the specified asset module.
   * @example
   * ```ts
   * assetSource={{ assetId: require('./assets/db.db') }}
   * ```
   */
  assetSource?: SQLiteProviderAssetSource;

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
 *   console.log('sqlite version', db.getFirstSync('SELECT sqlite_version()'));
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

type DatabaseInstanceType = Pick<
  SQLiteProviderProps,
  'databaseName' | 'directory' | 'options' | 'onInit'
> & {
  promise: Promise<SQLiteDatabase> | null;
};

let databaseInstance: DatabaseInstanceType | null = null;

function SQLiteProviderSuspense({
  databaseName,
  directory,
  options,
  assetSource,
  children,
  onInit,
}: Omit<SQLiteProviderProps, 'onError' | 'useSuspense'>) {
  const databasePromise = getDatabaseAsync({
    databaseName,
    directory,
    options,
    assetSource,
    onInit,
  });
  const database = use(databasePromise);
  return <SQLiteContext.Provider value={database}>{children}</SQLiteContext.Provider>;
}

function SQLiteProviderNonSuspense({
  databaseName,
  directory,
  options,
  assetSource,
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
        const db = await openDatabaseWithInitAsync({
          databaseName,
          directory,
          options,
          assetSource,
          onInit,
        });
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
  }, [databaseName, directory, options, onInit]);

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
  directory,
  options,
  assetSource,
  onInit,
}: Pick<
  SQLiteProviderProps,
  'databaseName' | 'directory' | 'options' | 'assetSource' | 'onInit'
>): Promise<SQLiteDatabase> {
  if (
    databaseInstance?.promise != null &&
    databaseInstance?.databaseName === databaseName &&
    databaseInstance?.directory === directory &&
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
        return openDatabaseWithInitAsync({
          databaseName,
          directory,
          options,
          assetSource,
          onInit,
        });
      });
  } else {
    promise = openDatabaseWithInitAsync({ databaseName, directory, options, assetSource, onInit });
  }
  databaseInstance = {
    databaseName,
    directory,
    options,
    onInit,
    promise,
  };
  return promise;
}

async function openDatabaseWithInitAsync({
  databaseName,
  directory,
  options,
  assetSource,
  onInit,
}: Pick<
  SQLiteProviderProps,
  'databaseName' | 'directory' | 'options' | 'assetSource' | 'onInit'
>): Promise<SQLiteDatabase> {
  if (assetSource != null) {
    await importDatabaseFromAssetAsync(databaseName, assetSource, directory);
  }
  const database = await openDatabaseAsync(databaseName, options, directory);
  if (onInit != null) {
    await onInit(database);
  }
  return database;
}

/**
 * Imports an asset database into the SQLite database directory.
 *
 * Exposed only for testing purposes.
 * @hidden
 */
export async function importDatabaseFromAssetAsync(
  databaseName: string,
  assetSource: SQLiteProviderAssetSource,
  directory?: string
) {
  const asset = await Asset.fromModule(assetSource.assetId).downloadAsync();
  if (!asset.localUri) {
    throw new Error(`Unable to get the localUri from asset ${assetSource.assetId}`);
  }
  const path = createDatabasePath(databaseName, directory);
  await ExpoSQLite.importAssetDatabaseAsync(
    path,
    asset.localUri,
    assetSource.forceOverwrite ?? false
  );
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
