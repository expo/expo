/**
 * A result returned by [`SQLiteDatabase.runAsync`](#runasyncsource-params) or [`SQLiteDatabase.runSync`](#runsyncsource-params).
 */
export interface SQLiteRunResult {
    /**
     * The last inserted row ID. Returned from the [`sqlite3_last_insert_rowid()`](https://www.sqlite.org/c3ref/last_insert_rowid.html) function.
     */
    lastInsertRowId: number;
    /**
     * The number of rows affected. Returned from the [`sqlite3_changes()`](https://www.sqlite.org/c3ref/changes.html) function.
     */
    changes: number;
}
/**
 * Bind parameters to the prepared statement.
 * You can either pass the parameters in the following forms:
 *
 * @example
 * A single array for unnamed parameters.
 * ```ts
 * const statement = await db.prepareAsync('SELECT * FROM test WHERE value = ? AND intValue = ?');
 * const result = await statement.executeAsync(['test1', 789]);
 * const firstRow = await result.getFirstAsync();
 * ```
 *
 * @example
 * Variadic arguments for unnamed parameters.
 * ```ts
 * const statement = await db.prepareAsync('SELECT * FROM test WHERE value = ? AND intValue = ?');
 * const result = await statement.executeAsync('test1', 789);
 * const firstRow = await result.getFirstAsync();
 * ```
 *
 * @example
 * A single object for [named parameters](https://www.sqlite.org/lang_expr.html)
 *
 * We support multiple named parameter forms such as `:VVV`, `@VVV`, and `$VVV`. We recommend using `$VVV` because JavaScript allows using `$` in identifiers without escaping.
 * ```ts
 * const statement = await db.prepareAsync('SELECT * FROM test WHERE value = $value AND intValue = $intValue');
 * const result = await statement.executeAsync({ $value: 'test1', $intValue: 789 });
 * const firstRow = await result.getFirstAsync();
 * ```
 */
export type SQLiteBindValue = string | number | null | boolean | Uint8Array;
export type SQLiteBindParams = Record<string, SQLiteBindValue> | SQLiteBindValue[];
export type SQLiteVariadicBindParams = SQLiteBindValue[];
export type SQLiteBindPrimitiveParams = Record<string, Exclude<SQLiteBindValue, Uint8Array>>;
export type SQLiteBindBlobParams = Record<string, Uint8Array>;
export type SQLiteColumnNames = string[];
export type SQLiteColumnValues = any[];
export type SQLiteAnyDatabase = any;
/**
 * A class that represents an instance of the SQLite statement.
 */
export declare class NativeStatement {
    runAsync(database: SQLiteAnyDatabase, bindParams: SQLiteBindPrimitiveParams, bindBlobParams: SQLiteBindBlobParams, shouldPassAsArray: boolean): Promise<SQLiteRunResult & {
        firstRowValues: SQLiteColumnValues;
    }>;
    stepAsync(database: SQLiteAnyDatabase): Promise<SQLiteColumnValues | null | undefined>;
    getAllAsync(database: SQLiteAnyDatabase): Promise<SQLiteColumnValues[]>;
    resetAsync(database: SQLiteAnyDatabase): Promise<void>;
    getColumnNamesAsync(): Promise<SQLiteColumnNames>;
    finalizeAsync(database: SQLiteAnyDatabase): Promise<void>;
    runSync(database: SQLiteAnyDatabase, bindParams: SQLiteBindPrimitiveParams, bindBlobParams: SQLiteBindBlobParams, shouldPassAsArray: boolean): SQLiteRunResult & {
        firstRowValues: SQLiteColumnValues;
    };
    stepSync(database: SQLiteAnyDatabase): SQLiteColumnValues | null | undefined;
    getAllSync(database: SQLiteAnyDatabase): SQLiteColumnValues[];
    resetSync(database: SQLiteAnyDatabase): void;
    getColumnNamesSync(): string[];
    finalizeSync(database: SQLiteAnyDatabase): void;
}
//# sourceMappingURL=NativeStatement.d.ts.map