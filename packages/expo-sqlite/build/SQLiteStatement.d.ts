import { NativeDatabase } from './NativeDatabase';
import { SQLiteBindParams, SQLiteBindValue, NativeStatement, SQLiteVariadicBindParams, type SQLiteRunResult } from './NativeStatement';
export { SQLiteBindParams, SQLiteBindValue, SQLiteRunResult, SQLiteVariadicBindParams };
type ValuesOf<T extends object> = T[keyof T][];
/**
 * A prepared statement returned by [`SQLiteDatabase.prepareAsync()`](#prepareasyncsource) or [`SQLiteDatabase.prepareSync()`](#preparesyncsource) that can be binded with parameters and executed.
 */
export declare class SQLiteStatement {
    private readonly nativeDatabase;
    private readonly nativeStatement;
    constructor(nativeDatabase: NativeDatabase, nativeStatement: NativeStatement);
    /**
     * Run the prepared statement and return the [`SQLiteExecuteAsyncResult`](#sqliteexecuteasyncresult) instance.
     * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`SQLiteBindValue`](#sqlitebindvalue) for more information about binding values.
     */
    executeAsync<T>(params: SQLiteBindParams): Promise<SQLiteExecuteAsyncResult<T>>;
    /**
     * @hidden
     */
    executeAsync<T>(...params: SQLiteVariadicBindParams): Promise<SQLiteExecuteAsyncResult<T>>;
    /**
     * Similar to [`executeAsync()`](#executeasyncparams) but returns the raw value array result instead of the row objects.
     * @hidden Advanced use only.
     */
    executeForRawResultAsync<T extends object>(params: SQLiteBindParams): Promise<SQLiteExecuteAsyncResult<ValuesOf<T>>>;
    /**
     * @hidden
     */
    executeForRawResultAsync<T extends object>(...params: SQLiteVariadicBindParams): Promise<SQLiteExecuteAsyncResult<ValuesOf<T>>>;
    /**
     * Get the column names of the prepared statement.
     */
    getColumnNamesAsync(): Promise<string[]>;
    /**
     * Finalize the prepared statement. This will call the [`sqlite3_finalize()`](https://www.sqlite.org/c3ref/finalize.html) C function under the hood.
     *
     * Attempting to access a finalized statement will result in an error.
     * > **Note:** While expo-sqlite will automatically finalize any orphaned prepared statements upon closing the database, it is considered best practice to manually finalize prepared statements as soon as they are no longer needed. This helps to prevent resource leaks. You can use the `try...finally` statement to ensure that prepared statements are finalized even if an error occurs.
     */
    finalizeAsync(): Promise<void>;
    /**
     * Run the prepared statement and return the [`SQLiteExecuteSyncResult`](#sqliteexecutesyncresult) instance.
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
     * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`SQLiteBindValue`](#sqlitebindvalue) for more information about binding values.
     */
    executeSync<T>(params: SQLiteBindParams): SQLiteExecuteSyncResult<T>;
    /**
     * @hidden
     */
    executeSync<T>(...params: SQLiteVariadicBindParams): SQLiteExecuteSyncResult<T>;
    /**
     * Similar to [`executeSync()`](#executesyncparams) but returns the raw value array result instead of the row objects.
     * @hidden Advanced use only.
     */
    executeForRawResultSync<T extends object>(params: SQLiteBindParams): SQLiteExecuteSyncResult<ValuesOf<T>>;
    /**
     * @hidden
     */
    executeForRawResultSync<T extends object>(...params: SQLiteVariadicBindParams): SQLiteExecuteSyncResult<ValuesOf<T>>;
    /**
     * Get the column names of the prepared statement.
     */
    getColumnNamesSync(): string[];
    /**
     * Finalize the prepared statement. This will call the [`sqlite3_finalize()`](https://www.sqlite.org/c3ref/finalize.html) C function under the hood.
     *
     * Attempting to access a finalized statement will result in an error.
     * > **Note:** While expo-sqlite will automatically finalize any orphaned prepared statements upon closing the database, it is considered best practice to manually finalize prepared statements as soon as they are no longer needed. This helps to prevent resource leaks. You can use the `try...finally` statement to ensure that prepared statements are finalized even if an error occurs.
     */
    finalizeSync(): void;
}
/**
 * A result returned by [`SQLiteStatement.executeAsync()`](#executeasyncparams).
 *
 * @example
 * The result includes the [`lastInsertRowId`](https://www.sqlite.org/c3ref/last_insert_rowid.html) and [`changes`](https://www.sqlite.org/c3ref/changes.html) properties. You can get the information from the write operations.
 * ```ts
 * const statement = await db.prepareAsync('INSERT INTO test (value) VALUES (?)');
 * try {
 *   const result = await statement.executeAsync(101);
 *   console.log('lastInsertRowId:', result.lastInsertRowId);
 *   console.log('changes:', result.changes);
 * } finally {
 *   await statement.finalizeAsync();
 * }
 * ```
 *
 * @example
 * The result implements the [`AsyncIterator`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/asyncIterator) interface, so you can use it in `for await...of` loops.
 * ```ts
 * const statement = await db.prepareAsync('SELECT value FROM test WHERE value > ?');
 * try {
 *   const result = await statement.executeAsync<{ value: number }>(100);
 *   for await (const row of result) {
 *     console.log('row value:', row.value);
 *   }
 * } finally {
 *   await statement.finalizeAsync();
 * }
 * ```
 *
 * @example
 * If your write operations also return values, you can mix all of them together.
 * ```ts
 * const statement = await db.prepareAsync('INSERT INTO test (name, value) VALUES (?, ?) RETURNING name');
 * try {
 *   const result = await statement.executeAsync<{ name: string }>('John Doe', 101);
 *   console.log('lastInsertRowId:', result.lastInsertRowId);
 *   console.log('changes:', result.changes);
 *   for await (const row of result) {
 *     console.log('name:', row.name);
 *   }
 * } finally {
 *   await statement.finalizeAsync();
 * }
 * ```
 */
export interface SQLiteExecuteAsyncResult<T> extends AsyncIterableIterator<T> {
    /**
     * The last inserted row ID. Returned from the [`sqlite3_last_insert_rowid()`](https://www.sqlite.org/c3ref/last_insert_rowid.html) function.
     */
    readonly lastInsertRowId: number;
    /**
     * The number of rows affected. Returned from the [`sqlite3_changes()`](https://www.sqlite.org/c3ref/changes.html) function.
     */
    readonly changes: number;
    /**
     * Get the first row of the result set. This requires the SQLite cursor to be in its initial state. If you have already retrieved rows from the result set, you need to reset the cursor first by calling [`resetAsync()`](#resetasync). Otherwise, an error will be thrown.
     */
    getFirstAsync(): Promise<T | null>;
    /**
     * Get all rows of the result set. This requires the SQLite cursor to be in its initial state. If you have already retrieved rows from the result set, you need to reset the cursor first by calling [`resetAsync()`](#resetasync). Otherwise, an error will be thrown.
     */
    getAllAsync(): Promise<T[]>;
    /**
     * Reset the prepared statement cursor. This will call the [`sqlite3_reset()`](https://www.sqlite.org/c3ref/reset.html) C function under the hood.
     */
    resetAsync(): Promise<void>;
}
/**
 * A result returned by [`SQLiteStatement.executeSync()`](#executesyncparams).
 * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.

 * @example
 * The result includes the [`lastInsertRowId`](https://www.sqlite.org/c3ref/last_insert_rowid.html) and [`changes`](https://www.sqlite.org/c3ref/changes.html) properties. You can get the information from the write operations.
 * ```ts
 * const statement = db.prepareSync('INSERT INTO test (value) VALUES (?)');
 * try {
 *   const result = statement.executeSync(101);
 *   console.log('lastInsertRowId:', result.lastInsertRowId);
 *   console.log('changes:', result.changes);
 * } finally {
 *   statement.finalizeSync();
 * }
 * ```
 *
 * @example
 * The result implements the [`Iterator`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator) interface, so you can use it in `for...of` loops.
 * ```ts
 * const statement = db.prepareSync('SELECT value FROM test WHERE value > ?');
 * try {
 *   const result = statement.executeSync<{ value: number }>(100);
 *   for (const row of result) {
 *     console.log('row value:', row.value);
 *   }
 * } finally {
 *   statement.finalizeSync();
 * }
 * ```
 *
 * @example
 * If your write operations also return values, you can mix all of them together.
 * ```ts
 * const statement = db.prepareSync('INSERT INTO test (name, value) VALUES (?, ?) RETURNING name');
 * try {
 *   const result = statement.executeSync<{ name: string }>('John Doe', 101);
 *   console.log('lastInsertRowId:', result.lastInsertRowId);
 *   console.log('changes:', result.changes);
 *   for (const row of result) {
 *     console.log('name:', row.name);
 *   }
 * } finally {
 *   statement.finalizeSync();
 * }
 * ```
 */
export interface SQLiteExecuteSyncResult<T> extends IterableIterator<T> {
    /**
     * The last inserted row ID. Returned from the [`sqlite3_last_insert_rowid()`](https://www.sqlite.org/c3ref/last_insert_rowid.html) function.
     */
    readonly lastInsertRowId: number;
    /**
     * The number of rows affected. Returned from the [`sqlite3_changes()`](https://www.sqlite.org/c3ref/changes.html) function.
     */
    readonly changes: number;
    /**
     * Get the first row of the result set. This requires the SQLite cursor to be in its initial state. If you have already retrieved rows from the result set, you need to reset the cursor first by calling [`resetSync()`](#resetsync). Otherwise, an error will be thrown.
     */
    getFirstSync(): T | null;
    /**
     * Get all rows of the result set. This requires the SQLite cursor to be in its initial state. If you have already retrieved rows from the result set, you need to reset the cursor first by calling [`resetSync()`](#resetsync). Otherwise, an error will be thrown.
     */
    getAllSync(): T[];
    /**
     * Reset the prepared statement cursor. This will call the [`sqlite3_reset()`](https://www.sqlite.org/c3ref/reset.html) C function under the hood.
     */
    resetSync(): void;
}
//# sourceMappingURL=SQLiteStatement.d.ts.map