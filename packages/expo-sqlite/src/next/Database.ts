import { EventEmitter, Subscription } from 'expo-modules-core';

import ExpoSQLite from './ExpoSQLiteNext';
import { NativeDatabase, OpenOptions } from './NativeDatabase';
import { BindParams, RunResult, Statement, VariadicBindParams } from './Statement';

export { OpenOptions };

const emitter = new EventEmitter(ExpoSQLite);

/**
 * A SQLite database.
 */
export class Database {
  constructor(
    public readonly dbName: string,
    private readonly nativeDatabase: NativeDatabase
  ) {}

  /**
   * Asynchronous call to return whether the database is currently in a transaction.
   */
  public isInTransactionAsync(): Promise<boolean> {
    return this.nativeDatabase.isInTransactionAsync();
  }

  /**
   * Close the database.
   */
  public closeAsync(): Promise<void> {
    return this.nativeDatabase.closeAsync();
  }

  /**
   * Execute all SQL queries in the supplied string.
   * > Note: The queries are not escaped for you! Be careful when constructing your queries.
   *
   * @param source A string containing all the SQL queries.
   */
  public execAsync(source: string): Promise<void> {
    return this.nativeDatabase.execAsync(source);
  }

  /**
   * Prepare a SQL statement.
   *
   * @param source A string containing the SQL query.
   */
  public async prepareAsync(source: string): Promise<Statement> {
    const nativeStatement = new ExpoSQLite.NativeStatement();
    await this.nativeDatabase.prepareAsync(nativeStatement, source);
    return new Statement(this.nativeDatabase, nativeStatement);
  }

  /**
   * Execute a transaction and automatically commit/rollback based on the `task` result.
   *
   * > **Note:** This transaction is not exclusive and can be interrupted by other async queries.
   * @example
   * ```ts
   * db.transactionAsync(async () => {
   *   await db.execAsync('UPDATE test SET name = "aaa"');
   *
   *   //
   *   // We cannot control the order of async/await order, so order of execution is not guaranteed.
   *   // The following UPDATE query out of transaction may be executed here and break the expectation.
   *   //
   *
   *   const result = await db.getAsync<{ name: string }>('SELECT name FROM Users');
   *   expect(result?.name).toBe('aaa');
   * });
   * db.execAsync('UPDATE test SET name = "bbb"');
   * ```
   * If you worry about the order of execution, use `transactionExclusiveAsync` instead.
   *
   * @param task An async function to execute within a transaction.
   */
  public async transactionAsync(task: () => Promise<void>): Promise<void> {
    try {
      await this.execAsync('BEGIN');
      await task();
      await this.execAsync('COMMIT');
    } catch (e) {
      await this.execAsync('ROLLBACK');
      throw e;
    }
  }

  /**
   * Execute a transaction and automatically commit/rollback based on the `task` result.
   *
   * The transaction may be exclusive.
   * As long as the transaction is converted into a write transaction,
   * the other async write queries will abort with `database is locked` error.
   *
   * @param task An async function to execute within a transaction. Any queries inside the transaction must be executed on the `txn` object.
   * The `txn` object has the same interfaces as the `Database` object. You can use `txn` like a `Database` object.
   *
   * @example
   * ```ts
   * db.transactionExclusiveAsync(async (txn) => {
   *   await txn.execAsync('UPDATE test SET name = "aaa"');
   * });
   * ```
   */
  public async transactionExclusiveAsync(task: (txn: Transaction) => Promise<void>): Promise<void> {
    const transaction = await Transaction.createAsync(this);
    let error;
    try {
      await transaction.execAsync('BEGIN');
      await task(transaction);
      await transaction.execAsync('COMMIT');
    } catch (e) {
      await transaction.execAsync('ROLLBACK');
      error = e;
    } finally {
      await transaction.closeAsync();
    }
    if (error) {
      throw error;
    }
  }

  /**
   * Synchronous call to return whether the database is currently in a transaction.
   */
  public isInTransactionSync(): boolean {
    return this.nativeDatabase.isInTransactionSync();
  }

  /**
   * Close the database.
   */
  public closeSync(): void {
    return this.nativeDatabase.closeSync();
  }

  /**
   * Execute all SQL queries in the supplied string.
   *
   * > **Note:** The queries are not escaped for you! Be careful when constructing your queries.
   *
   * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
   *
   * @param source A string containing all the SQL queries.
   */
  public execSync(source: string): void {
    return this.nativeDatabase.execSync(source);
  }

  /**
   * Prepare a SQL statement.
   *
   * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
   *
   * @param source A string containing the SQL query.
   */
  public prepareSync(source: string): Statement {
    const nativeStatement = new ExpoSQLite.NativeStatement();
    this.nativeDatabase.prepareSync(nativeStatement, source);
    return new Statement(this.nativeDatabase, nativeStatement);
  }

  /**
   * Execute a transaction and automatically commit/rollback based on the `task` result.
   *
   * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
   *
   * @param task An async function to execute within a transaction.
   */
  public transactionSync(task: () => void): void {
    try {
      this.execSync('BEGIN');
      task();
      this.execSync('COMMIT');
    } catch (e) {
      this.execSync('ROLLBACK');
      throw e;
    }
  }

  //#region Statement API shorthands

  /**
   * Shorthand for [`prepareAsync()`](#prepareasyncsource) and [`Statement.runAsync()`](#runasyncparams).
   * Unlike [`Statement.runAsync()`](#runasyncparams), this method finalizes the statement after execution.
   * @param source A string containing the SQL query.
   * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`BindValue`](#bindvalue) for more information about binding values.
   */
  public runAsync(source: string, params: BindParams): Promise<RunResult>;

  /**
   * @hidden
   */
  public runAsync(source: string, ...params: VariadicBindParams): Promise<RunResult>;
  public async runAsync(source: string, ...params: any[]): Promise<RunResult> {
    const statement = await this.prepareAsync(source);
    let result;
    try {
      result = await statement.runAsync(...params);
    } finally {
      await statement.finalizeAsync();
    }
    return result;
  }

  /**
   * Shorthand for [`prepareAsync()`](#prepareasyncsource) and [`Statement.getAsync()`](#getasyncparams).
   * Unlike [`Statement.getAsync()`](#getasyncparams), this method finalizes the statement after execution.
   * @param source A string containing the SQL query.
   * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`BindValue`](#bindvalue) for more information about binding values.
   */
  public getAsync<T>(source: string, params: BindParams): Promise<T | null>;
  /**
   * @hidden
   */
  public getAsync<T>(source: string, ...params: VariadicBindParams): Promise<T | null>;
  public async getAsync<T>(source: string, ...params: any[]): Promise<T | null> {
    const statement = await this.prepareAsync(source);
    let result;
    try {
      result = await statement.getAsync<T>(...params);
    } finally {
      await statement.finalizeAsync();
    }
    return result;
  }

  /**
   * Shorthand for [`prepareAsync()`](#prepareasyncsource) and [`Statement.eachAsync()`](#eachasyncparams).
   * Unlike [`Statement.eachAsync()`](#eachasyncparams), this method finalizes the statement after execution.
   * @param source A string containing the SQL query.
   * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`BindValue`](#bindvalue) for more information about binding values.
   */
  public eachAsync<T>(source: string, params: BindParams): AsyncIterableIterator<T>;
  /**
   * @hidden
   */
  public eachAsync<T>(source: string, ...params: VariadicBindParams): AsyncIterableIterator<T>;
  public async *eachAsync<T>(source: string, ...params: any[]): AsyncIterableIterator<T> {
    const statement = await this.prepareAsync(source);
    try {
      yield* await statement.eachAsync<T>(...params);
    } finally {
      await statement.finalizeAsync();
    }
  }

  /**
   * Shorthand for [`prepareAsync()`](#prepareasyncsource) and [`Statement.allAsync()`](#allasyncparams).
   * Unlike [`Statement.allAsync()`](#allasyncparams), this method finalizes the statement after execution.
   * @param source A string containing the SQL query.
   * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`BindValue`](#bindvalue) for more information about binding values.
   * @example
   * ```ts
   * // For unnamed parameters, you pass values in an array.
   * db.allAsync('SELECT * FROM test WHERE intValue = ? AND name = ?', [1, 'Hello']);
   *
   * // For unnamed parameters, you pass values in variadic arguments.
   * db.allAsync('SELECT * FROM test WHERE intValue = ? AND name = ?', 1, 'Hello');
   *
   * // For named parameters, you should pass values in object.
   * db.allAsync('SELECT * FROM test WHERE intValue = $intValue AND name = $name', { $intValue: 1, $name: 'Hello' });
   * ```
   */
  public allAsync<T>(source: string, params: BindParams): Promise<T[]>;
  /**
   * @hidden
   */
  public allAsync<T>(source: string, ...params: VariadicBindParams): Promise<T[]>;
  public async allAsync<T>(source: string, ...params: any[]): Promise<T[]> {
    const statement = await this.prepareAsync(source);
    let result;
    try {
      result = await statement.allAsync<T>(...params);
    } finally {
      await statement.finalizeAsync();
    }
    return result;
  }

  /**
   * Shorthand for [`prepareAsync()`](#prepareasyncsource) and [`Statement.runSync()`](#runsyncparams).
   * Unlike [`Statement.runSync()`](#runsyncparams), this method finalizes the statement after execution.
   * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
   * @param source A string containing the SQL query.
   * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`BindValue`](#bindvalue) for more information about binding values.
   */
  public runSync(source: string, params: BindParams): RunResult;
  /**
   * @hidden
   */
  public runSync(source: string, ...params: VariadicBindParams): RunResult;
  public runSync(source: string, ...params: any[]): RunResult {
    const statement = this.prepareSync(source);
    let result;
    try {
      result = statement.runSync(...params);
    } finally {
      statement.finalizeSync();
    }
    return result;
  }

  /**
   * Shorthand for [`prepareAsync()`](#prepareasyncsource) and [`Statement.getSync()`](#getsyncparams).
   * Unlike [`Statement.getSync()`](#getsyncparams), this method finalizes the statement after execution.
   * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
   * @param source A string containing the SQL query.
   * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`BindValue`](#bindvalue) for more information about binding values.
   */
  public getSync<T>(source: string, params: BindParams): T | null;
  /**
   * @hidden
   */
  public getSync<T>(source: string, ...params: VariadicBindParams): T | null;
  public getSync<T>(source: string, ...params: any[]): T | null {
    const statement = this.prepareSync(source);
    let result;
    try {
      result = statement.getSync<T>(...params);
    } finally {
      statement.finalizeSync();
    }
    return result;
  }

  /**
   * Shorthand for [`prepareAsync()`](#prepareasyncsource) and [`Statement.eachSync()`](#eachsyncparams).
   * Unlike [`Statement.eachSync()`](#eachsyncparams), this method finalizes the statement after execution.
   * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
   * @param source A string containing the SQL query.
   * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`BindValue`](#bindvalue) for more information about binding values.
   */
  public eachSync<T>(source: string, params: BindParams): IterableIterator<T>;
  /**
   * @hidden
   */
  public eachSync<T>(source: string, ...params: VariadicBindParams): IterableIterator<T>;
  public *eachSync<T>(source: string, ...params: any[]): IterableIterator<T> {
    const statement = this.prepareSync(source);
    try {
      yield* statement.eachSync<T>(...params);
    } finally {
      statement.finalizeSync();
    }
  }

  /**
   * Shorthand for [`prepareAsync()`](#prepareasyncsource) and [`Statement.allSync()`](#allsyncparams).
   * Unlike [`Statement.allSync()`](#allsyncparams), this method finalizes the statement after execution.
   * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
   * @param source A string containing the SQL query.
   * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`BindValue`](#bindvalue) for more information about binding values.
   */
  public allSync<T>(source: string, params: BindParams): T[];
  /**
   * @hidden
   */
  public allSync<T>(source: string, ...params: VariadicBindParams): T[];
  public allSync<T>(source: string, ...params: any[]): T[] {
    const statement = this.prepareSync(source);
    let result;
    try {
      result = statement.allSync<T>(...params);
    } finally {
      statement.finalizeSync();
    }
    return result;
  }

  //#endregion
}

/**
 * Open a database.
 *
 * @param dbName The name of the database file to open.
 * @param options Open options.
 */
export async function openDatabaseAsync(dbName: string, options?: OpenOptions): Promise<Database> {
  const nativeDatabase = new ExpoSQLite.NativeDatabase(dbName, options ?? {});
  await nativeDatabase.initAsync();
  return new Database(dbName, nativeDatabase);
}

/**
 * Open a database.
 *
 * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
 *
 * @param dbName The name of the database file to open.
 * @param options Open options.
 */
export function openDatabaseSync(dbName: string, options?: OpenOptions): Database {
  const nativeDatabase = new ExpoSQLite.NativeDatabase(dbName, options ?? {});
  nativeDatabase.initSync();
  return new Database(dbName, nativeDatabase);
}

/**
 * Delete a database file.
 *
 * @param dbName The name of the database file to delete.
 */
export async function deleteDatabaseAsync(dbName: string): Promise<void> {
  return await ExpoSQLite.deleteDatabaseAsync(dbName);
}

/**
 * Delete a database file.
 *
 * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
 *
 * @param dbName The name of the database file to delete.
 */
export function deleteDatabaseSync(dbName: string): void {
  return ExpoSQLite.deleteDatabaseSync(dbName);
}

/**
 * The event payload for the listener of [`addDatabaseChangeListener`](#sqliteadddatabasechangelistenerlistener)
 */
export type DatabaseChangeEvent = {
  /** The database name. The value would be `main` by default and other database names if you use `ATTACH DATABASE` statement. */
  dbName: string;

  /** The absolute file path to the database. */
  dbFilePath: string;

  /** The table name. */
  tableName: string;

  /** The changed row ID. */
  rowId: number;
};

/**
 * Add a listener for database changes.
 * > Note: to enable this feature, you must set [`enableChangeListener` to `true`](#openoptions) when opening the database.
 *
 * @param listener A function that receives the `dbFilePath`, `dbName`, `tableName` and `rowId` of the modified data.
 * @returns A `Subscription` object that you can call `remove()` on when you would like to unsubscribe the listener.
 */
export function addDatabaseChangeListener(
  listener: (event: DatabaseChangeEvent) => void
): Subscription {
  return emitter.addListener('onDatabaseChange', listener);
}

/**
 * A new connection specific used for [`transactionExclusiveAsync`](#transactionexclusiveasynctask).
 * @hidden not going to pull all the database methods to the document.
 */
class Transaction extends Database {
  public static async createAsync(db: Database): Promise<Transaction> {
    const nativeDatabase = new ExpoSQLite.NativeDatabase(db.dbName, { useNewConnection: true });
    await nativeDatabase.initAsync();
    return new Transaction(db.dbName, nativeDatabase);
  }
}
