import { NativeDatabase } from './NativeDatabase';
import { BindParams, BindValue, NativeStatement, RunResult, VariadicBindParams } from './NativeStatement';
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
     * Reset the prepared statement cursor.
     */
    resetAsync(): Promise<void>;
    /**
     * Finalize the prepared statement.
     * > **Note:** Remember to finalize the prepared statement whenever you call `prepareAsync()` to avoid resource leaks.
     */
    finalizeAsync(): Promise<void>;
}
/**
 * Normalize the bind params to an array or object.
 * @hidden
 */
export declare function normalizeParams(...params: any[]): {
    params: BindParams;
    shouldPassAsObject: boolean;
};
//# sourceMappingURL=Statement.d.ts.map