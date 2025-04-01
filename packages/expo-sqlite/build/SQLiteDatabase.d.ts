import { type EventSubscription } from 'expo-modules-core';
import { NativeDatabase, SQLiteOpenOptions } from './NativeDatabase';
import { SQLiteBindParams, SQLiteRunResult, SQLiteStatement, SQLiteVariadicBindParams } from './SQLiteStatement';
export { SQLiteOpenOptions };
/**
 * A SQLite database.
 */
export declare class SQLiteDatabase {
    readonly databasePath: string;
    readonly options: SQLiteOpenOptions;
    private readonly nativeDatabase;
    constructor(databasePath: string, options: SQLiteOpenOptions, nativeDatabase: NativeDatabase);
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
     * [Serialize the database](https://sqlite.org/c3ref/serialize.html) as `Uint8Array`.
     *
     * @param databaseName The name of the current attached databases. The default value is `main` which is the default database name.
     */
    serializeAsync(databaseName?: string): Promise<Uint8Array>;
    /**
     * Create a [prepared SQLite statement](https://www.sqlite.org/c3ref/prepare.html).
     *
     * @param source A string containing the SQL query.
     */
    prepareAsync(source: string): Promise<SQLiteStatement>;
    /**
     * Execute a transaction and automatically commit/rollback based on the `task` result.
     *
     * > **Note:** This transaction is not exclusive and can be interrupted by other async queries.
     * @example
     * ```ts
     * db.withTransactionAsync(async () => {
     *   await db.execAsync('UPDATE test SET name = "aaa"');
     *
     *   //
     *   // We cannot control the order of async/await order, so order of execution is not guaranteed.
     *   // The following UPDATE query out of transaction may be executed here and break the expectation.
     *   //
     *
     *   const result = await db.getFirstAsync<{ name: string }>('SELECT name FROM Users');
     *   expect(result?.name).toBe('aaa');
     * });
     * db.execAsync('UPDATE test SET name = "bbb"');
     * ```
     * If you worry about the order of execution, use `withExclusiveTransactionAsync` instead.
     *
     * @param task An async function to execute within a transaction.
     */
    withTransactionAsync(task: () => Promise<void>): Promise<void>;
    /**
     * Execute a transaction and automatically commit/rollback based on the `task` result.
     *
     * The transaction may be exclusive.
     * As long as the transaction is converted into a write transaction,
     * the other async write queries will abort with `database is locked` error.
     *
     * @param task An async function to execute within a transaction. Any queries inside the transaction must be executed on the `txn` object.
     * The `txn` object has the same interfaces as the [`SQLiteDatabase`](#sqlitedatabase) object. You can use `txn` like a [`SQLiteDatabase`](#sqlitedatabase) object.
     *
     * @example
     * ```ts
     * db.withExclusiveTransactionAsync(async (txn) => {
     *   await txn.execAsync('UPDATE test SET name = "aaa"');
     * });
     * ```
     */
    withExclusiveTransactionAsync(task: (txn: Transaction) => Promise<void>): Promise<void>;
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
     * [Serialize the database](https://sqlite.org/c3ref/serialize.html) as `Uint8Array`.
     *
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
     *
     * @param databaseName The name of the current attached databases. The default value is `main` which is the default database name.
     */
    serializeSync(databaseName?: string): Uint8Array;
    /**
     * Create a [prepared SQLite statement](https://www.sqlite.org/c3ref/prepare.html).
     *
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
     *
     * @param source A string containing the SQL query.
     */
    prepareSync(source: string): SQLiteStatement;
    /**
     * Execute a transaction and automatically commit/rollback based on the `task` result.
     *
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
     *
     * @param task An async function to execute within a transaction.
     */
    withTransactionSync(task: () => void): void;
    /**
     * A convenience wrapper around [`SQLiteDatabase.prepareAsync()`](#prepareasyncsource), [`SQLiteStatement.executeAsync()`](#executeasyncparams), and [`SQLiteStatement.finalizeAsync()`](#finalizeasync).
     * @param source A string containing the SQL query.
     * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`SQLiteBindValue`](#sqlitebindvalue) for more information about binding values.
     */
    runAsync(source: string, params: SQLiteBindParams): Promise<SQLiteRunResult>;
    /**
     * @hidden
     */
    runAsync(source: string, ...params: SQLiteVariadicBindParams): Promise<SQLiteRunResult>;
    /**
     * A convenience wrapper around [`SQLiteDatabase.prepareAsync()`](#prepareasyncsource), [`SQLiteStatement.executeAsync()`](#executeasyncparams), [`SQLiteExecuteAsyncResult.getFirstAsync()`](#getfirstasync), and [`SQLiteStatement.finalizeAsync()`](#finalizeasync).
     * @param source A string containing the SQL query.
     * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`SQLiteBindValue`](#sqlitebindvalue) for more information about binding values.
     */
    getFirstAsync<T>(source: string, params: SQLiteBindParams): Promise<T | null>;
    /**
     * @hidden
     */
    getFirstAsync<T>(source: string, ...params: SQLiteVariadicBindParams): Promise<T | null>;
    /**
     * A convenience wrapper around [`SQLiteDatabase.prepareAsync()`](#prepareasyncsource), [`SQLiteStatement.executeAsync()`](#executeasyncparams), [`SQLiteExecuteAsyncResult`](#sqliteexecuteasyncresult) `AsyncIterator`, and [`SQLiteStatement.finalizeAsync()`](#finalizeasync).
     * @param source A string containing the SQL query.
     * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`SQLiteBindValue`](#sqlitebindvalue) for more information about binding values.
     * @returns Rather than returning Promise, this function returns an [`AsyncIterableIterator`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncIterator). You can use `for await...of` to iterate over the rows from the SQLite query result.
     */
    getEachAsync<T>(source: string, params: SQLiteBindParams): AsyncIterableIterator<T>;
    /**
     * @hidden
     */
    getEachAsync<T>(source: string, ...params: SQLiteVariadicBindParams): AsyncIterableIterator<T>;
    /**
     * A convenience wrapper around [`SQLiteDatabase.prepareAsync()`](#prepareasyncsource), [`SQLiteStatement.executeAsync()`](#executeasyncparams), [`SQLiteExecuteAsyncResult.getAllAsync()`](#getallasync), and [`SQLiteStatement.finalizeAsync()`](#finalizeasync).
     * @param source A string containing the SQL query.
     * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`SQLiteBindValue`](#sqlitebindvalue) for more information about binding values.
     * @example
     * ```ts
     * // For unnamed parameters, you pass values in an array.
     * db.getAllAsync('SELECT * FROM test WHERE intValue = ? AND name = ?', [1, 'Hello']);
     *
     * // For unnamed parameters, you pass values in variadic arguments.
     * db.getAllAsync('SELECT * FROM test WHERE intValue = ? AND name = ?', 1, 'Hello');
     *
     * // For named parameters, you should pass values in object.
     * db.getAllAsync('SELECT * FROM test WHERE intValue = $intValue AND name = $name', { $intValue: 1, $name: 'Hello' });
     * ```
     */
    getAllAsync<T>(source: string, params: SQLiteBindParams): Promise<T[]>;
    /**
     * @hidden
     */
    getAllAsync<T>(source: string, ...params: SQLiteVariadicBindParams): Promise<T[]>;
    /**
     * A convenience wrapper around [`SQLiteDatabase.prepareSync()`](#preparesyncsource), [`SQLiteStatement.executeSync()`](#executesyncparams), and [`SQLiteStatement.finalizeSync()`](#finalizesync).
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
     * @param source A string containing the SQL query.
     * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`SQLiteBindValue`](#sqlitebindvalue) for more information about binding values.
     */
    runSync(source: string, params: SQLiteBindParams): SQLiteRunResult;
    /**
     * @hidden
     */
    runSync(source: string, ...params: SQLiteVariadicBindParams): SQLiteRunResult;
    /**
     * A convenience wrapper around [`SQLiteDatabase.prepareSync()`](#preparesyncsource), [`SQLiteStatement.executeSync()`](#executesyncparams), [`SQLiteExecuteSyncResult.getFirstSync()`](#getfirstsync), and [`SQLiteStatement.finalizeSync()`](#finalizesync).
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
     * @param source A string containing the SQL query.
     * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`SQLiteBindValue`](#sqlitebindvalue) for more information about binding values.
     */
    getFirstSync<T>(source: string, params: SQLiteBindParams): T | null;
    /**
     * @hidden
     */
    getFirstSync<T>(source: string, ...params: SQLiteVariadicBindParams): T | null;
    /**
     * A convenience wrapper around [`SQLiteDatabase.prepareSync()`](#preparesyncsource), [`SQLiteStatement.executeSync()`](#executesyncparams), [`SQLiteExecuteSyncResult`](#sqliteexecutesyncresult) `Iterator`, and [`SQLiteStatement.finalizeSync()`](#finalizesync).
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
     * @param source A string containing the SQL query.
     * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`SQLiteBindValue`](#sqlitebindvalue) for more information about binding values.
     * @returns This function returns an [`IterableIterator`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator). You can use `for...of` to iterate over the rows from the SQLite query result.
     */
    getEachSync<T>(source: string, params: SQLiteBindParams): IterableIterator<T>;
    /**
     * @hidden
     */
    getEachSync<T>(source: string, ...params: SQLiteVariadicBindParams): IterableIterator<T>;
    /**
     * A convenience wrapper around [`SQLiteDatabase.prepareSync()`](#preparesyncsource), [`SQLiteStatement.executeSync()`](#executesyncparams), [`SQLiteExecuteSyncResult.getAllSync()`](#getallsync), and [`SQLiteStatement.finalizeSync()`](#finalizesync).
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
     * @param source A string containing the SQL query.
     * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`SQLiteBindValue`](#sqlitebindvalue) for more information about binding values.
     */
    getAllSync<T>(source: string, params: SQLiteBindParams): T[];
    /**
     * @hidden
     */
    getAllSync<T>(source: string, ...params: SQLiteVariadicBindParams): T[];
    /**
     * Synchronize the local database with the remote libSQL server.
     * This method is only available from libSQL integration.
     */
    syncLibSQL(): Promise<void>;
}
/**
 * The default directory for SQLite databases.
 */
export declare const defaultDatabaseDirectory: any;
/**
 * Open a database.
 *
 * @param databaseName The name of the database file to open.
 * @param options Open options.
 * @param directory The directory where the database file is located. The default value is `defaultDatabaseDirectory`.
 */
export declare function openDatabaseAsync(databaseName: string, options?: SQLiteOpenOptions, directory?: string): Promise<SQLiteDatabase>;
/**
 * Open a database.
 *
 * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
 *
 * @param databaseName The name of the database file to open.
 * @param options Open options.
 * @param directory The directory where the database file is located. The default value is `defaultDatabaseDirectory`.
 */
export declare function openDatabaseSync(databaseName: string, options?: SQLiteOpenOptions, directory?: string): SQLiteDatabase;
/**
 * Given a `Uint8Array` data and [deserialize to memory database](https://sqlite.org/c3ref/deserialize.html).
 *
 * @param serializedData The binary array to deserialize from [`SQLiteDatabase.serializeAsync()`](#serializeasyncdatabasename).
 * @param options Open options.
 */
export declare function deserializeDatabaseAsync(serializedData: Uint8Array, options?: SQLiteOpenOptions): Promise<SQLiteDatabase>;
/**
 * Given a `Uint8Array` data and [deserialize to memory database](https://sqlite.org/c3ref/deserialize.html).
 *
 * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
 *
 * @param serializedData The binary array to deserialize from [`SQLiteDatabase.serializeSync()`](#serializesyncdatabasename)
 * @param options Open options.
 */
export declare function deserializeDatabaseSync(serializedData: Uint8Array, options?: SQLiteOpenOptions): SQLiteDatabase;
/**
 * Delete a database file.
 *
 * @param databaseName The name of the database file to delete.
 * @param directory The directory where the database file is located. The default value is `defaultDatabaseDirectory`.
 */
export declare function deleteDatabaseAsync(databaseName: string, directory?: string): Promise<void>;
/**
 * Delete a database file.
 *
 * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
 *
 * @param databaseName The name of the database file to delete.
 * @param directory The directory where the database file is located. The default value is `defaultDatabaseDirectory`.
 */
export declare function deleteDatabaseSync(databaseName: string, directory?: string): void;
/**
 * The event payload for the listener of [`addDatabaseChangeListener`](#sqliteadddatabasechangelistenerlistener)
 */
export type DatabaseChangeEvent = {
    /** The database name. The value would be `main` by default and other database names if you use `ATTACH DATABASE` statement. */
    databaseName: string;
    /** The absolute file path to the database. */
    databaseFilePath: string;
    /** The table name. */
    tableName: string;
    /** The changed row ID. */
    rowId: number;
};
/**
 * Add a listener for database changes.
 * > Note: to enable this feature, you must set [`enableChangeListener` to `true`](#sqliteopenoptions) when opening the database.
 *
 * @param listener A function that receives the `databaseName`, `databaseFilePath`, `tableName` and `rowId` of the modified data.
 * @returns A `Subscription` object that you can call `remove()` on when you would like to unsubscribe the listener.
 */
export declare function addDatabaseChangeListener(listener: (event: DatabaseChangeEvent) => void): EventSubscription;
/**
 * A new connection specific used for [`withExclusiveTransactionAsync`](#withexclusivetransactionasynctask).
 * @hidden not going to pull all the database methods to the document.
 */
declare class Transaction extends SQLiteDatabase {
    static createAsync(db: SQLiteDatabase): Promise<Transaction>;
}
//# sourceMappingURL=SQLiteDatabase.d.ts.map