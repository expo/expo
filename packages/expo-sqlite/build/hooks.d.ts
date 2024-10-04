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
export declare function SQLiteProvider({ children, onError, useSuspense, ...props }: SQLiteProviderProps): JSX.Element;
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
export declare function useSQLiteContext(): SQLiteDatabase;
//# sourceMappingURL=hooks.d.ts.map