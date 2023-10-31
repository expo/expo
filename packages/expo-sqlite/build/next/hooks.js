import React, { createContext, useContext, useEffect, useState } from 'react';
import { openDatabaseAsync } from './Database';
// Create a context for the SQLite database
const SQLiteContext = createContext(null);
// Create a provider component
export function SQLiteProvider({ dbName, options, children, initHandler, loadingFallback, errorHandler, }) {
    const [database, setDatabase] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        async function setup() {
            try {
                const db = await openDatabaseAsync(dbName, options);
                setDatabase(db);
                if (initHandler != null) {
                    await initHandler(db);
                }
                setLoading(false);
            }
            catch (e) {
                setError(e);
            }
        }
        async function teardown() {
            try {
                await database?.closeAsync();
            }
            catch (e) {
                setError(e);
            }
        }
        setup();
        return () => {
            teardown();
        };
    }, [dbName, options, initHandler]);
    if (error != null) {
        const handler = errorHandler ??
            ((e) => {
                throw e;
            });
        handler(error);
    }
    if (loading) {
        return loadingFallback != null ? <>{loadingFallback}</> : null;
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
//# sourceMappingURL=hooks.js.map