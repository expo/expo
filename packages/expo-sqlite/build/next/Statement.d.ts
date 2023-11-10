import { NativeDatabase } from './NativeDatabase';
import { BindParams, BindValue, NativeStatement, RunResult, VariadicBindParams, type ColumnNames, type ColumnValues } from './NativeStatement';
export { BindParams, BindValue, RunResult, VariadicBindParams };
/**
 * A prepared statement returned by `Database.prepareAsync()` that can be binded with parameters and executed.
 */
export declare class Statement {
    private readonly nativeDatabase;
    private readonly nativeStatement;
    constructor(nativeDatabase: NativeDatabase, nativeStatement: NativeStatement);
    /**
     * Run the prepared statement and return the result.
     *
     * @param params @see `BindParams`
     */
    runAsync(...params: VariadicBindParams): Promise<RunResult>;
    runAsync(params: BindParams): Promise<RunResult>;
    /**
     * Iterate the prepared statement and return results as an async iterable.
     *
     * @param params @see `BindParams`
     *
     * @example
     * ```ts
     * const statement = await db.prepareAsync('SELECT * FROM test');
     * for await (const row of statement.eachAsync<any>()) {
     *   console.log(row);
     * }
     * ```
     */
    eachAsync<T>(...params: VariadicBindParams): AsyncIterableIterator<T>;
    eachAsync<T>(params: BindParams): AsyncIterableIterator<T>;
    /**
     * Get one row from the prepared statement.
     *
     * @param params @see `BindParams`
     */
    getAsync<T>(...params: VariadicBindParams): Promise<T | null>;
    getAsync<T>(params: BindParams): Promise<T | null>;
    /**
     * Get all rows from the prepared statement.
     *
     * @param params @see `BindParams`
     */
    allAsync<T>(...params: VariadicBindParams): Promise<T[]>;
    allAsync<T>(params: BindParams): Promise<T[]>;
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
     *
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread, affecting performance.
     *
     * @param params @see `BindParams`
     */
    runSync(...params: VariadicBindParams): RunResult;
    runSync(params: BindParams): RunResult;
    /**
     * Iterate the prepared statement and return results as an iterable.
     *
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread, affecting performance.
     *
     * @param params @see `BindParams`
     *
     * @example
     * ```ts
     * const statement = await db.prepareSync('SELECT * FROM test');
     * for (const row of statement.eachSync<any>()) {
     *   console.log(row);
     * }
     * ```
     */
    eachSync<T>(...params: VariadicBindParams): IterableIterator<T>;
    eachSync<T>(params: BindParams): IterableIterator<T>;
    /**
     * Get one row from the prepared statement.
     *
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread, affecting performance.
     *
     * @param params @see `BindParams`
     */
    getSync<T>(...params: VariadicBindParams): T | null;
    getSync<T>(params: BindParams): T | null;
    /**
     * Get all rows from the prepared statement.
     *
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread, affecting performance.
     *
     * @param params @see `BindParams`
     */
    allSync<T>(...params: VariadicBindParams): T[];
    allSync<T>(params: BindParams): T[];
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
 * Compose `columnNames` and `columnValuesList` to an array of row object.
 * @hidden
 */
export declare function composeRows<T>(columnNames: ColumnNames, columnValuesList: ColumnValues[]): T[];
//# sourceMappingURL=Statement.d.ts.map