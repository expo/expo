import { Asset } from 'expo-asset';
import React, { createContext, memo, useContext, useEffect, useRef, useState } from 'react';
import ExpoSQLite from './ExpoSQLite';
import { openDatabaseAsync } from './SQLiteDatabase';
import { createDatabasePath } from './pathUtils';
/**
 * Create a context for the SQLite database
 */
const SQLiteContext = createContext(null);
/**
 * Context.Provider component that provides a SQLite database to all children.
 * All descendants of this component will be able to access the database using the [`useSQLiteContext`](#usesqlitecontext) hook.
 */
export const SQLiteProvider = memo(function SQLiteProvider({ children, onError, useSuspense = false, ...props }) {
    if (onError != null && useSuspense) {
        throw new Error('Cannot use `onError` with `useSuspense`, use error boundaries instead.');
    }
    if (useSuspense) {
        return <SQLiteProviderSuspense {...props}>{children}</SQLiteProviderSuspense>;
    }
    return (<SQLiteProviderNonSuspense {...props} onError={onError}>
        {children}
      </SQLiteProviderNonSuspense>);
}, (prevProps, nextProps) => prevProps.databaseName === nextProps.databaseName &&
    deepEqual(prevProps.options, nextProps.options) &&
    deepEqual(prevProps.assetSource, nextProps.assetSource) &&
    prevProps.directory === nextProps.directory &&
    prevProps.onInit === nextProps.onInit &&
    prevProps.onError === nextProps.onError &&
    prevProps.useSuspense === nextProps.useSuspense);
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
export function useSQLiteContext() {
    const context = useContext(SQLiteContext);
    if (context == null) {
        throw new Error('useSQLiteContext must be used within a <SQLiteProvider>');
    }
    return context;
}
let databaseInstance = null;
function SQLiteProviderSuspense({ databaseName, directory, options, assetSource, children, onInit, }) {
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
function SQLiteProviderNonSuspense({ databaseName, directory, options, assetSource, children, onInit, onError, }) {
    const databaseRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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
            }
            catch (e) {
                setError(e);
            }
        }
        async function teardown(db) {
            try {
                await db?.closeAsync();
            }
            catch (e) {
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
        const handler = onError ??
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
function getDatabaseAsync({ databaseName, directory, options, assetSource, onInit, }) {
    if (databaseInstance?.promise != null &&
        databaseInstance?.databaseName === databaseName &&
        databaseInstance?.directory === directory &&
        databaseInstance?.options === options &&
        databaseInstance?.onInit === onInit) {
        return databaseInstance.promise;
    }
    let promise;
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
    }
    else {
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
async function openDatabaseWithInitAsync({ databaseName, directory, options, assetSource, onInit, }) {
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
export async function importDatabaseFromAssetAsync(databaseName, assetSource, directory) {
    const asset = await Asset.fromModule(assetSource.assetId).downloadAsync();
    if (!asset.localUri) {
        throw new Error(`Unable to get the localUri from asset ${assetSource.assetId}`);
    }
    const path = createDatabasePath(databaseName, directory);
    await ExpoSQLite.importAssetDatabaseAsync(path, asset.localUri, assetSource.forceOverwrite ?? false);
}
/**
 * Compares two objects deeply for equality.
 */
export function deepEqual(a, b) {
    if (a === b) {
        return true;
    }
    if (a == null || b == null) {
        return false;
    }
    if (typeof a !== 'object' || typeof b !== 'object') {
        return false;
    }
    return (Object.keys(a).length === Object.keys(b).length &&
        Object.keys(a).every((key) => deepEqual(a[key], b[key])));
}
// Referenced from https://github.com/reactjs/react.dev/blob/6570e6cd79a16ac3b1a2902632eddab7e6abb9ad/src/content/reference/react/Suspense.md
/**
 * A custom hook like [`React.use`](https://react.dev/reference/react/use) hook using private Suspense implementation.
 */
function use(promise) {
    if (isReactUsePromise(promise)) {
        if (promise.status === 'fulfilled') {
            if (promise.value === undefined) {
                throw new Error('[use] Unexpected undefined value from promise');
            }
            return promise.value;
        }
        else if (promise.status === 'rejected') {
            throw promise.reason;
        }
        else if (promise.status === 'pending') {
            throw promise;
        }
        throw new Error('[use] Promise is in an invalid state');
    }
    const suspensePromise = promise;
    suspensePromise.status = 'pending';
    suspensePromise.then((result) => {
        suspensePromise.status = 'fulfilled';
        suspensePromise.value = result;
    }, (reason) => {
        suspensePromise.status = 'rejected';
        suspensePromise.reason = reason;
    });
    throw suspensePromise;
}
function isReactUsePromise(promise) {
    return typeof promise === 'object' && promise !== null && 'status' in promise;
}
//#endregion
//# sourceMappingURL=hooks.js.map