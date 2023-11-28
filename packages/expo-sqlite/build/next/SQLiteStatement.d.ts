import { NativeDatabase } from './NativeDatabase';
import { SQLiteBindBlobParams, SQLiteBindParams, SQLiteBindPrimitiveParams, SQLiteBindValue, NativeStatement, SQLiteRunResult, SQLiteVariadicBindParams, type SQLiteColumnNames, type SQLiteColumnValues } from './NativeStatement';
export { SQLiteBindParams, SQLiteBindValue, SQLiteRunResult, SQLiteVariadicBindParams };
/**
 * A prepared statement returned by [`Database.prepareAsync()`](#prepareasyncsource) or [`Database.prepareSync()`](#preparesyncsource) that can be binded with parameters and executed.
 */
export declare class SQLiteStatement {
    private readonly nativeDatabase;
    private readonly nativeStatement;
    constructor(nativeDatabase: NativeDatabase, nativeStatement: NativeStatement);
    /**
     * Run the prepared statement and return the result.
     * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`SQLiteBindValue`](#sqlitebindvalue) for more information about binding values.
     */
    runAsync(params: SQLiteBindParams): Promise<SQLiteRunResult>;
    /**
     * @hidden
     */
    runAsync(...params: SQLiteVariadicBindParams): Promise<SQLiteRunResult>;
    /**
     * Iterate the prepared statement and return results as an async iterable.
     * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`SQLiteBindValue`](#sqlitebindvalue) for more information about binding values.
     * @example
     * ```ts
     * const statement = await db.prepareAsync('SELECT * FROM test');
     * for await (const row of statement.eachAsync<any>()) {
     *   console.log(row);
     * }
     * await statement.finalizeAsync();
     * ```
     */
    eachAsync<T>(params: SQLiteBindParams): AsyncGenerator<T>;
    /**
     * @hidden
     */
    eachAsync<T>(...params: SQLiteVariadicBindParams): AsyncGenerator<T>;
    /**
     * Get one row from the prepared statement.
     * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`SQLiteBindValue`](#sqlitebindvalue) for more information about binding values.
     */
    getAsync<T>(params: SQLiteBindParams): Promise<T | null>;
    /**
     * @hidden
     */
    getAsync<T>(...params: SQLiteVariadicBindParams): Promise<T | null>;
    /**
     * Get all rows from the prepared statement.
     * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`SQLiteBindValue`](#sqlitebindvalue) for more information about binding values.
     */
    allAsync<T>(params: SQLiteBindParams): Promise<T[]>;
    /**
     * @hidden
     */
    allAsync<T>(...params: SQLiteVariadicBindParams): Promise<T[]>;
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
     * Run the prepared statement and return the result.
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
     * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`SQLiteBindValue`](#sqlitebindvalue) for more information about binding values.
     */
    runSync(params: SQLiteBindParams): SQLiteRunResult;
    /**
     * @hidden
     */
    runSync(...params: SQLiteVariadicBindParams): SQLiteRunResult;
    /**
     * Iterate the prepared statement and return results as an iterable.
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
     * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`SQLiteBindValue`](#sqlitebindvalue) for more information about binding values.
     */
    eachSync<T>(params: SQLiteBindParams): Generator<T>;
    /**
     * @hidden
     */
    eachSync<T>(...params: SQLiteVariadicBindParams): Generator<T>;
    /**
     * Get one row from the prepared statement.
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
     * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`SQLiteBindValue`](#sqlitebindvalue) for more information about binding values.
     */
    getSync<T>(params: SQLiteBindParams): T | null;
    /**
     * @hidden
     */
    getSync<T>(...params: SQLiteVariadicBindParams): T | null;
    /**
     * Get all rows from the prepared statement.
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
     * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`SQLiteBindValue`](#sqlitebindvalue) for more information about binding values.
     */
    allSync<T>(params: SQLiteBindParams): T[];
    /**
     * @hidden
     */
    allSync<T>(...params: SQLiteVariadicBindParams): T[];
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
 * Normalize the bind params to data structure that can be passed to native module.
 * The data structure is a tuple of [primitiveParams, blobParams, shouldPassAsArray].
 * @hidden
 */
export declare function normalizeParams(...params: any[]): [SQLiteBindPrimitiveParams, SQLiteBindBlobParams, boolean];
/**
 * Compose `columnNames` and `columnValues` to an row object.
 * @hidden
 */
export declare function composeRow<T>(columnNames: SQLiteColumnNames, columnValues: SQLiteColumnValues): T;
/**
 * Compose `columnNames` and `columnValuesList` to an array of row objects.
 * @hidden
 */
export declare function composeRows<T>(columnNames: SQLiteColumnNames, columnValuesList: SQLiteColumnValues[]): T[];
//# sourceMappingURL=SQLiteStatement.d.ts.map