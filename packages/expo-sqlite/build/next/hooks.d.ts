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
export declare function SQLiteProvider({ dbName, options, children, initHandler, loadingFallback, errorHandler, }: SQLiteProviderProps): JSX.Element | null;
export declare function useSQLiteContext(): Database;
//# sourceMappingURL=hooks.d.ts.map