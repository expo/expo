import { NativeDatabase } from './NativeDatabase';
import {
  SQLiteBindBlobParams,
  SQLiteBindParams,
  SQLiteBindPrimitiveParams,
  SQLiteBindValue,
  NativeStatement,
  SQLiteRunResult,
  SQLiteVariadicBindParams,
  type SQLiteColumnNames,
  type SQLiteColumnValues,
} from './NativeStatement';

export { SQLiteBindParams, SQLiteBindValue, SQLiteRunResult, SQLiteVariadicBindParams };

/**
 * A prepared statement returned by [`Database.prepareAsync()`](#prepareasyncsource) or [`Database.prepareSync()`](#preparesyncsource) that can be binded with parameters and executed.
 */
export class SQLiteStatement {
  constructor(
    private readonly nativeDatabase: NativeDatabase,
    private readonly nativeStatement: NativeStatement
  ) {}

  //#region Asynchronous API

  /**
   * Run the prepared statement and return the result.
   * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`SQLiteBindValue`](#sqlitebindvalue) for more information about binding values.
   */
  public runAsync(params: SQLiteBindParams): Promise<SQLiteRunResult>;
  /**
   * @hidden
   */
  public runAsync(...params: SQLiteVariadicBindParams): Promise<SQLiteRunResult>;
  public async runAsync(...params: unknown[]): Promise<SQLiteRunResult> {
    return await this.nativeStatement.runAsync(this.nativeDatabase, ...normalizeParams(...params));
  }

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
  public eachAsync<T>(params: SQLiteBindParams): AsyncIterableIterator<T>;
  /**
   * @hidden
   */
  public eachAsync<T>(...params: SQLiteVariadicBindParams): AsyncIterableIterator<T>;
  public async *eachAsync<T>(...params: unknown[]): AsyncIterableIterator<T> {
    const paramTuple = normalizeParams(...params);
    const func = this.nativeStatement.getAsync.bind(this.nativeStatement);

    const columnNames = await this.getColumnNamesAsync();
    let result = null;
    do {
      result = await func(this.nativeDatabase, ...paramTuple);
      if (result != null) {
        yield composeRow<T>(columnNames, result);
      }
    } while (result != null);
  }

  /**
   * Get one row from the prepared statement.
   * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`SQLiteBindValue`](#sqlitebindvalue) for more information about binding values.
   */
  public getAsync<T>(params: SQLiteBindParams): Promise<T | null>;
  /**
   * @hidden
   */
  public getAsync<T>(...params: SQLiteVariadicBindParams): Promise<T | null>;
  public async getAsync<T>(...params: unknown[]): Promise<T | null> {
    const columnNames = await this.getColumnNamesAsync();
    const columnValues = await this.nativeStatement.getAsync(
      this.nativeDatabase,
      ...normalizeParams(...params)
    );
    return columnValues != null ? composeRow<T>(columnNames, columnValues) : null;
  }

  /**
   * Get all rows from the prepared statement.
   * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`SQLiteBindValue`](#sqlitebindvalue) for more information about binding values.
   */
  public allAsync<T>(params: SQLiteBindParams): Promise<T[]>;
  /**
   * @hidden
   */
  public allAsync<T>(...params: SQLiteVariadicBindParams): Promise<T[]>;
  public async allAsync<T>(...params: unknown[]): Promise<T[]> {
    const columnNames = await this.getColumnNamesAsync();
    const columnValuesList = await this.nativeStatement.getAllAsync(
      this.nativeDatabase,
      ...normalizeParams(...params)
    );
    return composeRows<T>(columnNames, columnValuesList);
  }

  /**
   * Get the column names of the prepared statement.
   */
  public getColumnNamesAsync(): Promise<string[]> {
    return this.nativeStatement.getColumnNamesAsync();
  }

  /**
   * Reset the prepared statement cursor. This will call the [`sqlite3_reset()`](https://www.sqlite.org/c3ref/reset.html) C function under the hood.
   */
  public async resetAsync(): Promise<void> {
    await this.nativeStatement.resetAsync(this.nativeDatabase);
  }

  /**
   * Finalize the prepared statement.
   * > **Note:** Remember to finalize the prepared statement whenever you call `prepareAsync()` to avoid resource leaks.
   */
  public async finalizeAsync(): Promise<void> {
    await this.nativeStatement.finalizeAsync(this.nativeDatabase);
  }

  //#endregion

  //#region Synchronous API

  /**
   * Run the prepared statement and return the result.
   * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
   * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`SQLiteBindValue`](#sqlitebindvalue) for more information about binding values.
   */
  public runSync(params: SQLiteBindParams): SQLiteRunResult;
  /**
   * @hidden
   */
  public runSync(...params: SQLiteVariadicBindParams): SQLiteRunResult;
  public runSync(...params: unknown[]): SQLiteRunResult {
    return this.nativeStatement.runSync(this.nativeDatabase, ...normalizeParams(...params));
  }

  /**
   * Iterate the prepared statement and return results as an iterable.
   * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
   * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`SQLiteBindValue`](#sqlitebindvalue) for more information about binding values.
   */
  public eachSync<T>(params: SQLiteBindParams): IterableIterator<T>;
  /**
   * @hidden
   */
  public eachSync<T>(...params: SQLiteVariadicBindParams): IterableIterator<T>;
  public *eachSync<T>(...params: unknown[]): IterableIterator<T> {
    const paramTuple = normalizeParams(...params);
    const func = this.nativeStatement.getSync.bind(this.nativeStatement);

    const columnNames = this.getColumnNamesSync();
    let result = null;
    do {
      result = func(this.nativeDatabase, ...paramTuple);
      if (result != null) {
        yield composeRow<T>(columnNames, result);
      }
    } while (result != null);
  }

  /**
   * Get one row from the prepared statement.
   * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
   * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`SQLiteBindValue`](#sqlitebindvalue) for more information about binding values.
   */
  public getSync<T>(params: SQLiteBindParams): T | null;
  /**
   * @hidden
   */
  public getSync<T>(...params: SQLiteVariadicBindParams): T | null;
  public getSync<T>(...params: unknown[]): T | null {
    const columnNames = this.getColumnNamesSync();
    const columnValues = this.nativeStatement.getSync(
      this.nativeDatabase,
      ...normalizeParams(...params)
    );
    return columnValues != null ? composeRow<T>(columnNames, columnValues) : null;
  }

  /**
   * Get all rows from the prepared statement.
   * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
   * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`SQLiteBindValue`](#sqlitebindvalue) for more information about binding values.
   */
  public allSync<T>(params: SQLiteBindParams): T[];
  /**
   * @hidden
   */
  public allSync<T>(...params: SQLiteVariadicBindParams): T[];
  public allSync<T>(...params: unknown[]): T[] {
    const columnNames = this.getColumnNamesSync();
    const columnValuesList = this.nativeStatement.getAllSync(
      this.nativeDatabase,
      ...normalizeParams(...params)
    );
    return composeRows<T>(columnNames, columnValuesList);
  }

  /**
   * Get the column names of the prepared statement.
   */
  public getColumnNamesSync(): string[] {
    return this.nativeStatement.getColumnNamesSync();
  }

  /**
   * Reset the prepared statement cursor. This will call the [`sqlite3_reset()`](https://www.sqlite.org/c3ref/reset.html) C function under the hood.
   */
  public resetSync(): void {
    this.nativeStatement.resetSync(this.nativeDatabase);
  }

  /**
   * Finalize the prepared statement.
   *
   * > **Note:** Remember to finalize the prepared statement whenever you call `prepareSync()` to avoid resource leaks.
   *
   */
  public finalizeSync(): void {
    this.nativeStatement.finalizeSync(this.nativeDatabase);
  }

  //#endregion
}

/**
 * Normalize the bind params to data structure that can be passed to native module.
 * The data structure is a tuple of [primitiveParams, blobParams, shouldPassAsArray].
 * @hidden
 */
export function normalizeParams(
  ...params: any[]
): [SQLiteBindPrimitiveParams, SQLiteBindBlobParams, boolean] {
  let bindParams = params.length > 1 ? params : (params[0] as SQLiteBindParams);
  if (bindParams == null) {
    bindParams = [];
  }
  if (
    typeof bindParams !== 'object' ||
    bindParams instanceof ArrayBuffer ||
    ArrayBuffer.isView(bindParams)
  ) {
    bindParams = [bindParams];
  }
  const shouldPassAsArray = Array.isArray(bindParams);
  if (Array.isArray(bindParams)) {
    bindParams = bindParams.reduce<Record<string, SQLiteBindValue>>((acc, value, index) => {
      acc[index] = value;
      return acc;
    }, {});
  }

  const primitiveParams: SQLiteBindPrimitiveParams = {};
  const blobParams: SQLiteBindBlobParams = {};
  for (const key in bindParams) {
    const value = bindParams[key];
    if (value instanceof Uint8Array) {
      blobParams[key] = value;
    } else {
      primitiveParams[key] = value;
    }
  }

  return [primitiveParams, blobParams, shouldPassAsArray];
}

/**
 * Compose `columnNames` and `columnValues` to an row object.
 * @hidden
 */
export function composeRow<T>(columnNames: SQLiteColumnNames, columnValues: SQLiteColumnValues): T {
  const row = {};
  if (columnNames.length !== columnValues.length) {
    throw new Error(
      `Column names and values count mismatch. Names: ${columnNames.length}, Values: ${columnValues.length}`
    );
  }
  for (let i = 0; i < columnNames.length; i++) {
    row[columnNames[i]] = columnValues[i];
  }
  return row as T;
}

/**
 * Compose `columnNames` and `columnValuesList` to an array of row objects.
 * @hidden
 */
export function composeRows<T>(
  columnNames: SQLiteColumnNames,
  columnValuesList: SQLiteColumnValues[]
): T[] {
  if (columnValuesList.length === 0) {
    return [];
  }
  if (columnNames.length !== columnValuesList[0].length) {
    // We only check the first row because SQLite returns the same column count for all rows.
    throw new Error(
      `Column names and values count mismatch. Names: ${columnNames.length}, Values: ${columnValuesList[0].length}`
    );
  }
  const results: T[] = [];
  for (const columnValues of columnValuesList) {
    const row = {};
    for (let i = 0; i < columnNames.length; i++) {
      row[columnNames[i]] = columnValues[i];
    }
    results.push(row as T);
  }
  return results;
}
