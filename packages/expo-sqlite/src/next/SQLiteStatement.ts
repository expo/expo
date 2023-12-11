import { NativeDatabase } from './NativeDatabase';
import {
  SQLiteBindParams,
  SQLiteBindValue,
  NativeStatement,
  SQLiteVariadicBindParams,
  type SQLiteAnyDatabase,
  type SQLiteRunResult,
  SQLiteColumnValues,
} from './NativeStatement';
import { composeRow, composeRows, normalizeParams } from './paramUtils';

export { SQLiteBindParams, SQLiteBindValue, SQLiteRunResult, SQLiteVariadicBindParams };

/**
 * A prepared statement returned by [`SQLiteDatabase.prepareAsync()`](#prepareasyncsource) or [`SQLiteDatabase.prepareSync()`](#preparesyncsource) that can be binded with parameters and executed.
 */
export class SQLiteStatement {
  constructor(
    private readonly nativeDatabase: NativeDatabase,
    private readonly nativeStatement: NativeStatement
  ) {}

  //#region Asynchronous API

  /**
   * Run the prepared statement and return the [`SQLiteExecuteAsyncResult`](#sqliteexecuteasyncresult) instance.
   * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`SQLiteBindValue`](#sqlitebindvalue) for more information about binding values.
   */
  public executeAsync<T>(params: SQLiteBindParams): Promise<SQLiteExecuteAsyncResult<T>>;
  /**
   * @hidden
   */
  public executeAsync<T>(...params: SQLiteVariadicBindParams): Promise<SQLiteExecuteAsyncResult<T>>;
  public async executeAsync<T>(...params: unknown[]): Promise<SQLiteExecuteAsyncResult<T>> {
    const { lastInsertRowId, changes, firstRowValues } = await this.nativeStatement.runAsync(
      this.nativeDatabase,
      ...normalizeParams(...params)
    );
    return createSQLiteExecuteAsyncResult<T>(
      this.nativeDatabase,
      this.nativeStatement,
      lastInsertRowId,
      changes,
      firstRowValues
    );
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
   * Run the prepared statement and return the [`SQLiteExecuteSyncResult`](#sqliteexecutesyncresult) instance.
   * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
   * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`SQLiteBindValue`](#sqlitebindvalue) for more information about binding values.
   */
  public executeSync<T>(params: SQLiteBindParams): SQLiteExecuteSyncResult<T>;
  /**
   * @hidden
   */
  public executeSync<T>(...params: SQLiteVariadicBindParams): SQLiteExecuteSyncResult<T>;
  public executeSync<T>(...params: unknown[]): SQLiteExecuteSyncResult<T> {
    const { lastInsertRowId, changes, firstRowValues } = this.nativeStatement.runSync(
      this.nativeDatabase,
      ...normalizeParams(...params)
    );
    return createSQLiteExecuteSyncResult<T>(
      this.nativeDatabase,
      this.nativeStatement,
      lastInsertRowId,
      changes,
      firstRowValues
    );
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
 * A result returned by [`SQLiteStatement.executeAsync()`](#executeasyncparams).
 *
 * @example
 * The result includes the [`lastInsertRowId`](https://www.sqlite.org/c3ref/last_insert_rowid.html) and [`changes`](https://www.sqlite.org/c3ref/changes.html) properties. You can get the information from the write operations.
 * ```ts
 * const statement = await db.prepareAsync('INSERT INTO Tests (value) VALUES (?)');
 * const result = await statement.executeAsync(101);
 * console.log('lastInsertRowId:', result.lastInsertRowId);
 * console.log('changes:', result.changes);
 * ```
 *
 * @example
 * The result implements the [`AsyncIterator`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/asyncIterator) interface, so you can use it in `for await...of` loops.
 * ```ts
 * const statement = await db.prepareAsync('SELECT value FROM Tests WHERE value > ?');
 * const result = await statement.executeAsync<{ value: number }>(100);
 * for await (const row of result) {
 *   console.log('row value:', row.value);
 * }
 * ```
 *
 * @example
 * If your write operations also return values, you can mix all of them together.
 * ```ts
 * const statement = await db.prepareAsync('INSERT INTO Tests (name, value) VALUES (?, ?) RETURNING name');
 * const result = await statement.executeAsync<{ name: string }>('John Doe', 101);
 * console.log('lastInsertRowId:', result.lastInsertRowId);
 * console.log('changes:', result.changes);
 * for await (const row of result) {
 *   console.log('name:', row.name);
 * }
 * ```
 */
export interface SQLiteExecuteAsyncResult<T> extends AsyncIterableIterator<T> {
  /**
   * The last inserted row ID. Returned from the [`sqlite3_last_insert_rowid()`](https://www.sqlite.org/c3ref/last_insert_rowid.html) function.
   */
  readonly lastInsertRowId: number;

  /**
   * The number of rows affected. Returned from the [`sqlite3_changes()`](https://www.sqlite.org/c3ref/changes.html) function.
   */
  readonly changes: number;

  /**
   * Get the first row of the result set.
   */
  getFirstAsync(): Promise<T | null>;

  /**
   * Get all rows of the result set.
   */
  getAllAsync(): Promise<T[]>;
}

/**
 * A result returned by [`SQLiteStatement.executeSync()`](#executesyncparams).
 * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.

 * @example
 * The result includes the [`lastInsertRowId`](https://www.sqlite.org/c3ref/last_insert_rowid.html) and [`changes`](https://www.sqlite.org/c3ref/changes.html) properties. You can get the information from the write operations.
 * ```ts
 * const statement = db.prepareSync('INSERT INTO Tests (value) VALUES (?)');
 * const result = statement.executeSync(101);
 * console.log('lastInsertRowId:', result.lastInsertRowId);
 * console.log('changes:', result.changes);
 * ```
 *
 * @example
 * The result implements the [`Iterator`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator) interface, so you can use it in `for...of` loops.
 * ```ts
 * const statement = db.prepareSync('SELECT value FROM Tests WHERE value > ?');
 * const result = statement.executeSync<{ value: number }>(100);
 * for (const row of result) {
 *   console.log('row value:', row.value);
 * }
 * ```
 *
 * @example
 * If your write operations also return values, you can mix all of them together.
 * ```ts
 * const statement = db.prepareSync('INSERT INTO Tests (name, value) VALUES (?, ?) RETURNING name');
 * const result = statement.executeSync<{ name: string }>('John Doe', 101);
 * console.log('lastInsertRowId:', result.lastInsertRowId);
 * console.log('changes:', result.changes);
 * for (const row of result) {
 *   console.log('name:', row.name);
 * }
 * ```
 */
export interface SQLiteExecuteSyncResult<T> extends IterableIterator<T> {
  /**
   * The last inserted row ID. Returned from the [`sqlite3_last_insert_rowid()`](https://www.sqlite.org/c3ref/last_insert_rowid.html) function.
   */
  readonly lastInsertRowId: number;

  /**
   * The number of rows affected. Returned from the [`sqlite3_changes()`](https://www.sqlite.org/c3ref/changes.html) function.
   */
  readonly changes: number;

  /**
   * Get the first row of the result set.
   */
  getFirstSync(): T | null;

  /**
   * Get all rows of the result set.
   */
  getAllSync(): T[];
}

//#region Internals for SQLiteExecuteAsyncResult and SQLiteExecuteSyncResult

/**
 * Create the `SQLiteExecuteAsyncResult` instance.
 *
 * NOTE: Since Hermes does not support the `Symbol.asyncIterator` feature, we have to use an AsyncGenerator to implement the `AsyncIterableIterator` interface.
 * This is done by `Object.defineProperties` to add the properties to the AsyncGenerator.
 */
async function createSQLiteExecuteAsyncResult<T>(
  database: SQLiteAnyDatabase,
  statement: NativeStatement,
  lastInsertRowId: number,
  changes: number,
  firstRowValues: SQLiteColumnValues | null
): Promise<SQLiteExecuteAsyncResult<T>> {
  const instance = new SQLiteExecuteAsyncResultImpl<T>(
    database,
    statement,
    lastInsertRowId,
    changes,
    firstRowValues
  );
  const generator = instance.generatorAsync();
  Object.defineProperties(generator, {
    lastInsertRowId: { value: lastInsertRowId, enumerable: true, writable: false },
    changes: { value: changes, enumerable: true, writable: false },
    getFirstAsync: {
      value: instance.getFirstAsync.bind(instance),
      enumerable: true,
      writable: false,
      configurable: false,
    },
    getAllAsync: {
      value: instance.getAllAsync.bind(instance),
      enumerable: true,
      writable: false,
      configurable: false,
    },
  });

  return generator as SQLiteExecuteAsyncResult<T>;
}

/**
 * Create the `SQLiteExecuteSyncResult` instance.
 */
function createSQLiteExecuteSyncResult<T>(
  database: SQLiteAnyDatabase,
  statement: NativeStatement,
  lastInsertRowId: number,
  changes: number,
  firstRowValues: SQLiteColumnValues | null
): SQLiteExecuteSyncResult<T> {
  const instance = new SQLiteExecuteSyncResultImpl<T>(
    database,
    statement,
    lastInsertRowId,
    changes,
    firstRowValues
  );
  const generator = instance.generatorSync();
  Object.defineProperties(generator, {
    lastInsertRowId: { value: lastInsertRowId, enumerable: true, writable: false },
    changes: { value: changes, enumerable: true, writable: false },
    getFirstSync: {
      value: instance.getFirstSync.bind(instance),
      enumerable: true,
      writable: false,
      configurable: false,
    },
    getAllSync: {
      value: instance.getAllSync.bind(instance),
      enumerable: true,
      writable: false,
      configurable: false,
    },
  });

  return generator as SQLiteExecuteSyncResult<T>;
}

class SQLiteExecuteAsyncResultImpl<T> {
  private columnNames: string[] | null = null;

  constructor(
    private readonly database: SQLiteAnyDatabase,
    private readonly statement: NativeStatement,
    public readonly lastInsertRowId: number,
    public readonly changes: number,
    private firstRowValues: SQLiteColumnValues | null
  ) {}

  async getFirstAsync(): Promise<T | null> {
    const columnNames = await this.getColumnNamesAsync();
    const firstRowValues = this.popFirstRowValues();
    if (firstRowValues != null) {
      return composeRow<T>(columnNames, firstRowValues);
    }
    const firstRow = await this.statement.stepAsync(this.database);
    return firstRow != null ? composeRow<T>(columnNames, firstRow) : null;
  }

  async getAllAsync(): Promise<T[]> {
    const columnNames = await this.getColumnNamesAsync();
    const allRows = await this.statement.getAllAsync(this.database);
    const firstRowValues = this.popFirstRowValues();
    if (firstRowValues != null && firstRowValues.length > 0) {
      return composeRows<T>(columnNames, [firstRowValues, ...allRows]);
    }
    return composeRows<T>(columnNames, allRows);
  }

  async *generatorAsync(): AsyncIterableIterator<T> {
    const columnNames = await this.getColumnNamesAsync();
    const firstRowValues = this.popFirstRowValues();
    if (firstRowValues != null) {
      yield composeRow<T>(columnNames, firstRowValues);
    }

    let result;
    do {
      result = await this.statement.stepAsync(this.database);
      if (result != null) {
        yield composeRow<T>(columnNames, result);
      }
    } while (result != null);
  }

  private popFirstRowValues(): SQLiteColumnValues | null {
    if (this.firstRowValues != null) {
      const firstRowValues = this.firstRowValues;
      this.firstRowValues = null;
      return firstRowValues.length > 0 ? firstRowValues : null;
    }
    return null;
  }

  private async getColumnNamesAsync(): Promise<string[]> {
    if (this.columnNames == null) {
      this.columnNames = await this.statement.getColumnNamesAsync();
    }
    return this.columnNames;
  }
}

class SQLiteExecuteSyncResultImpl<T> {
  private columnNames: string[] | null = null;

  constructor(
    private readonly database: SQLiteAnyDatabase,
    private readonly statement: NativeStatement,
    public readonly lastInsertRowId: number,
    public readonly changes: number,
    private firstRowValues: SQLiteColumnValues | null
  ) {}

  getFirstSync(): T | null {
    const columnNames = this.getColumnNamesSync();
    const firstRowValues = this.popFirstRowValues();
    if (firstRowValues != null) {
      return composeRow<T>(columnNames, firstRowValues);
    }
    const firstRow = this.statement.stepSync(this.database);
    return firstRow != null ? composeRow<T>(columnNames, firstRow) : null;
  }

  getAllSync(): T[] {
    const columnNames = this.getColumnNamesSync();
    const allRows = this.statement.getAllSync(this.database);
    const firstRowValues = this.popFirstRowValues();
    if (firstRowValues != null && firstRowValues.length > 0) {
      return composeRows<T>(columnNames, [firstRowValues, ...allRows]);
    }
    return composeRows<T>(columnNames, allRows);
  }

  *generatorSync(): IterableIterator<T> {
    const columnNames = this.getColumnNamesSync();
    const firstRowValues = this.popFirstRowValues();
    if (firstRowValues != null) {
      yield composeRow<T>(columnNames, firstRowValues);
    }
    let result;
    do {
      result = this.statement.stepSync(this.database);
      if (result != null) {
        yield composeRow<T>(columnNames, result);
      }
    } while (result != null);
  }

  private popFirstRowValues(): SQLiteColumnValues | null {
    if (this.firstRowValues != null) {
      const firstRowValues = this.firstRowValues;
      this.firstRowValues = null;
      return firstRowValues.length > 0 ? firstRowValues : null;
    }
    return null;
  }

  private getColumnNamesSync(): string[] {
    if (this.columnNames == null) {
      this.columnNames = this.statement.getColumnNamesSync();
    }
    return this.columnNames;
  }
}

//#endregion
