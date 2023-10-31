import React from 'react';
import { Database } from './Database';
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
     * Handle errors from SQLiteProvider.
     * @default throw
     */
    errorHandler?: (error: Error) => void;
}
export declare function SQLiteProvider({ dbName, options, children, errorHandler }: SQLiteProviderProps): JSX.Element | null;
export declare function useSQLiteContext(): Database;
//# sourceMappingURL=hooks.d.ts.map