import React from 'react';
import type { SQLiteOpenOptions } from './NativeDatabase';
import { type SQLiteDatabase } from './SQLiteDatabase';
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
 * Context.Provider component that provides a SQLite database to all children.
 * All descendants of this component will be able to access the database using the [`useSQLiteContext`](#usesqlitecontext) hook.
 */
export declare const SQLiteProvider: React.NamedExoticComponent<SQLiteProviderProps>;
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
export declare function useSQLiteContext(): SQLiteDatabase;
/**
 * Imports an asset database into the SQLite database directory.
 *
 * Exposed only for testing purposes.
 * @hidden
 */
export declare function importDatabaseFromAssetAsync(databaseName: string, assetSource: SQLiteProviderAssetSource, directory?: string): Promise<void>;
/**
 * Compares two objects deeply for equality.
 */
export declare function deepEqual(a: {
    [key: string]: any;
} | undefined, b: {
    [key: string]: any;
} | undefined): boolean;
//# sourceMappingURL=hooks.d.ts.map