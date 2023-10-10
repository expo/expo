import { Subscription } from 'expo-modules-core';
import { BindParams, RunResult, Statement, VariadicBindParams } from './Statement';
/**
 * Options for opening a database.
 */
export interface OpenOptions {
    /**
     * Whether to enable the CR-SQLite extension.
     * @default false
     */
    enableCRSQLite?: boolean;
    /**
     * Whether to call the `sqlite3_update_hook` function and enable the `onDatabaseChange` events.
     * @default false
     */
    enableChangeListener?: boolean;
}
/**
 * A SQLite database.
 */
export declare class Database {
    readonly dbName: string;
    private readonly options?;
    private databaseId;
    private constructor();
    private openAsync;
    /**
     * Open a database.
     *
     * @param dbName The name of the database file to open.
     * @param options Open options.
     * @returns Database object.
     */
    static openDatabaseAsync(dbName: string, options?: OpenOptions): Promise<Database>;
    /**
     * Delete a database file.
     *
     * @param dbName The name of the database file to delete.
     */
    static deleteDatabaseAsync(dbName: string): Promise<void>;
    /**
     * Synchronous call to return whether the database is currently in a transaction.
     */
    isInTransaction(): boolean;
    /**
     * Asynchronous call to return whether the database is currently in a transaction.
     */
    isInTransactionAsync(): Promise<boolean>;
    /**
     * Close the database.
     */
    closeAsync(): Promise<void>;
    /**
     * Execute all SQL queries in the supplied string.
     * > Note: The queries are not escaped for you! Be careful when constructing your queries.
     *
     * @param source A string containing all the SQL queries.
     */
    execAsync(source: string): Promise<void>;
    /**
     * Prepare a SQL statement.
     *
     * @param source A string containing the SQL query.
     * @returns A `Statement` object.
     */
    prepareAsync(source: string): Promise<Statement>;
    /**
     * Execute a transaction and automatically commit/rollback based on the `txn` success.
     *
     * @param txn An async function to execute within a transaction.
     */
    transactionAsync(txn: () => Promise<void>): Promise<void>;
    /**
     * Add a listener for database changes.
     * > Note: to enable this feature, you must set `enableChangeListener` to `true` when opening the database.
     *
     * @param listener A function that receives the `dbName`, `tableName` and `rowId` of the modified data.
     * @returns A `Subscription` object that you can call `remove()` on when you would like to unsubscribe the listener.
     */
    addDatabaseChangeListener(listener: (event: {
        dbName: string;
        tableName: string;
        rowId: number;
    }) => void): Subscription;
    /**
     * Shorthand for `prepareAsync` and `Statement.runAsync`.
     * Unlike `Statement.runAsync`, this method finalizes the statement after execution.
     *
     * @param source A string containing the SQL query.
     * @param params Parameters to bind to the query.
     */
    runAsync(source: string, ...params: VariadicBindParams): Promise<RunResult>;
    runAsync(source: string, params: BindParams): Promise<RunResult>;
    /**
     * Shorthand for `prepareAsync` and `Statement.getAsync`.
     * Unlike `Statement.getAsync`, this method finalizes the statement after execution.
     *
     * @param source A string containing the SQL query.
     * @param params Parameters to bind to the query.
     */
    getAsync<T>(source: string, ...params: VariadicBindParams): Promise<T | null>;
    getAsync<T>(source: string, params: BindParams): Promise<T | null>;
    /**
     * Shorthand for `prepareAsync` and `Statement.eachAsync`.
     * Unlike `Statement.eachAsync`, this method finalizes the statement after execution.
     *
     * @param source A string containing the SQL query.
     * @param params Parameters to bind to the query.
     */
    eachAsync<T>(source: string, ...params: VariadicBindParams): AsyncIterableIterator<T>;
    eachAsync<T>(source: string, params: BindParams): AsyncIterableIterator<T>;
    /**
     * Shorthand for `prepareAsync` and `Statement.allAsync`.
     * Unlike `Statement.allAsync`, this method finalizes the statement after execution.
     *
     * @param source A string containing the SQL query.
     * @param params Parameters to bind to the query.
     */
    allAsync<T>(source: string, ...params: VariadicBindParams): Promise<T[]>;
    allAsync<T>(source: string, params: BindParams): Promise<T[]>;
}
export declare const openDatabaseAsync: typeof Database.openDatabaseAsync;
export declare const deleteDatabaseAsync: typeof Database.deleteDatabaseAsync;
//# sourceMappingURL=Database.d.ts.map