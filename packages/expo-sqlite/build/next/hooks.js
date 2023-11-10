import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { openDatabaseAsync } from './Database';
// Create a context for the SQLite database
const SQLiteContext = createContext(null);
// Create a provider component
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
// Create a hook for accessing the SQLite database context
export function useSQLiteContext() {
    const context = useContext(SQLiteContext);
    if (context == null) {
        throw new Error('useSQLiteContext must be used within a <SQLiteProvider>');
    }
    return context;
}
//# sourceMappingURL=hooks.js.map