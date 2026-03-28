import { NativeDatabase } from './NativeDatabase';
import {
  SQLiteBindParams,
  SQLiteBindValue,
  NativeStatement,
  SQLiteVariadicBindParams,
  type SQLiteAnyDatabase,
  type SQLiteColumnNames,
  type SQLiteColumnValues,
  type SQLiteRunResult,
} from './NativeStatement';
import { composeRow, composeRows, normalizeParams } from './paramUtils';

export { SQLiteBindParams, SQLiteBindValue, SQLiteRunResult, SQLiteVariadicBindParams };

type ValuesOf<T extends object> = T[keyof T][];

/**
 * A lightweight async mutex that serializes access to a native prepared statement
 * during the brief window between runAsync() and getAllAsync() in executeAsync().
 * This prevents another caller's runAsync() from resetting the cursor before
 * the first caller finishes draining rows.
 */
class StatementMutex {
  private _queue: Promise<void> = Promise.resolve();

  /**
   * Run `fn` exclusively — subsequent calls wait for prior ones to finish.
   * The lock is held only for the duration of `fn`, not for result consumption.
   */
  run<T>(fn: () => Promise<T>): Promise<T> {
    const prev = this._queue;
    let resolve: () => void;
    this._queue = new Promise<void>((r) => {
      resolve = r;
    });
    return prev.then(fn).finally(() => resolve!());
  }
}

/**
 * A prepared statement returned by [`SQLiteDatabase.prepareAsync()`](#prepareasyncsource) or [`SQLiteDatabase.prepareSync()`](#preparesyncsource) that can be binded with parameters and executed.
 */
export class SQLiteStatement {
  private readonly _mutex = new StatementMutex();

  constructor(
    private readonly nativeDatabase: NativeDatabase,
    private readonly nativeStatement: NativeStatement
  ) {}

  //#region Asynchronous API

  /**
   * Run the prepared statement and return the [`SQLiteExecuteAsyncResult`](#sqliteexecuteasyncresult) instance.
   *
   * > **Note:** Async results are eagerly materialized — all rows are read into memory during this call.
   * > This ensures correctness when the same prepared statement is reused by concurrent async callers.
   * > For very large result sets where lazy streaming is needed, use a dedicated (non-shared) statement
   * > or the synchronous API.
   *
   * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`SQLiteBindValue`](#sqlitebindvalue) for more information about binding values.
   */
  public executeAsync<T>(params: SQLiteBindParams): Promise<SQLiteExecuteAsyncResult<T>>;
  /**
   * @hidden
   */
  public executeAsync<T>(...params: SQLiteVariadicBindParams): Promise<SQLiteExecuteAsyncResult<T>>;
  public async executeAsync<T>(...params: unknown[]): Promise<SQLiteExecuteAsyncResult<T>> {
    // Mutex ensures runAsync + getAllAsync execute atomically — no other caller
    // can reset the native cursor between first-row capture and row drain.
    // The mutex is released before the result object is returned, so result
    // consumption (getFirstAsync, getAllAsync, iterator) is never blocked.
    const { lastInsertRowId, changes, firstRowValues, remainingRows } = await this._mutex.run(
      async () => {
        const result = await this.nativeStatement.runAsync(
          this.nativeDatabase,
          ...normalizeParams(...params)
        );
        let remaining: SQLiteColumnValues[] = [];
        if (result.firstRowValues != null && result.firstRowValues.length > 0) {
          remaining = await this.nativeStatement.getAllAsync(this.nativeDatabase);
        }
        return { ...result, remainingRows: remaining };
      }
    );
    return createSQLiteExecuteAsyncResult<T>(
      this.nativeDatabase,
      this.nativeStatement,
      firstRowValues,
      {
        rawResult: false,
        lastInsertRowId,
        changes,
      },
      remainingRows
    );
  }

  /**
   * Similar to [`executeAsync()`](#executeasyncparams) but returns the raw value array result instead of the row objects.
   * @hidden Advanced use only.
   */
  public executeForRawResultAsync<T extends object>(
    params: SQLiteBindParams
  ): Promise<SQLiteExecuteAsyncResult<ValuesOf<T>>>;
  /**
   * @hidden
   */
  public executeForRawResultAsync<T extends object>(
    ...params: SQLiteVariadicBindParams
  ): Promise<SQLiteExecuteAsyncResult<ValuesOf<T>>>;
  public async executeForRawResultAsync<T extends object>(
    ...params: unknown[]
  ): Promise<SQLiteExecuteAsyncResult<ValuesOf<T>>> {
    const { lastInsertRowId, changes, firstRowValues, remainingRows } = await this._mutex.run(
      async () => {
        const result = await this.nativeStatement.runAsync(
          this.nativeDatabase,
          ...normalizeParams(...params)
        );
        let remaining: SQLiteColumnValues[] = [];
        if (result.firstRowValues != null && result.firstRowValues.length > 0) {
          remaining = await this.nativeStatement.getAllAsync(this.nativeDatabase);
        }
        return { ...result, remainingRows: remaining };
      }
    );
    return createSQLiteExecuteAsyncResult<ValuesOf<T>>(
      this.nativeDatabase,
      this.nativeStatement,
      firstRowValues,
      {
        rawResult: true,
        lastInsertRowId,
        changes,
      },
      remainingRows
    );
  }

  /**
   * Get the column names of the prepared statement.
   */
  public getColumnNamesAsync(): Promise<string[]> {
    return this.nativeStatement.getColumnNamesAsync();
  }

  /**
   * Finalize the prepared statement. This will call the [`sqlite3_finalize()`](https://www.sqlite.org/c3ref/finalize.html) C function under the hood.
   *
   * Attempting to access a finalized statement will result in an error.
   * > **Note:** While `expo-sqlite` will automatically finalize any orphaned prepared statements upon closing the database, it is considered best practice
   * > to manually finalize prepared statements as soon as they are no longer needed. This helps to prevent resource leaks.
   * > You can use the `try...finally` statement to ensure that prepared statements are finalized even if an error occurs.
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
      firstRowValues,
      {
        rawResult: false,
        lastInsertRowId,
        changes,
      }
    );
  }

  /**
   * Similar to [`executeSync()`](#executesyncparams) but returns the raw value array result instead of the row objects.
   * @hidden Advanced use only.
   */
  public executeForRawResultSync<T extends object>(
    params: SQLiteBindParams
  ): SQLiteExecuteSyncResult<ValuesOf<T>>;
  /**
   * @hidden
   */
  public executeForRawResultSync<T extends object>(
    ...params: SQLiteVariadicBindParams
  ): SQLiteExecuteSyncResult<ValuesOf<T>>;
  public executeForRawResultSync<T extends object>(
    ...params: unknown[]
  ): SQLiteExecuteSyncResult<ValuesOf<T>> {
    const { lastInsertRowId, changes, firstRowValues } = this.nativeStatement.runSync(
      this.nativeDatabase,
      ...normalizeParams(...params)
    );
    return createSQLiteExecuteSyncResult<ValuesOf<T>>(
      this.nativeDatabase,
      this.nativeStatement,
      firstRowValues,
      {
        rawResult: true,
        lastInsertRowId,
        changes,
      }
    );
  }

  /**
   * Get the column names of the prepared statement.
   */
  public getColumnNamesSync(): string[] {
    return this.nativeStatement.getColumnNamesSync();
  }

  /**
   * Finalize the prepared statement. This will call the [`sqlite3_finalize()`](https://www.sqlite.org/c3ref/finalize.html) C function under the hood.
   *
   * Attempting to access a finalized statement will result in an error.
   *
   * > **Note:** While `expo-sqlite` will automatically finalize any orphaned prepared statements upon closing the database, it is considered best practice
   * > to manually finalize prepared statements as soon as they are no longer needed. This helps to prevent resource leaks.
   * > You can use the `try...finally` statement to ensure that prepared statements are finalized even if an error occurs.
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
 * const statement = await db.prepareAsync('INSERT INTO test (value) VALUES (?)');
 * try {
 *   const result = await statement.executeAsync(101);
 *   console.log('lastInsertRowId:', result.lastInsertRowId);
 *   console.log('changes:', result.changes);
 * } finally {
 *   await statement.finalizeAsync();
 * }
 * ```
 *
 * @example
 * The result implements the [`AsyncIterator`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/asyncIterator) interface, so you can use it in `for await...of` loops.
 * ```ts
 * const statement = await db.prepareAsync('SELECT value FROM test WHERE value > ?');
 * try {
 *   const result = await statement.executeAsync<{ value: number }>(100);
 *   for await (const row of result) {
 *     console.log('row value:', row.value);
 *   }
 * } finally {
 *   await statement.finalizeAsync();
 * }
 * ```
 *
 * @example
 * If your write operations also return values, you can mix all of them together.
 * ```ts
 * const statement = await db.prepareAsync('INSERT INTO test (name, value) VALUES (?, ?) RETURNING name');
 * try {
 *   const result = await statement.executeAsync<{ name: string }>('John Doe', 101);
 *   console.log('lastInsertRowId:', result.lastInsertRowId);
 *   console.log('changes:', result.changes);
 *   for await (const row of result) {
 *     console.log('name:', row.name);
 *   }
 * } finally {
 *   await statement.finalizeAsync();
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
   * Get the first row of the result set. This requires the SQLite cursor to be in its initial state. If you have already retrieved rows from the result set, you need to reset the cursor first by calling [`resetAsync()`](#resetasync). Otherwise, an error will be thrown.
   */
  getFirstAsync(): Promise<T | null>;

  /**
   * Get all rows of the result set. This requires the SQLite cursor to be in its initial state. If you have already retrieved rows from the result set, you need to reset the cursor first by calling [`resetAsync()`](#resetasync). Otherwise, an error will be thrown.
   */
  getAllAsync(): Promise<T[]>;

  /**
   * Reset the result cursor. For async results (which are eagerly materialized), this resets the
   * iterator position so rows can be re-read from memory. For sync results, this calls
   * [`sqlite3_reset()`](https://www.sqlite.org/c3ref/reset.html) under the hood.
   */
  resetAsync(): Promise<void>;
}

/**
 * A result returned by [`SQLiteStatement.executeSync()`](#executesyncparams).
 * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.

 * @example
 * The result includes the [`lastInsertRowId`](https://www.sqlite.org/c3ref/last_insert_rowid.html) and [`changes`](https://www.sqlite.org/c3ref/changes.html) properties. You can get the information from the write operations.
 * ```ts
 * const statement = db.prepareSync('INSERT INTO test (value) VALUES (?)');
 * try {
 *   const result = statement.executeSync(101);
 *   console.log('lastInsertRowId:', result.lastInsertRowId);
 *   console.log('changes:', result.changes);
 * } finally {
 *   statement.finalizeSync();
 * }
 * ```
 *
 * @example
 * The result implements the [`Iterator`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator) interface, so you can use it in `for...of` loops.
 * ```ts
 * const statement = db.prepareSync('SELECT value FROM test WHERE value > ?');
 * try {
 *   const result = statement.executeSync<{ value: number }>(100);
 *   for (const row of result) {
 *     console.log('row value:', row.value);
 *   }
 * } finally {
 *   statement.finalizeSync();
 * }
 * ```
 *
 * @example
 * If your write operations also return values, you can mix all of them together.
 * ```ts
 * const statement = db.prepareSync('INSERT INTO test (name, value) VALUES (?, ?) RETURNING name');
 * try {
 *   const result = statement.executeSync<{ name: string }>('John Doe', 101);
 *   console.log('lastInsertRowId:', result.lastInsertRowId);
 *   console.log('changes:', result.changes);
 *   for (const row of result) {
 *     console.log('name:', row.name);
 *   }
 * } finally {
 *   statement.finalizeSync();
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
   * Get the first row of the result set. This requires the SQLite cursor to be in its initial state. If you have already retrieved rows from the result set, you need to reset the cursor first by calling [`resetSync()`](#resetsync). Otherwise, an error will be thrown.
   */
  getFirstSync(): T | null;

  /**
   * Get all rows of the result set. This requires the SQLite cursor to be in its initial state. If you have already retrieved rows from the result set, you need to reset the cursor first by calling [`resetSync()`](#resetsync). Otherwise, an error will be thrown.
   */
  getAllSync(): T[];

  /**
   * Reset the prepared statement cursor. This will call the [`sqlite3_reset()`](https://www.sqlite.org/c3ref/reset.html) C function under the hood.
   */
  resetSync(): void;
}

//#region Internals for SQLiteExecuteAsyncResult and SQLiteExecuteSyncResult

interface SQLiteExecuteResultOptions {
  rawResult: boolean;
  lastInsertRowId: number;
  changes: number;
}

/**
 * Create the `SQLiteExecuteAsyncResult` instance.
 *
 * NOTE: Since Hermes does not support the `Symbol.asyncIterator` feature, we have to use an AsyncGenerator to implement the `AsyncIterableIterator` interface.
 * This is done by `Object.defineProperties` to add the properties to the AsyncGenerator.
 */
async function createSQLiteExecuteAsyncResult<T>(
  database: SQLiteAnyDatabase,
  statement: NativeStatement,
  firstRowValues: SQLiteColumnValues | null,
  options: SQLiteExecuteResultOptions,
  remainingRows?: SQLiteColumnValues[]
): Promise<SQLiteExecuteAsyncResult<T>> {
  const instance = new SQLiteExecuteAsyncResultImpl<T>(
    database,
    statement,
    firstRowValues ? processNativeRow(firstRowValues) : null,
    options,
    remainingRows ? processNativeRows(remainingRows) : undefined
  );
  const generator = instance.generatorAsync();
  Object.defineProperties(generator, {
    lastInsertRowId: {
      value: options.lastInsertRowId,
      enumerable: true,
      writable: false,
      configurable: true,
    },
    changes: { value: options.changes, enumerable: true, writable: false, configurable: true },
    getFirstAsync: {
      value: instance.getFirstAsync.bind(instance),
      enumerable: true,
      writable: false,
      configurable: true,
    },
    getAllAsync: {
      value: instance.getAllAsync.bind(instance),
      enumerable: true,
      writable: false,
      configurable: true,
    },
    resetAsync: {
      value: instance.resetAsync.bind(instance),
      enumerable: true,
      writable: false,
      configurable: true,
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
  firstRowValues: SQLiteColumnValues | null,
  options: SQLiteExecuteResultOptions
): SQLiteExecuteSyncResult<T> {
  const instance = new SQLiteExecuteSyncResultImpl<T>(
    database,
    statement,
    firstRowValues ? processNativeRow(firstRowValues) : firstRowValues,
    options
  );
  const generator = instance.generatorSync();
  Object.defineProperties(generator, {
    lastInsertRowId: {
      value: options.lastInsertRowId,
      enumerable: true,
      writable: false,
      configurable: true,
    },
    changes: { value: options.changes, enumerable: true, writable: false, configurable: true },
    getFirstSync: {
      value: instance.getFirstSync.bind(instance),
      enumerable: true,
      writable: false,
      configurable: true,
    },
    getAllSync: {
      value: instance.getAllSync.bind(instance),
      enumerable: true,
      writable: false,
      configurable: true,
    },
    resetSync: {
      value: instance.resetSync.bind(instance),
      enumerable: true,
      writable: false,
      configurable: true,
    },
  });

  return generator as SQLiteExecuteSyncResult<T>;
}

class SQLiteExecuteAsyncResultImpl<T> {
  private columnNames: string[] | null = null;
  private isStepCalled = false;
  /**
   * All result rows, eagerly materialized during executeAsync() to prevent
   * cursor corruption when a shared PreparedStatement is reused concurrently.
   * When set, the result object is fully detached from the native cursor.
   */
  private readonly allRows: SQLiteColumnValues[] | undefined;
  private iteratorIndex = 0;

  constructor(
    private readonly database: SQLiteAnyDatabase,
    private readonly statement: NativeStatement,
    private firstRowValues: SQLiteColumnValues | null,
    public readonly options: SQLiteExecuteResultOptions,
    remainingRows?: SQLiteColumnValues[]
  ) {
    // Build the complete row array: first row + remaining rows
    if (remainingRows != null) {
      if (firstRowValues != null && firstRowValues.length > 0) {
        this.allRows = [firstRowValues, ...remainingRows];
      } else {
        this.allRows = [];
      }
    }
  }

  async getFirstAsync(): Promise<T | null> {
    if (this.isStepCalled) {
      throw new Error(
        'The SQLite cursor has been shifted and is unable to retrieve the first row without being reset. Invoke `resetAsync()` to reset the cursor first if you want to retrieve the first row.'
      );
    }
    this.isStepCalled = true;
    const columnNames = await this.getColumnNamesAsync();
    // Use pre-materialized rows if available
    if (this.allRows != null) {
      return this.allRows.length > 0
        ? composeRowIfNeeded<T>(this.options.rawResult, columnNames, this.allRows[0]!)
        : null;
    }
    // Legacy path: no materialized rows (sync callers, etc.)
    const firstRowValues = this.popFirstRowValues();
    if (firstRowValues != null) {
      return composeRowIfNeeded<T>(this.options.rawResult, columnNames, firstRowValues);
    }
    const firstRow = await this.statement.stepAsync(this.database);
    return firstRow != null
      ? composeRowIfNeeded<T>(this.options.rawResult, columnNames, processNativeRow(firstRow))
      : null;
  }

  async getAllAsync(): Promise<T[]> {
    if (this.isStepCalled) {
      throw new Error(
        'The SQLite cursor has been shifted and is unable to retrieve all rows without being reset. Invoke `resetAsync()` to reset the cursor first if you want to retrieve all rows.'
      );
    }
    this.isStepCalled = true;
    // Use pre-materialized rows if available
    if (this.allRows != null) {
      const columnNames = await this.getColumnNamesAsync();
      return composeRowsIfNeeded<T>(this.options.rawResult, columnNames, this.allRows);
    }
    // Legacy path: no materialized rows
    const firstRowValues = this.popFirstRowValues();
    if (firstRowValues == null) {
      // If the first row is empty, this SQL query may be a write operation.
      // We should not call statement.getAllAsync() to re-execute.
      return [];
    }
    const columnNames = await this.getColumnNamesAsync();
    const nativeRows = await this.statement.getAllAsync(this.database);
    const allRows = processNativeRows(nativeRows);
    if (firstRowValues != null && firstRowValues.length > 0) {
      return composeRowsIfNeeded<T>(this.options.rawResult, columnNames, [
        firstRowValues,
        ...allRows,
      ]);
    }
    return composeRowsIfNeeded<T>(this.options.rawResult, columnNames, allRows);
  }

  async *generatorAsync(): AsyncIterableIterator<T> {
    this.isStepCalled = true;
    const columnNames = await this.getColumnNamesAsync();
    // Use pre-materialized rows if available — fully detached from native cursor
    if (this.allRows != null) {
      while (this.iteratorIndex < this.allRows.length) {
        yield composeRowIfNeeded<T>(
          this.options.rawResult,
          columnNames,
          this.allRows[this.iteratorIndex++]!
        );
      }
    } else {
      // Legacy path: no materialized rows
      const firstRowValues = this.popFirstRowValues();
      if (firstRowValues != null) {
        yield composeRowIfNeeded<T>(this.options.rawResult, columnNames, firstRowValues);
      }
      let result;
      do {
        result = await this.statement.stepAsync(this.database);
        if (result != null) {
          yield composeRowIfNeeded<T>(
            this.options.rawResult,
            columnNames,
            processNativeRow(result)
          );
        }
      } while (result != null);
    }
  }

  async resetAsync(): Promise<void> {
    if (this.allRows == null) {
      // Legacy path: reset the native cursor for non-materialized results
      await this.statement.resetAsync(this.database);
    }
    // For materialized results, only reset JS-side state — no native cursor access
    this.isStepCalled = false;
    this.iteratorIndex = 0;
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
  private isStepCalled = false;

  constructor(
    private readonly database: SQLiteAnyDatabase,
    private readonly statement: NativeStatement,
    private firstRowValues: SQLiteColumnValues | null,
    public readonly options: SQLiteExecuteResultOptions
  ) {}

  getFirstSync(): T | null {
    if (this.isStepCalled) {
      throw new Error(
        'The SQLite cursor has been shifted and is unable to retrieve the first row without being reset. Invoke `resetSync()` to reset the cursor first if you want to retrieve the first row.'
      );
    }
    const columnNames = this.getColumnNamesSync();
    const firstRowValues = this.popFirstRowValues();
    if (firstRowValues != null) {
      return composeRowIfNeeded<T>(this.options.rawResult, columnNames, firstRowValues);
    }
    const firstRow = this.statement.stepSync(this.database);
    return firstRow != null
      ? composeRowIfNeeded<T>(this.options.rawResult, columnNames, processNativeRow(firstRow))
      : null;
  }

  getAllSync(): T[] {
    if (this.isStepCalled) {
      throw new Error(
        'The SQLite cursor has been shifted and is unable to retrieve all rows without being reset. Invoke `resetSync()` to reset the cursor first if you want to retrieve all rows.'
      );
    }
    const firstRowValues = this.popFirstRowValues();
    if (firstRowValues == null) {
      // If the first row is empty, this SQL query may be a write operation. We should not call `statement.getAllAsync()` to write again.
      return [];
    }
    const columnNames = this.getColumnNamesSync();
    const nativeRows = this.statement.getAllSync(this.database);
    const allRows = processNativeRows(nativeRows);
    if (firstRowValues != null && firstRowValues.length > 0) {
      return composeRowsIfNeeded<T>(this.options.rawResult, columnNames, [
        firstRowValues,
        ...allRows,
      ]);
    }
    return composeRowsIfNeeded<T>(this.options.rawResult, columnNames, allRows);
  }

  *generatorSync(): IterableIterator<T> {
    const columnNames = this.getColumnNamesSync();
    const firstRowValues = this.popFirstRowValues();
    if (firstRowValues != null) {
      yield composeRowIfNeeded<T>(this.options.rawResult, columnNames, firstRowValues);
    }
    let result;
    do {
      result = this.statement.stepSync(this.database);
      if (result != null) {
        yield composeRowIfNeeded<T>(this.options.rawResult, columnNames, processNativeRow(result));
      }
    } while (result != null);
  }

  resetSync(): void {
    const result = this.statement.resetSync(this.database);
    this.isStepCalled = false;
    return result;
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

function composeRowIfNeeded<T>(
  rawResult: boolean,
  columnNames: SQLiteColumnNames,
  columnValues: SQLiteColumnValues
): T {
  return rawResult
    ? (columnValues as T) // T would be a ValuesOf<> from caller
    : composeRow<T>(columnNames, columnValues);
}

function composeRowsIfNeeded<T>(
  rawResult: boolean,
  columnNames: SQLiteColumnNames,
  columnValuesList: SQLiteColumnValues[]
): T[] {
  return rawResult
    ? (columnValuesList as T[]) // T[] would be a ValuesOf<>[] from caller
    : composeRows<T>(columnNames, columnValuesList);
}

function processNativeRow(nativeRow: SQLiteColumnValues): SQLiteColumnValues {
  return nativeRow?.map((column) =>
    column instanceof ArrayBuffer ? new Uint8Array(column) : column
  );
}

function processNativeRows(nativeRows: SQLiteColumnValues[]): SQLiteColumnValues[] {
  return nativeRows.map(processNativeRow);
}

//#endregion
