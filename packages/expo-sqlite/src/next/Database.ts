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
  constructor(private readonly nativeDatabase: NativeDatabase) {}

  /**
   * Synchronous call to return whether the database is currently in a transaction.
   */
  public isInTransaction(): boolean {
    return this.nativeDatabase.isInTransaction();
  }

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
   * @returns A `Statement` object.
   */
  public async prepareAsync(source: string): Promise<Statement> {
    const nativeStatement = new ExpoSQLite.NativeStatement();
    await this.nativeDatabase.prepareAsync(nativeStatement, source);
    return new Statement(this.nativeDatabase, nativeStatement);
  }

  /**
   * Execute a transaction and automatically commit/rollback based on the `txn` success.
   *
   * @param txn An async function to execute within a transaction.
   */
  public async transactionAsync(txn: () => Promise<void>): Promise<void> {
    try {
      await this.nativeDatabase.execAsync('BEGIN');
      await txn();
      await this.nativeDatabase.execAsync('COMMIT');
    } catch (e) {
      await this.nativeDatabase.execAsync('ROLLBACK');
      throw e;
    }
  }

  //#region Statement API shorthands

  /**
   * Shorthand for `prepareAsync` and `Statement.runAsync`.
   * Unlike `Statement.runAsync`, this method finalizes the statement after execution.
   *
   * @param source A string containing the SQL query.
   * @param params Parameters to bind to the query.
   */
  public runAsync(source: string, ...params: VariadicBindParams): Promise<RunResult>;
  public runAsync(source: string, params: BindParams): Promise<RunResult>;
  public async runAsync(source: string, ...params: any[]): Promise<RunResult> {
    const statement = await this.prepareAsync(source);
    const result = await statement.runAsync(...params);
    await statement.finalizeAsync();
    return result;
  }

  /**
   * Shorthand for `prepareAsync` and `Statement.getAsync`.
   * Unlike `Statement.getAsync`, this method finalizes the statement after execution.
   *
   * @param source A string containing the SQL query.
   * @param params Parameters to bind to the query.
   */
  public getAsync<T>(source: string, ...params: VariadicBindParams): Promise<T | null>;
  public getAsync<T>(source: string, params: BindParams): Promise<T | null>;
  public async getAsync<T>(source: string, ...params: any[]): Promise<T | null> {
    const statement = await this.prepareAsync(source);
    const result = await statement.getAsync<T>(...params);
    await statement.finalizeAsync();
    return result;
  }

  /**
   * Shorthand for `prepareAsync` and `Statement.eachAsync`.
   * Unlike `Statement.eachAsync`, this method finalizes the statement after execution.
   *
   * @param source A string containing the SQL query.
   * @param params Parameters to bind to the query.
   */
  public eachAsync<T>(source: string, ...params: VariadicBindParams): AsyncIterableIterator<T>;
  public eachAsync<T>(source: string, params: BindParams): AsyncIterableIterator<T>;
  public async *eachAsync<T>(source: string, ...params: any[]): AsyncIterableIterator<T> {
    const statement = await this.prepareAsync(source);
    yield* statement.eachAsync<T>(...params);
    await statement.finalizeAsync();
  }

  /**
   * Shorthand for `prepareAsync` and `Statement.allAsync`.
   * Unlike `Statement.allAsync`, this method finalizes the statement after execution.
   *
   * @param source A string containing the SQL query.
   * @param params Parameters to bind to the query.
   */
  public allAsync<T>(source: string, ...params: VariadicBindParams): Promise<T[]>;
  public allAsync<T>(source: string, params: BindParams): Promise<T[]>;
  public async allAsync<T>(source: string, ...params: any[]): Promise<T[]> {
    const statement = await this.prepareAsync(source);
    const result = await statement.allAsync<T>(...params);
    await statement.finalizeAsync();
    return result;
  }

  //#endregion
}

/**
 * Open a database.
 *
 * @param dbName The name of the database file to open.
 * @param options Open options.
 * @returns Database object.
 */
export async function openDatabaseAsync(dbName: string, options?: OpenOptions): Promise<Database> {
  const nativeDatabase = new ExpoSQLite.NativeDatabase(dbName, options ?? {});
  await nativeDatabase.initAsync();
  return new Database(nativeDatabase);
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
 * Add a listener for database changes.
 * > Note: to enable this feature, you must set `enableChangeListener` to `true` when opening the database.
 *
 * @param listener A function that receives the `dbName`, `tableName` and `rowId` of the modified data.
 * @returns A `Subscription` object that you can call `remove()` on when you would like to unsubscribe the listener.
 */
export function addDatabaseChangeListener(
  listener: (event: { dbName: string; tableName: string; rowId: number }) => void
): Subscription {
  return emitter.addListener('onDatabaseChange', listener);
}
