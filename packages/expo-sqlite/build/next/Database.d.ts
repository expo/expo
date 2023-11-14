import { Subscription } from 'expo-modules-core';
import { NativeDatabase, OpenOptions } from './NativeDatabase';
import { BindParams, RunResult, Statement, VariadicBindParams } from './Statement';
export { OpenOptions };
/**
 * A SQLite database.
 */
export declare class Database {
    readonly dbName: string;
    private readonly nativeDatabase;
    constructor(dbName: string, nativeDatabase: NativeDatabase);
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
     */
    prepareAsync(source: string): Promise<Statement>;
    /**
     * Execute a transaction and automatically commit/rollback based on the `task` result.
     *
     * > **Note:** This transaction is not exclusive and can be interrupted by other async queries.
     * @example
     * ```ts
     * db.transactionAsync(async () => {
     *   await db.execAsync('UPDATE test SET name = "aaa"');
     *
     *   //
     *   // We cannot control the order of async/await order, so order of execution is not guaranteed.
     *   // The following UPDATE query out of transaction may be executed here and break the expectation.
     *   //
     *
     *   const result = await db.getAsync<{ name: string }>('SELECT name FROM Users');
     *   expect(result?.name).toBe('aaa');
     * });
     * db.execAsync('UPDATE test SET name = "bbb"');
     * ```
     * If you worry about the order of execution, use `transactionExclusiveAsync` instead.
     *
     * @param task An async function to execute within a transaction.
     */
    transactionAsync(task: () => Promise<void>): Promise<void>;
    /**
     * Execute a transaction and automatically commit/rollback based on the `task` result.
     *
     * The transaction may be exclusive.
     * As long as the transaction is converted into a write transaction,
     * the other async write queries will abort with `database is locked` error.
     *
     * @param task An async function to execute within a transaction. Any queries inside the transaction must be executed on the `txn` object.
     * The `txn` object has the same interfaces as the `Database` object. You can use `txn` like a `Database` object.
     *
     * @example
     * ```ts
     * db.transactionExclusiveAsync(async (txn) => {
     *   await txn.execAsync('UPDATE test SET name = "aaa"');
     * });
     * ```
     */
    transactionExclusiveAsync(task: (txn: Transaction) => Promise<void>): Promise<void>;
    /**
     * Synchronous call to return whether the database is currently in a transaction.
     */
    isInTransactionSync(): boolean;
    /**
     * Close the database.
     */
    closeSync(): void;
    /**
     * Execute all SQL queries in the supplied string.
     *
     * > **Note:** The queries are not escaped for you! Be careful when constructing your queries.
     *
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
     *
     * @param source A string containing all the SQL queries.
     */
    execSync(source: string): void;
    /**
     * Prepare a SQL statement.
     *
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
     *
     * @param source A string containing the SQL query.
     */
    prepareSync(source: string): Statement;
    /**
     * Execute a transaction and automatically commit/rollback based on the `task` result.
     *
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
     *
     * @param task An async function to execute within a transaction.
     */
    transactionSync(task: () => void): void;
    /**
     * Shorthand for [`prepareAsync()`](#prepareasyncsource) and [`Statement.runAsync()`](#runasyncparams).
     * Unlike [`Statement.runAsync()`](#runasyncparams), this method finalizes the statement after execution.
     * @param source A string containing the SQL query.
     * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`BindValue`](#bindvalue) for more information about binding values.
     */
    runAsync(source: string, params: BindParams): Promise<RunResult>;
    /**
     * @hidden
     */
    runAsync(source: string, ...params: VariadicBindParams): Promise<RunResult>;
    /**
     * Shorthand for [`prepareAsync()`](#prepareasyncsource) and [`Statement.getAsync()`](#getasyncparams).
     * Unlike [`Statement.getAsync()`](#getasyncparams), this method finalizes the statement after execution.
     * @param source A string containing the SQL query.
     * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`BindValue`](#bindvalue) for more information about binding values.
     */
    getAsync<T>(source: string, params: BindParams): Promise<T | null>;
    /**
     * @hidden
     */
    getAsync<T>(source: string, ...params: VariadicBindParams): Promise<T | null>;
    /**
     * Shorthand for [`prepareAsync()`](#prepareasyncsource) and [`Statement.eachAsync()`](#eachasyncparams).
     * Unlike [`Statement.eachAsync()`](#eachasyncparams), this method finalizes the statement after execution.
     * @param source A string containing the SQL query.
     * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`BindValue`](#bindvalue) for more information about binding values.
     */
    eachAsync<T>(source: string, params: BindParams): AsyncIterableIterator<T>;
    /**
     * @hidden
     */
    eachAsync<T>(source: string, ...params: VariadicBindParams): AsyncIterableIterator<T>;
    /**
     * Shorthand for [`prepareAsync()`](#prepareasyncsource) and [`Statement.allAsync()`](#allasyncparams).
     * Unlike [`Statement.allAsync()`](#allasyncparams), this method finalizes the statement after execution.
     * @param source A string containing the SQL query.
     * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`BindValue`](#bindvalue) for more information about binding values.
     * @example
     * ```ts
     * // For unnamed parameters, you pass values in an array.
     * db.allAsync('SELECT * FROM test WHERE intValue = ? AND name = ?', [1, 'Hello']);
     *
     * // For unnamed parameters, you pass values in variadic arguments.
     * db.allAsync('SELECT * FROM test WHERE intValue = ? AND name = ?', 1, 'Hello');
     *
     * // For named parameters, you should pass values in object.
     * db.allAsync('SELECT * FROM test WHERE intValue = $intValue AND name = $name', { $intValue: 1, $name: 'Hello' });
     * ```
     */
    allAsync<T>(source: string, params: BindParams): Promise<T[]>;
    /**
     * @hidden
     */
    allAsync<T>(source: string, ...params: VariadicBindParams): Promise<T[]>;
    /**
     * Shorthand for [`prepareAsync()`](#prepareasyncsource) and [`Statement.runSync()`](#runsyncparams).
     * Unlike [`Statement.runSync()`](#runsyncparams), this method finalizes the statement after execution.
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
     * @param source A string containing the SQL query.
     * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`BindValue`](#bindvalue) for more information about binding values.
     */
    runSync(source: string, params: BindParams): RunResult;
    /**
     * @hidden
     */
    runSync(source: string, ...params: VariadicBindParams): RunResult;
    /**
     * Shorthand for [`prepareAsync()`](#prepareasyncsource) and [`Statement.getSync()`](#getsyncparams).
     * Unlike [`Statement.getSync()`](#getsyncparams), this method finalizes the statement after execution.
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
     * @param source A string containing the SQL query.
     * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`BindValue`](#bindvalue) for more information about binding values.
     */
    getSync<T>(source: string, params: BindParams): T | null;
    /**
     * @hidden
     */
    getSync<T>(source: string, ...params: VariadicBindParams): T | null;
    /**
     * Shorthand for [`prepareAsync()`](#prepareasyncsource) and [`Statement.eachSync()`](#eachsyncparams).
     * Unlike [`Statement.eachSync()`](#eachsyncparams), this method finalizes the statement after execution.
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
     * @param source A string containing the SQL query.
     * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`BindValue`](#bindvalue) for more information about binding values.
     */
    eachSync<T>(source: string, params: BindParams): IterableIterator<T>;
    /**
     * @hidden
     */
    eachSync<T>(source: string, ...params: VariadicBindParams): IterableIterator<T>;
    /**
     * Shorthand for [`prepareAsync()`](#prepareasyncsource) and [`Statement.allSync()`](#allsyncparams).
     * Unlike [`Statement.allSync()`](#allsyncparams), this method finalizes the statement after execution.
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
     * @param source A string containing the SQL query.
     * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`BindValue`](#bindvalue) for more information about binding values.
     */
    allSync<T>(source: string, params: BindParams): T[];
    /**
     * @hidden
     */
    allSync<T>(source: string, ...params: VariadicBindParams): T[];
}
/**
 * Open a database.
 *
 * @param dbName The name of the database file to open.
 * @param options Open options.
 */
export declare function openDatabaseAsync(dbName: string, options?: OpenOptions): Promise<Database>;
/**
 * Open a database.
 *
 * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
 *
 * @param dbName The name of the database file to open.
 * @param options Open options.
 */
export declare function openDatabaseSync(dbName: string, options?: OpenOptions): Database;
/**
 * Delete a database file.
 *
 * @param dbName The name of the database file to delete.
 */
export declare function deleteDatabaseAsync(dbName: string): Promise<void>;
/**
 * Delete a database file.
 *
 * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
 *
 * @param dbName The name of the database file to delete.
 */
export declare function deleteDatabaseSync(dbName: string): void;
/**
 * The event payload for the listener of [`addDatabaseChangeListener`](#sqliteadddatabasechangelistenerlistener)
 */
export type DatabaseChangeEvent = {
    /** The database name. The value would be `main` by default and other database names if you use `ATTACH DATABASE` statement. */
    dbName: string;
    /** The absolute file path to the database. */
    dbFilePath: string;
    /** The table name. */
    tableName: string;
    /** The changed row ID. */
    rowId: number;
};
/**
 * Add a listener for database changes.
 * > Note: to enable this feature, you must set [`enableChangeListener` to `true`](#openoptions) when opening the database.
 *
 * @param listener A function that receives the `dbFilePath`, `dbName`, `tableName` and `rowId` of the modified data.
 * @returns A `Subscription` object that you can call `remove()` on when you would like to unsubscribe the listener.
 */
export declare function addDatabaseChangeListener(listener: (event: DatabaseChangeEvent) => void): Subscription;
/**
 * A new connection specific used for [`transactionExclusiveAsync`](#transactionexclusiveasynctask).
 * @hidden not going to pull all the database methods to the document.
 */
declare class Transaction extends Database {
    static createAsync(db: Database): Promise<Transaction>;
}
//# sourceMappingURL=Database.d.ts.map