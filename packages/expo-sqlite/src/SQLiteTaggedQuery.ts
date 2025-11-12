import { SQLiteBindValue, SQLiteRunResult } from './NativeStatement';
import { SQLiteDatabase } from './SQLiteDatabase';
import { parseSQLQuery, type SQLParsedInfo } from './queryUtils';

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
export class SQLiteTaggedQuery<T = unknown> implements PromiseLike<SQLiteTaggedQueryResult<T>> {
  private readonly source: string;
  private readonly params: SQLiteBindValue[];
  private readonly parsedInfo: SQLParsedInfo;

  constructor(
    private readonly database: SQLiteDatabase,
    strings: TemplateStringsArray,
    values: unknown[]
  ) {
    const sql = strings.join('?');
    this.source = sql;
    this.params = values as SQLiteBindValue[];
    this.parsedInfo = parseSQLQuery(sql);
  }

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
  then<TResult1 = SQLiteTaggedQueryResult<T>, TResult2 = never>(
    onfulfilled?: ((value: SQLiteTaggedQueryResult<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    if (this.parsedInfo.canReturnRows) {
      // SELECT, PRAGMA, WITH, EXPLAIN, or has RETURNING clause
      return this.database.getAllAsync<T>(this.source, this.params).then(onfulfilled, onrejected);
    } else {
      // INSERT, UPDATE, DELETE without RETURNING
      return this.database.runAsync(this.source, this.params).then(onfulfilled as any, onrejected);
    }
  }

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
  async values(): Promise<any[][]> {
    const statement = await this.database.prepareAsync(this.source);
    try {
      const result = await statement.executeForRawResultAsync(this.params);
      return await result.getAllAsync();
    } finally {
      await statement.finalizeAsync();
    }
  }

  /**
   * Execute the query and return the first row only.
   * Returns null if no rows match.
   *
   * @example
   * ```ts
   * const user = await sql`SELECT * FROM users WHERE id = ${1}`.first();
   * ```
   */
  async first(): Promise<T | null> {
    return this.database.getFirstAsync<T>(this.source, this.params);
  }

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
  each(): AsyncIterableIterator<T> {
    return this.database.getEachAsync<T>(this.source, this.params);
  }

  // Synchronous variants

  /**
   * Execute the query synchronously - returns rows or metadata based on query type.
   * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
   */
  allSync(): SQLiteTaggedQueryResult<T> {
    if (this.parsedInfo.canReturnRows) {
      // SELECT, PRAGMA, WITH, EXPLAIN, or has RETURNING clause
      return this.database.getAllSync<T>(this.source, this.params) as SQLiteTaggedQueryResult<T>;
    } else {
      // INSERT, UPDATE, DELETE without RETURNING
      return this.database.runSync(this.source, this.params) as SQLiteTaggedQueryResult<T>;
    }
  }

  /**
   * Execute the query synchronously and return rows as arrays of values.
   * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
   */
  valuesSync(): any[][] {
    const statement = this.database.prepareSync(this.source);
    try {
      const result = statement.executeForRawResultSync(this.params);
      return result.getAllSync();
    } finally {
      statement.finalizeSync();
    }
  }

  /**
   * Execute the query synchronously and return the first row.
   * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
   */
  firstSync(): T | null {
    return this.database.getFirstSync<T>(this.source, this.params);
  }

  /**
   * Execute the query synchronously and return an iterator.
   * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
   */
  eachSync(): IterableIterator<T> {
    return this.database.getEachSync<T>(this.source, this.params);
  }
}
