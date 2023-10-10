import { EventEmitter, Subscription } from 'expo-modules-core';

import ExpoSQLite from './ExpoSQLiteNext';
import { BindParams, RunResult, Statement, VariadicBindParams } from './Statement';

const emitter = new EventEmitter(ExpoSQLite);

/**
 * Options for opening a database.
 */
export interface OpenOptions {
  /**
   * Whether to enable the CR-SQLite extension.
   * @default false
   */
  enableCRSQLite?: boolean;

  /**
   * Whether to call the `sqlite3_update_hook` function and enable the `onDatabaseChange` events.
   * @default false
   */
  enableChangeListener?: boolean;
}

/**
 * A SQLite database.
 */
export class Database {
  private databaseId: number = -1;

  private constructor(
    public readonly dbName: string,
    private readonly options?: OpenOptions
  ) {}
  private async openAsync(): Promise<number> {
    return await ExpoSQLite.openDatabaseAsync(this.dbName, this.options ?? {});
  }

  /**
   * Open a database.
   *
   * @param dbName The name of the database file to open.
   * @param options Open options.
   * @returns Database object.
   */
  public static async openDatabaseAsync(dbName: string, options?: OpenOptions): Promise<Database> {
    const db = new Database(dbName, options);
    db.databaseId = await db.openAsync();
    return db;
  }

  /**
   * Delete a database file.
   *
   * @param dbName The name of the database file to delete.
   */
  public static async deleteDatabaseAsync(dbName: string): Promise<void> {
    return await ExpoSQLite.deleteDatabaseAsync(dbName);
  }

  /**
   * Synchronous call to return whether the database is currently in a transaction.
   */
  public isInTransaction(): boolean {
    return ExpoSQLite.isInTransaction(this.databaseId);
  }

  /**
   * Asynchronous call to return whether the database is currently in a transaction.
   */
  public async isInTransactionAsync(): Promise<boolean> {
    return await ExpoSQLite.isInTransactionAsync(this.databaseId);
  }

  /**
   * Close the database.
   */
  public async closeAsync(): Promise<void> {
    await ExpoSQLite.closeDatabaseAsync(this.databaseId);
  }

  /**
   * Execute all SQL queries in the supplied string.
   * > Note: The queries are not escaped for you! Be careful when constructing your queries.
   *
   * @param source A string containing all the SQL queries.
   */
  public async execAsync(source: string): Promise<void> {
    await ExpoSQLite.execAsync(this.databaseId, source);
  }

  /**
   * Prepare a SQL statement.
   *
   * @param source A string containing the SQL query.
   * @returns A `Statement` object.
   */
  public async prepareAsync(source: string): Promise<Statement> {
    const statementId = await ExpoSQLite.prepareAsync(this.databaseId, source);
    return new Statement(this.databaseId, statementId);
  }

  /**
   * Execute a transaction and automatically commit/rollback based on the `txn` success.
   *
   * @param txn An async function to execute within a transaction.
   */
  public async transactionAsync(txn: () => Promise<void>): Promise<void> {
    try {
      await this.execAsync('BEGIN');
      await txn();
      await this.execAsync('COMMIT');
    } catch (e) {
      await this.execAsync('ROLLBACK');
      throw e;
    }
  }

  /**
   * Add a listener for database changes.
   * > Note: to enable this feature, you must set `enableChangeListener` to `true` when opening the database.
   *
   * @param listener A function that receives the `dbName`, `tableName` and `rowId` of the modified data.
   * @returns A `Subscription` object that you can call `remove()` on when you would like to unsubscribe the listener.
   */
  addDatabaseChangeListener(
    listener: (event: { dbName: string; tableName: string; rowId: number }) => void
  ): Subscription {
    return emitter.addListener('onDatabaseChange', listener);
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

export const openDatabaseAsync = Database.openDatabaseAsync;

export const deleteDatabaseAsync = Database.deleteDatabaseAsync;
