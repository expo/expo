import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { openDatabaseAsync } from './Database';
/**
 * Create a context for the SQLite database
 */
const SQLiteContext = createContext(null);
/**
 * Context.Provider component that provides a SQLite database to all children.
 * All descendants of this component will be able to access the database using the [`useSQLiteContext`](#usesqlitecontext) hook.
 */
export function SQLiteProvider({ dbName, options, children, initHandler, loadingFallback, errorHandler, }) {
    const databaseRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        async function setup() {
            try {
                const db = await openDatabaseAsync(dbName, options);
                if (initHandler != null) {
                    await initHandler(db);
                }
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
    }, [dbName, options, initHandler]);
    if (error != null) {
        const handler = errorHandler ??
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
 *     <SQLiteProvider dbName="test.db">
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
export function useSQLiteContext() {
    const context = useContext(SQLiteContext);
    if (context == null) {
        throw new Error('useSQLiteContext must be used within a <SQLiteProvider>');
    }
    return context;
}
//# sourceMappingURL=hooks.js.map