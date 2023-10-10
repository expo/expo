/**
 * Result of a `runAsync` call.
 */
export interface RunResult {
    /**
     * The last inserted row ID.
     */
    lastID: number;
    /**
     * The number of rows affected.
     */
    changes: number;
}
/**
 * Bind parameters to the prepared statement.
 * You can either pass the parameters in the following forms:
 *
 * @example
 * - Variadic arguments for unnamed parameters.
 * ```ts
 * const statement = await db.prepareAsync('SELECT * FROM test WHERE value = ? AND intValue = ?');
 * await statement.getAsync('test1', 789);
 * ```
 *
 * @example
 * - A single array for unnamed parameters.
 * ```ts
 * const statement = await db.prepareAsync('SELECT * FROM test WHERE value = ? AND intValue = ?');
 * await statement.getAsync(['test1', 789]);
 * ```
 *
 * @example
 * - A single object for [named parameters](https://www.sqlite.org/lang_expr.html)
 *
 *   Through we support multiple named parameter forms like `:VVV`, `@VVV`, and `$VVV`. We recommend using `$VVV` because JavaScript allows using `$` in identifiers without escaping.
 * ```ts
 * const statement = await db.prepareAsync('SELECT * FROM test WHERE value = $value AND intValue = $intValue');
 * await statement.getAsync({ $value: 'test1', $intValue: 789 });
 * ```
 */
export type BindValue = string | number | null | boolean;
export type BindParams = Record<string, BindValue> | BindValue[];
export type VariadicBindParams = BindValue[];
/**
 * A prepared statement returned by `Database.prepareAsync()` that can be binded with parameters and executed.
 */
export declare class Statement {
    readonly databaseId: number;
    readonly statementId: number;
    /**
     * @internal
     */
    constructor(databaseId: number, statementId: number);
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