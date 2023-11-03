import React from 'react';
import { type Database } from './Database';
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
/**
 * Context.Provider component that provides a SQLite database to all children.
 * All descendants of this component will be able to access the database using the [`useSQLiteContext`](#usesqlitecontext) hook.
 */
export declare function SQLiteProvider({ dbName, options, children, initHandler, loadingFallback, errorHandler, }: SQLiteProviderProps): JSX.Element | null;
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
 *  const db = useSQLiteContext();
 *  console.log('sqlite version', db.getSync('SELECT sqlite_version()'));
 *  return <View />
 * }
 * ```
 */
export declare function useSQLiteContext(): Database;
//# sourceMappingURL=hooks.d.ts.map