import ExpoSQLite from './ExpoSQLiteNext';

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
export class Statement {
  /**
   * @internal
   */
  constructor(
    public readonly databaseId: number,
    public readonly statementId: number
  ) {}

  /**
   * Run the prepared statement and return the result.
   *
   * @param params @see `BindParams`
   */
  public runAsync(...params: VariadicBindParams): Promise<RunResult>;
  public runAsync(params: BindParams): Promise<RunResult>;
  public async runAsync(...params: unknown[]): Promise<RunResult> {
    const { params: bindParams, shouldPassAsObject } = normalizeParams(...params);
    if (shouldPassAsObject) {
      return await ExpoSQLite.statementObjectRunAsync(
        this.databaseId,
        this.statementId,
        bindParams
      );
    } else {
      return await ExpoSQLite.statementArrayRunAsync(this.databaseId, this.statementId, bindParams);
    }
  }

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
  public eachAsync<T>(...params: VariadicBindParams): AsyncIterableIterator<T>;
  public eachAsync<T>(params: BindParams): AsyncIterableIterator<T>;
  public async *eachAsync<T>(...params: unknown[]): AsyncIterableIterator<T> {
    const { params: bindParams, shouldPassAsObject } = normalizeParams(...params);
    const func = shouldPassAsObject
      ? ExpoSQLite.statementObjectGetAsync
      : ExpoSQLite.statementArrayGetAsync;

    let result: T | null = null;
    do {
      result = await func(this.databaseId, this.statementId, bindParams);
      if (result != null) {
        yield result;
      }
    } while (result != null);
  }

  /**
   * Get one row from the prepared statement.
   *
   * @param params @see `BindParams`
   */
  public getAsync<T>(...params: VariadicBindParams): Promise<T | null>;
  public getAsync<T>(params: BindParams): Promise<T | null>;
  public async getAsync<T>(...params: unknown[]): Promise<T | null> {
    const { params: bindParams, shouldPassAsObject } = normalizeParams(...params);
    if (shouldPassAsObject) {
      return await ExpoSQLite.statementObjectGetAsync(
        this.databaseId,
        this.statementId,
        bindParams
      );
    } else {
      return await ExpoSQLite.statementArrayGetAsync(this.databaseId, this.statementId, bindParams);
    }
  }

  /**
   * Get all rows from the prepared statement.
   *
   * @param params @see `BindParams`
   */
  public allAsync<T>(...params: VariadicBindParams): Promise<T[]>;
  public allAsync<T>(params: BindParams): Promise<T[]>;
  public async allAsync<T>(...params: unknown[]): Promise<T[]> {
    const { params: bindParams, shouldPassAsObject } = normalizeParams(...params);
    if (shouldPassAsObject) {
      return await ExpoSQLite.statementObjectGetAllAsync(
        this.databaseId,
        this.statementId,
        bindParams
      );
    } else {
      return await ExpoSQLite.statementArrayGetAllAsync(
        this.databaseId,
        this.statementId,
        bindParams
      );
    }
  }

  /**
   * Reset the prepared statement cursor.
   */
  public async resetAsync(): Promise<void> {
    await ExpoSQLite.statementResetAsync(this.databaseId, this.statementId);
  }

  /**
   * Finalize the prepared statement.
   * > **Note:** Remember to finalize the prepared statement whenever you call `prepareAsync()` to avoid resource leaks.
   */
  public async finalizeAsync(): Promise<void> {
    await ExpoSQLite.statementFinalizeAsync(this.databaseId, this.statementId);
  }
}

/**
 * Normalize the bind params to an array or object.
 * @hidden
 */
export function normalizeParams(...params: any[]): {
  params: BindParams;
  shouldPassAsObject: boolean;
} {
  let bindParams = params.length > 1 ? params : (params[0] as BindParams);
  if (typeof bindParams !== 'object') {
    bindParams = [bindParams];
  }
  const shouldPassAsObject = !Array.isArray(bindParams);
  return {
    params: bindParams,
    shouldPassAsObject,
  };
}
