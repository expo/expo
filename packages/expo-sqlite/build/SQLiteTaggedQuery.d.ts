import { SQLiteRunResult } from './NativeStatement';
import { SQLiteDatabase } from './SQLiteDatabase';
/**
 * Conditional type that returns T[] when type parameter is explicitly provided,
 * or union type when using default unknown type.
 */
type SQLiteTaggedQueryResult<T> = [unknown] extends [T] ? unknown[] | SQLiteRunResult : T[];
/**
 * A SQL query with tagged template literals API that can be awaited directly (returns array of objects by default),
 * or transformed using .values() or .first() methods.
 *
 * This API is inspired by Bun's SQL interface:
 *
 * @example
 * ```ts
 * // Default: returns array of objects
 * const users = await sql`SELECT * FROM users WHERE age > ${21}`;
 *
 * // Get values as arrays
 * const values = await sql`SELECT name, age FROM users`.values();
 * // Returns: [["Alice", 30], ["Bob", 25]]
 *
 * // Get first row only
 * const user = await sql`SELECT * FROM users WHERE id = ${1}`.first();
 *
 * // With type parameter
 * const users = await sql<User>`SELECT * FROM users`;
 *
 * // Mutable queries return SQLiteRunResult
 * const result = await sql`INSERT INTO users (name) VALUES (${"Alice"})` as SQLiteRunResult;
 * console.log(result.lastInsertRowId, result.changes);
 *
 * // Synchronous API
 * const users = sql<User>`SELECT * FROM users WHERE age > ${21}`.allSync();
 * const user = sql<User>`SELECT * FROM users WHERE id = ${userId}`.firstSync();
 * ```
 */
export declare class SQLiteTaggedQuery<T = unknown> implements PromiseLike<SQLiteTaggedQueryResult<T>> {
    private readonly database;
    private readonly source;
    private readonly params;
    private readonly parsedInfo;
    constructor(database: SQLiteDatabase, strings: TemplateStringsArray, values: unknown[]);
    /**
     * Make the query awaitable - automatically returns rows or metadata based on query type.
     * This is called automatically when you await the query.
     *
     * @example
     * ```ts
     * // SELECT returns array of objects
     * const users = await sql`SELECT * FROM users`;
     *
     * // INSERT returns metadata
     * const result = await sql`INSERT INTO users (name) VALUES (${"Alice"})`;
     * console.log(result.lastInsertRowId, result.changes);
     *
     * // With type parameter (no assertion needed)
     * const users = await sql<User>`SELECT * FROM users`; // Type: User[]
     * ```
     */
    then<TResult1 = SQLiteTaggedQueryResult<T>, TResult2 = never>(onfulfilled?: ((value: SQLiteTaggedQueryResult<T>) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null): PromiseLike<TResult1 | TResult2>;
    /**
     * Execute the query and return rows as arrays of values (Bun-style).
     * Each row is an array where values are in column order.
     *
     * @example
     * ```ts
     * const rows = await sql`SELECT name, age FROM users`.values();
     * // Returns: [["Alice", 30], ["Bob", 25]]
     * ```
     */
    values(): Promise<any[][]>;
    /**
     * Execute the query and return the first row only.
     * Returns null if no rows match.
     *
     * @example
     * ```ts
     * const user = await sql`SELECT * FROM users WHERE id = ${1}`.first();
     * ```
     */
    first(): Promise<T | null>;
    /**
     * Execute the query and return an async iterator over the rows.
     *
     * @example
     * ```ts
     * for await (const user of sql`SELECT * FROM users`.each()) {
     *   console.log(user.name);
     * }
     * ```
     */
    each(): AsyncIterableIterator<T>;
    /**
     * Execute the query synchronously - returns rows or metadata based on query type.
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
     */
    allSync(): SQLiteTaggedQueryResult<T>;
    /**
     * Execute the query synchronously and return rows as arrays of values.
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
     */
    valuesSync(): any[][];
    /**
     * Execute the query synchronously and return the first row.
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
     */
    firstSync(): T | null;
    /**
     * Execute the query synchronously and return an iterator.
     * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
     */
    eachSync(): IterableIterator<T>;
}
export {};
//# sourceMappingURL=SQLiteTaggedQuery.d.ts.map