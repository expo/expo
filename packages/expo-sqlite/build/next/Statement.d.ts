import { NativeDatabase } from './NativeDatabase';
import { BindParams, BindValue, NativeStatement, RunResult, VariadicBindParams, type ColumnNames, type ColumnValues } from './NativeStatement';
export { BindParams, BindValue, RunResult, VariadicBindParams };
/**
 * A prepared statement returned by [`Database.prepareAsync()`](#prepareasyncsource) or [`Database.prepareSync()`](#preparesyncsource) that can be binded with parameters and executed.
 */
export declare class Statement {
    private readonly nativeDatabase;
    private readonly nativeStatement;
    constructor(nativeDatabase: NativeDatabase, nativeStatement: NativeStatement);
    /**
     * Run the prepared statement and return the result.
     * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`BindValue`](#bindvalue) for more information about binding values.
     */
    runAsync(params: BindParams): Promise<RunResult>;
    /**
     * @hidden
     */
    runAsync(...params: VariadicBindParams): Promise<RunResult>;
    /**
     * Iterate the prepared statement and return results as an async iterable.
     * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`BindValue`](#bindvalue) for more information about binding values.
     * @example
     * ```ts
     * const statement = await db.prepareAsync('SELECT * FROM test');
     * for await (const row of statement.eachAsync<any>()) {
     *   console.log(row);
     * }
     * await statement.finalizeAsync();
     * ```
     */
    eachAsync<T>(params: BindParams): AsyncIterableIterator<T>;
    /**
     * @hidden
     */
    eachAsync<T>(...params: VariadicBindParams): AsyncIterableIterator<T>;
    /**
     * Get one row from the prepared statement.
     * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`BindValue`](#bindvalue) for more information about binding values.
     */
    getAsync<T>(params: BindParams): Promise<T | null>;
    /**
     * @hidden
     */
    getAsync<T>(...params: VariadicBindParams): Promise<T | null>;
    /**
     * Get all rows from the prepared statement.
     * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`BindValue`](#bindvalue) for more information about binding values.
     */
    allAsync<T>(params: BindParams): Promise<T[]>;
    /**
     * @hidden
     */
    allAsync<T>(...params: VariadicBindParams): Promise<T[]>;
    /**
     * Get the column names of the prepared statement.
     */
    getColumnNamesAsync(): Promise<string[]>;
    /**
     * Reset the prepared statement cursor.
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
     * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`BindValue`](#bindvalue) for more information about binding values.
     */
    runSync(params: BindParams): RunResult;
    /**
     * @hidden
     */
    runSync(...params: VariadicBindParams): RunResult;
    /**
     * Iterate the prepared statement and return results as an iterable.
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
     * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`BindValue`](#bindvalue) for more information about binding values.
     */
    eachSync<T>(params: BindParams): IterableIterator<T>;
    /**
     * @hidden
     */
    eachSync<T>(...params: VariadicBindParams): IterableIterator<T>;
    /**
     * Get one row from the prepared statement.
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
     * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`BindValue`](#bindvalue) for more information about binding values.
     */
    getSync<T>(params: BindParams): T | null;
    /**
     * @hidden
     */
    getSync<T>(...params: VariadicBindParams): T | null;
    /**
     * Get all rows from the prepared statement.
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
     * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`BindValue`](#bindvalue) for more information about binding values.
     */
    allSync<T>(params: BindParams): T[];
    /**
     * @hidden
     */
    allSync<T>(...params: VariadicBindParams): T[];
    /**
     * Get the column names of the prepared statement.
     */
    getColumnNamesSync(): string[];
    /**
     * Reset the prepared statement cursor.
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
 * Normalize the bind params to an array or object.
 * @hidden
 */
export declare function normalizeParams(...params: any[]): {
    params: BindParams;
    shouldPassAsObject: boolean;
};
/**
 * Compose `columnNames` and `columnValues` to an row object.
 * @hidden
 */
export declare function composeRow<T>(columnNames: ColumnNames, columnValues: ColumnValues): T;
/**
 * Compose `columnNames` and `columnValuesList` to an array of row objects.
 * @hidden
 */
export declare function composeRows<T>(columnNames: ColumnNames, columnValuesList: ColumnValues[]): T[];
//# sourceMappingURL=Statement.d.ts.map