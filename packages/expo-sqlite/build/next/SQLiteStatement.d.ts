import { NativeDatabase } from './NativeDatabase';
import { SQLiteBindParams, SQLiteBindValue, NativeStatement, SQLiteVariadicBindParams, type SQLiteRunResult } from './NativeStatement';
export { SQLiteBindParams, SQLiteBindValue, SQLiteRunResult, SQLiteVariadicBindParams };
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
     * Get the column names of the prepared statement.
     */
    getColumnNamesAsync(): Promise<string[]>;
    /**
     * Reset the prepared statement cursor. This will call the [`sqlite3_reset()`](https://www.sqlite.org/c3ref/reset.html) C function under the hood.
     */
    resetAsync(): Promise<void>;
    /**
     * Finalize the prepared statement.
     * > **Note:** Remember to finalize the prepared statement whenever you call `prepareAsync()` to avoid resource leaks.
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
     * Get the column names of the prepared statement.
     */
    getColumnNamesSync(): string[];
    /**
     * Reset the prepared statement cursor. This will call the [`sqlite3_reset()`](https://www.sqlite.org/c3ref/reset.html) C function under the hood.
     */
    resetSync(): void;
    /**
     * Finalize the prepared statement.
     *
     * > **Note:** Remember to finalize the prepared statement whenever you call `prepareSync()` to avoid resource leaks.
     *
     */
    finalizeSync(): void;
}
/**
 * A result returned by [`SQLiteStatement.executeAsync()`](#executeasyncparams).
 *
 * @example
 * The result includes the [`lastInsertRowId`](https://www.sqlite.org/c3ref/last_insert_rowid.html) and [`changes`](https://www.sqlite.org/c3ref/changes.html) properties. You can get the information from the write operations.
 * ```ts
 * const statement = await db.prepareAsync('INSERT INTO Tests (value) VALUES (?)');
 * const result = await statement.executeAsync(101);
 * console.log('lastInsertRowId:', result.lastInsertRowId);
 * console.log('changes:', result.changes);
 * ```
 *
 * @example
 * The result implements the [`AsyncIterator`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/asyncIterator) interface, so you can use it in `for await...of` loops.
 * ```ts
 * const statement = await db.prepareAsync('SELECT value FROM Tests WHERE value > ?');
 * const result = await statement.executeAsync<{ value: number }>(100);
 * for await (const row of result) {
 *   console.log('row value:', row.value);
 * }
 * ```
 *
 * @example
 * If your write operations also return values, you can mix all of them together.
 * ```ts
 * const statement = await db.prepareAsync('INSERT INTO Tests (name, value) VALUES (?, ?) RETURNING name');
 * const result = await statement.executeAsync<{ name: string }>('John Doe', 101);
 * console.log('lastInsertRowId:', result.lastInsertRowId);
 * console.log('changes:', result.changes);
 * for await (const row of result) {
 *   console.log('name:', row.name);
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
     * Get the first row of the result set.
     */
    getFirstAsync(): Promise<T | null>;
    /**
     * Get all rows of the result set.
     */
    getAllAsync(): Promise<T[]>;
}
/**
 * A result returned by [`SQLiteStatement.executeSync()`](#executesyncparams).
 * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.

 * @example
 * The result includes the [`lastInsertRowId`](https://www.sqlite.org/c3ref/last_insert_rowid.html) and [`changes`](https://www.sqlite.org/c3ref/changes.html) properties. You can get the information from the write operations.
 * ```ts
 * const statement = db.prepareSync('INSERT INTO Tests (value) VALUES (?)');
 * const result = statement.executeSync(101);
 * console.log('lastInsertRowId:', result.lastInsertRowId);
 * console.log('changes:', result.changes);
 * ```
 *
 * @example
 * The result implements the [`Iterator`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator) interface, so you can use it in `for...of` loops.
 * ```ts
 * const statement = db.prepareSync('SELECT value FROM Tests WHERE value > ?');
 * const result = statement.executeSync<{ value: number }>(100);
 * for (const row of result) {
 *   console.log('row value:', row.value);
 * }
 * ```
 *
 * @example
 * If your write operations also return values, you can mix all of them together.
 * ```ts
 * const statement = db.prepareSync('INSERT INTO Tests (name, value) VALUES (?, ?) RETURNING name');
 * const result = statement.executeSync<{ name: string }>('John Doe', 101);
 * console.log('lastInsertRowId:', result.lastInsertRowId);
 * console.log('changes:', result.changes);
 * for (const row of result) {
 *   console.log('name:', row.name);
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
     * Get the first row of the result set.
     */
    getFirstSync(): T | null;
    /**
     * Get all rows of the result set.
     */
    getAllSync(): T[];
}
//# sourceMappingURL=SQLiteStatement.d.ts.map