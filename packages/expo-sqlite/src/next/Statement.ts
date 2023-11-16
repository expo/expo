import { NativeDatabase } from './NativeDatabase';
import {
  BindParams,
  BindValue,
  NativeStatement,
  RunResult,
  VariadicBindParams,
  type ColumnNames,
  type ColumnValues,
} from './NativeStatement';

export { BindParams, BindValue, RunResult, VariadicBindParams };

/**
 * A prepared statement returned by [`Database.prepareAsync()`](#prepareasyncsource) or [`Database.prepareSync()`](#preparesyncsource) that can be binded with parameters and executed.
 */
export class Statement {
  constructor(
    private readonly nativeDatabase: NativeDatabase,
    private readonly nativeStatement: NativeStatement
  ) {}

  //#region Asynchronous API

  /**
   * Run the prepared statement and return the result.
   * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`BindValue`](#bindvalue) for more information about binding values.
   */
  public runAsync(params: BindParams): Promise<RunResult>;
  /**
   * @hidden
   */
  public runAsync(...params: VariadicBindParams): Promise<RunResult>;
  public async runAsync(...params: unknown[]): Promise<RunResult> {
    const { params: bindParams, shouldPassAsObject } = normalizeParams(...params);
    if (shouldPassAsObject) {
      return await this.nativeStatement.objectRunAsync(this.nativeDatabase, bindParams);
    } else {
      return await this.nativeStatement.arrayRunAsync(this.nativeDatabase, bindParams);
    }
  }

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
  public eachAsync<T>(params: BindParams): AsyncIterableIterator<T>;
  /**
   * @hidden
   */
  public eachAsync<T>(...params: VariadicBindParams): AsyncIterableIterator<T>;
  public async *eachAsync<T>(...params: unknown[]): AsyncIterableIterator<T> {
    const { params: bindParams, shouldPassAsObject } = normalizeParams(...params);
    const func = shouldPassAsObject
      ? this.nativeStatement.objectGetAsync.bind(this.nativeStatement)
      : this.nativeStatement.arrayGetAsync.bind(this.nativeStatement);

    const columnNames = await this.getColumnNamesAsync();
    let result = null;
    do {
      result = await func(this.nativeDatabase, bindParams);
      if (result != null) {
        yield composeRow<T>(columnNames, result);
      }
    } while (result != null);
  }

  /**
   * Get one row from the prepared statement.
   * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`BindValue`](#bindvalue) for more information about binding values.
   */
  public getAsync<T>(params: BindParams): Promise<T | null>;
  /**
   * @hidden
   */
  public getAsync<T>(...params: VariadicBindParams): Promise<T | null>;
  public async getAsync<T>(...params: unknown[]): Promise<T | null> {
    const { params: bindParams, shouldPassAsObject } = normalizeParams(...params);
    const columnNames = await this.getColumnNamesAsync();
    const columnValues = shouldPassAsObject
      ? await this.nativeStatement.objectGetAsync(this.nativeDatabase, bindParams)
      : await this.nativeStatement.arrayGetAsync(this.nativeDatabase, bindParams);
    return columnValues != null ? composeRow<T>(columnNames, columnValues) : null;
  }

  /**
   * Get all rows from the prepared statement.
   * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`BindValue`](#bindvalue) for more information about binding values.
   */
  public allAsync<T>(params: BindParams): Promise<T[]>;
  /**
   * @hidden
   */
  public allAsync<T>(...params: VariadicBindParams): Promise<T[]>;
  public async allAsync<T>(...params: unknown[]): Promise<T[]> {
    const { params: bindParams, shouldPassAsObject } = normalizeParams(...params);
    const columnNames = await this.getColumnNamesAsync();
    const columnValuesList = shouldPassAsObject
      ? await this.nativeStatement.objectGetAllAsync(this.nativeDatabase, bindParams)
      : await this.nativeStatement.arrayGetAllAsync(this.nativeDatabase, bindParams);
    return composeRows<T>(columnNames, columnValuesList);
  }

  /**
   * Get the column names of the prepared statement.
   */
  public getColumnNamesAsync(): Promise<string[]> {
    return this.nativeStatement.getColumnNamesAsync();
  }

  /**
   * Reset the prepared statement cursor.
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
   * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`BindValue`](#bindvalue) for more information about binding values.
   */
  public runSync(params: BindParams): RunResult;
  /**
   * @hidden
   */
  public runSync(...params: VariadicBindParams): RunResult;
  public runSync(...params: unknown[]): RunResult {
    const { params: bindParams, shouldPassAsObject } = normalizeParams(...params);
    if (shouldPassAsObject) {
      return this.nativeStatement.objectRunSync(this.nativeDatabase, bindParams);
    } else {
      return this.nativeStatement.arrayRunSync(this.nativeDatabase, bindParams);
    }
  }

  /**
   * Iterate the prepared statement and return results as an iterable.
   * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
   * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`BindValue`](#bindvalue) for more information about binding values.
   */
  public eachSync<T>(params: BindParams): IterableIterator<T>;
  /**
   * @hidden
   */
  public eachSync<T>(...params: VariadicBindParams): IterableIterator<T>;
  public *eachSync<T>(...params: unknown[]): IterableIterator<T> {
    const { params: bindParams, shouldPassAsObject } = normalizeParams(...params);
    const func = shouldPassAsObject
      ? this.nativeStatement.objectGetSync.bind(this.nativeStatement)
      : this.nativeStatement.arrayGetSync.bind(this.nativeStatement);

    const columnNames = this.getColumnNamesSync();
    let result = null;
    do {
      result = func(this.nativeDatabase, bindParams);
      if (result != null) {
        yield composeRow<T>(columnNames, result);
      }
    } while (result != null);
  }

  /**
   * Get one row from the prepared statement.
   * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
   * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`BindValue`](#bindvalue) for more information about binding values.
   */
  public getSync<T>(params: BindParams): T | null;
  /**
   * @hidden
   */
  public getSync<T>(...params: VariadicBindParams): T | null;
  public getSync<T>(...params: unknown[]): T | null {
    const { params: bindParams, shouldPassAsObject } = normalizeParams(...params);
    const columnNames = this.getColumnNamesSync();
    const columnValues = shouldPassAsObject
      ? this.nativeStatement.objectGetSync(this.nativeDatabase, bindParams)
      : this.nativeStatement.arrayGetSync(this.nativeDatabase, bindParams);
    return columnValues != null ? composeRow<T>(columnNames, columnValues) : null;
  }

  /**
   * Get all rows from the prepared statement.
   * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
   * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`BindValue`](#bindvalue) for more information about binding values.
   */
  public allSync<T>(params: BindParams): T[];
  /**
   * @hidden
   */
  public allSync<T>(...params: VariadicBindParams): T[];
  public allSync<T>(...params: unknown[]): T[] {
    const { params: bindParams, shouldPassAsObject } = normalizeParams(...params);
    const columnNames = this.getColumnNamesSync();
    const columnValuesList = shouldPassAsObject
      ? this.nativeStatement.objectGetAllSync(this.nativeDatabase, bindParams)
      : this.nativeStatement.arrayGetAllSync(this.nativeDatabase, bindParams);
    return composeRows<T>(columnNames, columnValuesList);
  }

  /**
   * Get the column names of the prepared statement.
   */
  public getColumnNamesSync(): string[] {
    return this.nativeStatement.getColumnNamesSync();
  }

  /**
   * Reset the prepared statement cursor.
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
 * Normalize the bind params to an array or object.
 * @hidden
 */
export function normalizeParams(...params: any[]): {
  params: BindParams;
  shouldPassAsObject: boolean;
} {
  let bindParams = params.length > 1 ? params : (params[0] as BindParams);
  if (bindParams == null) {
    bindParams = [];
  }
  if (typeof bindParams !== 'object') {
    bindParams = [bindParams];
  }
  const shouldPassAsObject = !Array.isArray(bindParams);
  return {
    params: bindParams,
    shouldPassAsObject,
  };
}

/**
 * Compose `columnNames` and `columnValues` to an row object.
 * @hidden
 */
export function composeRow<T>(columnNames: ColumnNames, columnValues: ColumnValues): T {
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
export function composeRows<T>(columnNames: ColumnNames, columnValuesList: ColumnValues[]): T[] {
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
