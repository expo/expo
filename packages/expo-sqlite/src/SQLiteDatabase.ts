import { type EventSubscription } from 'expo-modules-core';
import { Platform } from 'react-native';

import ExpoSQLite from './ExpoSQLite';
import { flattenOpenOptions, NativeDatabase, SQLiteOpenOptions } from './NativeDatabase';
import { SQLiteSession } from './SQLiteSession';
import {
  SQLiteBindParams,
  SQLiteExecuteAsyncResult,
  SQLiteExecuteSyncResult,
  SQLiteRunResult,
  SQLiteStatement,
  SQLiteVariadicBindParams,
} from './SQLiteStatement';
import { createDatabasePath } from './pathUtils';

export { SQLiteOpenOptions };

/**
 * A SQLite database.
 */
export class SQLiteDatabase {
  constructor(
    public readonly databasePath: string,
    public readonly options: SQLiteOpenOptions,
    public readonly nativeDatabase: NativeDatabase
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
   * [Serialize the database](https://sqlite.org/c3ref/serialize.html) as `Uint8Array`.
   *
   * @param databaseName The name of the current attached databases. The default value is `main` which is the default database name.
   */
  public serializeAsync(databaseName: string = 'main'): Promise<Uint8Array> {
    return this.nativeDatabase.serializeAsync(databaseName);
  }

  /**
   * Create a [prepared SQLite statement](https://www.sqlite.org/c3ref/prepare.html).
   *
   * @param source A string containing the SQL query.
   */
  public async prepareAsync(source: string): Promise<SQLiteStatement> {
    const nativeStatement = new ExpoSQLite.NativeStatement();
    await this.nativeDatabase.prepareAsync(nativeStatement, source);
    return new SQLiteStatement(this.nativeDatabase, nativeStatement);
  }

  /**
   * Create a new session for the database.
   * @see [`sqlite3session_create`](https://www.sqlite.org/session/sqlite3session_create.html)
   * @param dbName The name of the database to create a session for. The default value is `main`.
   */
  public async createSessionAsync(dbName: string = 'main'): Promise<SQLiteSession> {
    const nativeSession = new ExpoSQLite.NativeSession();
    await this.nativeDatabase.createSessionAsync(nativeSession, dbName);
    return new SQLiteSession(this.nativeDatabase, nativeSession);
  }

  /**
   * Load a SQLite extension.
   * @param libPath The path to the extension library file.
   * @param entryPoint The entry point of the extension. If not provided, the default entry point is inferred by [`sqlite3_load_extension`](https://www.sqlite.org/c3ref/load_extension.html).
   *
   * @platform android
   * @platform ios
   * @platform macos
   * @platform tvos
   */
  public loadExtensionAsync(libPath: string, entryPoint?: string): Promise<void> {
    return this.nativeDatabase.loadExtensionAsync(libPath, entryPoint);
  }

  /**
   * Execute a transaction and automatically commit/rollback based on the `task` result.
   *
   * > **Note:** This transaction is not exclusive and can be interrupted by other async queries.
   *
   * @example
   * ```ts
   * db.withTransactionAsync(async () => {
   *   await db.execAsync('UPDATE test SET name = "aaa"');
   *
   *   //
   *   // We cannot control the order of async/await order, so order of execution is not guaranteed.
   *   // The following UPDATE query out of transaction may be executed here and break the expectation.
   *   //
   *
   *   const result = await db.getFirstAsync<{ name: string }>('SELECT name FROM Users');
   *   expect(result?.name).toBe('aaa');
   * });
   * db.execAsync('UPDATE test SET name = "bbb"');
   * ```
   * If you worry about the order of execution, use `withExclusiveTransactionAsync` instead.
   *
   * @param task An async function to execute within a transaction.
   */
  public async withTransactionAsync(task: () => Promise<void>): Promise<void> {
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
   * > **Note:** This function is not supported on web.
   *
   * @param task An async function to execute within a transaction. Any queries inside the transaction must be executed on the `txn` object.
   * The `txn` object has the same interfaces as the [`SQLiteDatabase`](#sqlitedatabase) object. You can use `txn` like a [`SQLiteDatabase`](#sqlitedatabase) object.
   *
   * @platform android
   * @platform ios
   * @platform macos
   * @platform tvos
   *
   * @example
   * ```ts
   * db.withExclusiveTransactionAsync(async (txn) => {
   *   await txn.execAsync('UPDATE test SET name = "aaa"');
   * });
   * ```
   */
  public async withExclusiveTransactionAsync(
    task: (txn: Transaction) => Promise<void>
  ): Promise<void> {
    if (Platform.OS === 'web') {
      throw new Error('withExclusiveTransactionAsync is not supported on web');
    }
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
   * [Serialize the database](https://sqlite.org/c3ref/serialize.html) as `Uint8Array`.
   *
   * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
   *
   * @param databaseName The name of the current attached databases. The default value is `main` which is the default database name.
   */
  public serializeSync(databaseName: string = 'main'): Uint8Array {
    return this.nativeDatabase.serializeSync(databaseName);
  }

  /**
   * Create a [prepared SQLite statement](https://www.sqlite.org/c3ref/prepare.html).
   *
   * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
   *
   * @param source A string containing the SQL query.
   */
  public prepareSync(source: string): SQLiteStatement {
    const nativeStatement = new ExpoSQLite.NativeStatement();
    this.nativeDatabase.prepareSync(nativeStatement, source);
    return new SQLiteStatement(this.nativeDatabase, nativeStatement);
  }

  /**
   * Create a new session for the database.
   *
   * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
   *
   * @see [`sqlite3session_create`](https://www.sqlite.org/session/sqlite3session_create.html)
   * @param dbName The name of the database to create a session for. The default value is `main`.
   */
  public createSessionSync(dbName: string = 'main'): SQLiteSession {
    const nativeSession = new ExpoSQLite.NativeSession();
    this.nativeDatabase.createSessionSync(nativeSession, dbName);
    return new SQLiteSession(this.nativeDatabase, nativeSession);
  }

  /**
   * Load a SQLite extension.
   * @param libPath The path to the extension library file.
   * @param entryPoint The entry point of the extension. If not provided, the default entry point is inferred by [`sqlite3_load_extension`](https://www.sqlite.org/c3ref/load_extension.html).
   *
   * @platform android
   * @platform ios
   * @platform macos
   * @platform tvos
   */
  public loadExtensionSync(libPath: string, entryPoint?: string): void {
    this.nativeDatabase.loadExtensionSync(libPath, entryPoint);
  }

  /**
   * Execute a transaction and automatically commit/rollback based on the `task` result.
   *
   * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
   *
   * @param task An async function to execute within a transaction.
   */
  public withTransactionSync(task: () => void): void {
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
   * A convenience wrapper around [`SQLiteDatabase.prepareAsync()`](#prepareasyncsource), [`SQLiteStatement.executeAsync()`](#executeasyncparams), and [`SQLiteStatement.finalizeAsync()`](#finalizeasync).
   * @param source A string containing the SQL query.
   * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`SQLiteBindValue`](#sqlitebindvalue) for more information about binding values.
   */
  public runAsync(source: string, params: SQLiteBindParams): Promise<SQLiteRunResult>;

  /**
   * @hidden
   */
  public runAsync(source: string, ...params: SQLiteVariadicBindParams): Promise<SQLiteRunResult>;
  public async runAsync(source: string, ...params: any[]): Promise<SQLiteRunResult> {
    const statement = await this.prepareAsync(source);
    let result: SQLiteExecuteAsyncResult<unknown>;
    try {
      result = await statement.executeAsync(...params);
    } finally {
      await statement.finalizeAsync();
    }
    return result;
  }

  /**
   * A convenience wrapper around [`SQLiteDatabase.prepareAsync()`](#prepareasyncsource), [`SQLiteStatement.executeAsync()`](#executeasyncparams), [`SQLiteExecuteAsyncResult.getFirstAsync()`](#getfirstasync), and [`SQLiteStatement.finalizeAsync()`](#finalizeasync).
   * @param source A string containing the SQL query.
   * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`SQLiteBindValue`](#sqlitebindvalue) for more information about binding values.
   */
  public getFirstAsync<T>(source: string, params: SQLiteBindParams): Promise<T | null>;
  /**
   * @hidden
   */
  public getFirstAsync<T>(source: string, ...params: SQLiteVariadicBindParams): Promise<T | null>;
  public async getFirstAsync<T>(source: string, ...params: any[]): Promise<T | null> {
    const statement = await this.prepareAsync(source);
    let firstRow: T | null;
    try {
      const result = await statement.executeAsync<T>(...params);
      firstRow = await result.getFirstAsync();
    } finally {
      await statement.finalizeAsync();
    }
    return firstRow;
  }

  /**
   * A convenience wrapper around [`SQLiteDatabase.prepareAsync()`](#prepareasyncsource), [`SQLiteStatement.executeAsync()`](#executeasyncparams), [`SQLiteExecuteAsyncResult`](#sqliteexecuteasyncresult) `AsyncIterator`, and [`SQLiteStatement.finalizeAsync()`](#finalizeasync).
   * @param source A string containing the SQL query.
   * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`SQLiteBindValue`](#sqlitebindvalue) for more information about binding values.
   * @returns Rather than returning Promise, this function returns an [`AsyncIterableIterator`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncIterator). You can use `for await...of` to iterate over the rows from the SQLite query result.
   */
  public getEachAsync<T>(source: string, params: SQLiteBindParams): AsyncIterableIterator<T>;
  /**
   * @hidden
   */
  public getEachAsync<T>(
    source: string,
    ...params: SQLiteVariadicBindParams
  ): AsyncIterableIterator<T>;
  public async *getEachAsync<T>(source: string, ...params: any[]): AsyncIterableIterator<T> {
    const statement = await this.prepareAsync(source);
    try {
      const result = await statement.executeAsync<T>(...params);
      for await (const row of result) {
        yield row;
      }
    } finally {
      await statement.finalizeAsync();
    }
  }

  /**
   * A convenience wrapper around [`SQLiteDatabase.prepareAsync()`](#prepareasyncsource), [`SQLiteStatement.executeAsync()`](#executeasyncparams), [`SQLiteExecuteAsyncResult.getAllAsync()`](#getallasync), and [`SQLiteStatement.finalizeAsync()`](#finalizeasync).
   * @param source A string containing the SQL query.
   * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`SQLiteBindValue`](#sqlitebindvalue) for more information about binding values.
   * @example
   * ```ts
   * // For unnamed parameters, you pass values in an array.
   * db.getAllAsync('SELECT * FROM test WHERE intValue = ? AND name = ?', [1, 'Hello']);
   *
   * // For unnamed parameters, you pass values in variadic arguments.
   * db.getAllAsync('SELECT * FROM test WHERE intValue = ? AND name = ?', 1, 'Hello');
   *
   * // For named parameters, you should pass values in object.
   * db.getAllAsync('SELECT * FROM test WHERE intValue = $intValue AND name = $name', { $intValue: 1, $name: 'Hello' });
   * ```
   */
  public getAllAsync<T>(source: string, params: SQLiteBindParams): Promise<T[]>;
  /**
   * @hidden
   */
  public getAllAsync<T>(source: string, ...params: SQLiteVariadicBindParams): Promise<T[]>;
  public async getAllAsync<T>(source: string, ...params: any[]): Promise<T[]> {
    const statement = await this.prepareAsync(source);
    let allRows;
    try {
      const result = await statement.executeAsync<T>(...params);
      allRows = await result.getAllAsync();
    } finally {
      await statement.finalizeAsync();
    }
    return allRows;
  }

  /**
   * A convenience wrapper around [`SQLiteDatabase.prepareSync()`](#preparesyncsource), [`SQLiteStatement.executeSync()`](#executesyncparams), and [`SQLiteStatement.finalizeSync()`](#finalizesync).
   * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
   * @param source A string containing the SQL query.
   * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`SQLiteBindValue`](#sqlitebindvalue) for more information about binding values.
   */
  public runSync(source: string, params: SQLiteBindParams): SQLiteRunResult;
  /**
   * @hidden
   */
  public runSync(source: string, ...params: SQLiteVariadicBindParams): SQLiteRunResult;
  public runSync(source: string, ...params: any[]): SQLiteRunResult {
    const statement = this.prepareSync(source);
    let result: SQLiteExecuteSyncResult<unknown>;
    try {
      result = statement.executeSync(...params);
    } finally {
      statement.finalizeSync();
    }
    return result;
  }

  /**
   * A convenience wrapper around [`SQLiteDatabase.prepareSync()`](#preparesyncsource), [`SQLiteStatement.executeSync()`](#executesyncparams), [`SQLiteExecuteSyncResult.getFirstSync()`](#getfirstsync), and [`SQLiteStatement.finalizeSync()`](#finalizesync).
   * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
   * @param source A string containing the SQL query.
   * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`SQLiteBindValue`](#sqlitebindvalue) for more information about binding values.
   */
  public getFirstSync<T>(source: string, params: SQLiteBindParams): T | null;
  /**
   * @hidden
   */
  public getFirstSync<T>(source: string, ...params: SQLiteVariadicBindParams): T | null;
  public getFirstSync<T>(source: string, ...params: any[]): T | null {
    const statement = this.prepareSync(source);
    let firstRow: T | null;
    try {
      const result = statement.executeSync<T>(...params);
      firstRow = result.getFirstSync();
    } finally {
      statement.finalizeSync();
    }
    return firstRow;
  }

  /**
   * A convenience wrapper around [`SQLiteDatabase.prepareSync()`](#preparesyncsource), [`SQLiteStatement.executeSync()`](#executesyncparams), [`SQLiteExecuteSyncResult`](#sqliteexecutesyncresult) `Iterator`, and [`SQLiteStatement.finalizeSync()`](#finalizesync).
   * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
   * @param source A string containing the SQL query.
   * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`SQLiteBindValue`](#sqlitebindvalue) for more information about binding values.
   * @returns This function returns an [`IterableIterator`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator). You can use `for...of` to iterate over the rows from the SQLite query result.
   */
  public getEachSync<T>(source: string, params: SQLiteBindParams): IterableIterator<T>;
  /**
   * @hidden
   */
  public getEachSync<T>(source: string, ...params: SQLiteVariadicBindParams): IterableIterator<T>;
  public *getEachSync<T>(source: string, ...params: any[]): IterableIterator<T> {
    const statement = this.prepareSync(source);
    try {
      const result = statement.executeSync<T>(...params);
      for (const row of result) {
        yield row;
      }
    } finally {
      statement.finalizeSync();
    }
  }

  /**
   * A convenience wrapper around [`SQLiteDatabase.prepareSync()`](#preparesyncsource), [`SQLiteStatement.executeSync()`](#executesyncparams), [`SQLiteExecuteSyncResult.getAllSync()`](#getallsync), and [`SQLiteStatement.finalizeSync()`](#finalizesync).
   * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
   * @param source A string containing the SQL query.
   * @param params The parameters to bind to the prepared statement. You can pass values in array, object, or variadic arguments. See [`SQLiteBindValue`](#sqlitebindvalue) for more information about binding values.
   */
  public getAllSync<T>(source: string, params: SQLiteBindParams): T[];
  /**
   * @hidden
   */
  public getAllSync<T>(source: string, ...params: SQLiteVariadicBindParams): T[];
  public getAllSync<T>(source: string, ...params: any[]): T[] {
    const statement = this.prepareSync(source);
    let allRows;
    try {
      const result = statement.executeSync<T>(...params);
      allRows = result.getAllSync();
    } finally {
      statement.finalizeSync();
    }
    return allRows;
  }

  /**
   * Synchronize the local database with the remote libSQL server.
   * This method is only available from libSQL integration.
   */
  public syncLibSQL(): Promise<void> {
    if (typeof this.nativeDatabase.syncLibSQL !== 'function') {
      throw new Error('syncLibSQL is not supported in the current environment');
    }
    return this.nativeDatabase.syncLibSQL();
  }

  //#endregion
}

/**
 * The default directory for SQLite databases.
 */
export const defaultDatabaseDirectory = ExpoSQLite.defaultDatabaseDirectory;

/**
 * The pre-bundled SQLite extensions.
 */
export const bundledExtensions: Record<
  string,
  { libPath: string; entryPoint: string } | undefined
> = ExpoSQLite.bundledExtensions;

/**
 * Open a database.
 *
 * @param databaseName The name of the database file to open.
 * @param options Open options.
 * @param directory The directory where the database file is located. The default value is `defaultDatabaseDirectory`. This parameter is not supported on web.
 */
export async function openDatabaseAsync(
  databaseName: string,
  options?: SQLiteOpenOptions,
  directory?: string
): Promise<SQLiteDatabase> {
  const openOptions = options ?? {};
  const databasePath = createDatabasePath(databaseName, directory);
  await ExpoSQLite.ensureDatabasePathExistsAsync(databasePath);
  const nativeDatabase = new ExpoSQLite.NativeDatabase(
    databasePath,
    flattenOpenOptions(openOptions)
  );
  await nativeDatabase.initAsync();
  return new SQLiteDatabase(databasePath, openOptions, nativeDatabase);
}

/**
 * Open a database.
 *
 * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
 *
 * @param databaseName The name of the database file to open.
 * @param options Open options.
 * @param directory The directory where the database file is located. The default value is `defaultDatabaseDirectory`. This parameter is not supported on web.
 */
export function openDatabaseSync(
  databaseName: string,
  options?: SQLiteOpenOptions,
  directory?: string
): SQLiteDatabase {
  const openOptions = options ?? {};
  const databasePath = createDatabasePath(databaseName, directory);
  ExpoSQLite.ensureDatabasePathExistsSync(databasePath);
  const nativeDatabase = new ExpoSQLite.NativeDatabase(
    databasePath,
    flattenOpenOptions(openOptions)
  );
  nativeDatabase.initSync();
  return new SQLiteDatabase(databasePath, openOptions, nativeDatabase);
}

/**
 * Given a `Uint8Array` data and [deserialize to memory database](https://sqlite.org/c3ref/deserialize.html).
 *
 * @param serializedData The binary array to deserialize from [`SQLiteDatabase.serializeAsync()`](#serializeasyncdatabasename).
 * @param options Open options.
 */
export async function deserializeDatabaseAsync(
  serializedData: Uint8Array,
  options?: SQLiteOpenOptions
): Promise<SQLiteDatabase> {
  const openOptions = options ?? {};
  const nativeDatabase = new ExpoSQLite.NativeDatabase(
    ':memory:',
    flattenOpenOptions(openOptions),
    serializedData
  );
  await nativeDatabase.initAsync();
  return new SQLiteDatabase(':memory:', openOptions, nativeDatabase);
}

/**
 * Given a `Uint8Array` data and [deserialize to memory database](https://sqlite.org/c3ref/deserialize.html).
 *
 * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
 *
 * @param serializedData The binary array to deserialize from [`SQLiteDatabase.serializeSync()`](#serializesyncdatabasename)
 * @param options Open options.
 */
export function deserializeDatabaseSync(
  serializedData: Uint8Array,
  options?: SQLiteOpenOptions
): SQLiteDatabase {
  const openOptions = options ?? {};
  const nativeDatabase = new ExpoSQLite.NativeDatabase(
    ':memory:',
    flattenOpenOptions(openOptions),
    serializedData
  );
  nativeDatabase.initSync();
  return new SQLiteDatabase(':memory:', openOptions, nativeDatabase);
}

/**
 * Delete a database file.
 *
 * @param databaseName The name of the database file to delete.
 * @param directory The directory where the database file is located. The default value is `defaultDatabaseDirectory`.
 */
export async function deleteDatabaseAsync(databaseName: string, directory?: string): Promise<void> {
  const databasePath = createDatabasePath(databaseName, directory);
  return await ExpoSQLite.deleteDatabaseAsync(databasePath);
}

/**
 * Delete a database file.
 *
 * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
 *
 * @param databaseName The name of the database file to delete.
 * @param directory The directory where the database file is located. The default value is `defaultDatabaseDirectory`.
 */
export function deleteDatabaseSync(databaseName: string, directory?: string): void {
  const databasePath = createDatabasePath(databaseName, directory);
  return ExpoSQLite.deleteDatabaseSync(databasePath);
}

/**
 * Backup a database to another database.
 *
 * @see https://www.sqlite.org/c3ref/backup_finish.html
 *
 * @param options - The backup options
 * @param options.sourceDatabase - The source database to backup from
 * @param options.sourceDatabaseName - The name of the source database. The default value is `main`
 * @param options.destDatabase - The destination database to backup to
 * @param options.destDatabaseName - The name of the destination database. The default value is `m
 */
export function backupDatabaseAsync({
  sourceDatabase,
  sourceDatabaseName,
  destDatabase,
  destDatabaseName,
}: {
  sourceDatabase: SQLiteDatabase;
  sourceDatabaseName?: string;
  destDatabase: SQLiteDatabase;
  destDatabaseName?: string;
}): Promise<void> {
  return ExpoSQLite.backupDatabaseAsync(
    destDatabase.nativeDatabase,
    destDatabaseName ?? 'main',
    sourceDatabase.nativeDatabase,
    sourceDatabaseName ?? 'main'
  );
}

/**
 * Backup a database to another database.
 *
 * > **Note:** Running heavy tasks with this function can block the JavaScript thread and affect performance.
 *
 * @see https://www.sqlite.org/c3ref/backup_finish.html
 *
 * @param options - The backup options
 * @param options.sourceDatabase - The source database to backup from
 * @param options.sourceDatabaseName - The name of the source database. The default value is `main`
 * @param options.destDatabase - The destination database to backup to
 * @param options.destDatabaseName - The name of the destination database. The default value is `m
 */
export function backupDatabaseSync({
  sourceDatabase,
  sourceDatabaseName,
  destDatabase,
  destDatabaseName,
}: {
  sourceDatabase: SQLiteDatabase;
  sourceDatabaseName?: string;
  destDatabase: SQLiteDatabase;
  destDatabaseName?: string;
}): void {
  return ExpoSQLite.backupDatabaseSync(
    destDatabase.nativeDatabase,
    destDatabaseName ?? 'main',
    sourceDatabase.nativeDatabase,
    sourceDatabaseName ?? 'main'
  );
}

/**
 * The event payload for the listener of [`addDatabaseChangeListener`](#sqliteadddatabasechangelistenerlistener)
 */
export type DatabaseChangeEvent = {
  /** The database name. The value would be `main` by default and other database names if you use `ATTACH DATABASE` statement. */
  databaseName: string;

  /** The absolute file path to the database. */
  databaseFilePath: string;

  /** The table name. */
  tableName: string;

  /** The changed row ID. */
  rowId: number;
};

/**
 * Add a listener for database changes.
 * > Note: to enable this feature, you must set [`enableChangeListener` to `true`](#sqliteopenoptions) when opening the database.
 *
 * @param listener A function that receives the `databaseName`, `databaseFilePath`, `tableName` and `rowId` of the modified data.
 * @returns A `Subscription` object that you can call `remove()` on when you would like to unsubscribe the listener.
 */
export function addDatabaseChangeListener(
  listener: (event: DatabaseChangeEvent) => void
): EventSubscription {
  return ExpoSQLite.addListener('onDatabaseChange', listener);
}

/**
 * A new connection specific used for [`withExclusiveTransactionAsync`](#withexclusivetransactionasynctask).
 * @hidden not going to pull all the database methods to the document.
 */
class Transaction extends SQLiteDatabase {
  public static async createAsync(db: SQLiteDatabase): Promise<Transaction> {
    const options = { ...db.options, useNewConnection: true };
    const nativeDatabase = new ExpoSQLite.NativeDatabase(
      db.databasePath,
      flattenOpenOptions(options)
    );
    await nativeDatabase.initAsync();
    return new Transaction(db.databasePath, options, nativeDatabase);
  }
}
