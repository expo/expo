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
   * Finalize the prepared statement. This will call the [`sqlite3_finalize()`](https://www.sqlite.org/c3ref/finalize.html) C function under the hood.
   *
   * Attempting to access a finalized statement will result in an error.
   * > **Note:** While expo-sqlite will automatically finalize any orphaned prepared statements upon closing the database, it is considered best practice to manually finalize prepared statements as soon as they are no longer needed. This helps to prevent resource leaks. You can use the `try...finally` statement to ensure that prepared statements are finalized even if an error occurs.
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
   * Finalize the prepared statement. This will call the [`sqlite3_finalize()`](https://www.sqlite.org/c3ref/finalize.html) C function under the hood.
   *
   * Attempting to access a finalized statement will result in an error.
   * > **Note:** While expo-sqlite will automatically finalize any orphaned prepared statements upon closing the database, it is considered best practice to manually finalize prepared statements as soon as they are no longer needed. This helps to prevent resource leaks. You can use the `try...finally` statement to ensure that prepared statements are finalized even if an error occurs.
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
   * Reset the prepared statement cursor. This will call the [`sqlite3_reset()`](https://www.sqlite.org/c3ref/reset.html) C function under the hood.
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
    lastInsertRowId: {
      value: lastInsertRowId,
      enumerable: true,
      writable: false,
      configurable: true,
    },
    changes: { value: changes, enumerable: true, writable: false, configurable: true },
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
    lastInsertRowId: {
      value: lastInsertRowId,
      enumerable: true,
      writable: false,
      configurable: true,
    },
    changes: { value: changes, enumerable: true, writable: false, configurable: true },
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

  constructor(
    private readonly database: SQLiteAnyDatabase,
    private readonly statement: NativeStatement,
    public readonly lastInsertRowId: number,
    public readonly changes: number,
    private firstRowValues: SQLiteColumnValues | null
  ) {}

  async getFirstAsync(): Promise<T | null> {
    if (this.isStepCalled) {
      throw new Error(
        'The SQLite cursor has been shifted and is unable to retrieve the first row without being reset. Invoke `resetAsync()` to reset the cursor first if you want to retrieve the first row.'
      );
    }
    this.isStepCalled = true;
    const columnNames = await this.getColumnNamesAsync();
    const firstRowValues = this.popFirstRowValues();
    if (firstRowValues != null) {
      return composeRow<T>(columnNames, firstRowValues);
    }
    const firstRow = await this.statement.stepAsync(this.database);
    return firstRow != null ? composeRow<T>(columnNames, firstRow) : null;
  }

  async getAllAsync(): Promise<T[]> {
    if (this.isStepCalled) {
      throw new Error(
        'The SQLite cursor has been shifted and is unable to retrieve all rows without being reset. Invoke `resetAsync()` to reset the cursor first if you want to retrieve all rows.'
      );
    }
    this.isStepCalled = true;
    const columnNames = await this.getColumnNamesAsync();
    const allRows = await this.statement.getAllAsync(this.database);
    const firstRowValues = this.popFirstRowValues();
    if (firstRowValues != null && firstRowValues.length > 0) {
      return composeRows<T>(columnNames, [firstRowValues, ...allRows]);
    }
    return composeRows<T>(columnNames, allRows);
  }

  async *generatorAsync(): AsyncIterableIterator<T> {
    this.isStepCalled = true;
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

  resetAsync(): Promise<void> {
    const result = this.statement.resetAsync(this.database);
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
    public readonly lastInsertRowId: number,
    public readonly changes: number,
    private firstRowValues: SQLiteColumnValues | null
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
      return composeRow<T>(columnNames, firstRowValues);
    }
    const firstRow = this.statement.stepSync(this.database);
    return firstRow != null ? composeRow<T>(columnNames, firstRow) : null;
  }

  getAllSync(): T[] {
    if (this.isStepCalled) {
      throw new Error(
        'The SQLite cursor has been shifted and is unable to retrieve all rows without being reset. Invoke `resetSync()` to reset the cursor first if you want to retrieve all rows.'
      );
    }
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

//#endregion
