import './polyfillNextTick';

import customOpenDatabase from '@expo/websql/custom';
import { requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

import type {
  Query,
  ResultSet,
  ResultSetError,
  SQLiteCallback,
  SQLTransactionAsyncCallback,
  SQLTransactionAsync,
  SQLTransactionCallback,
  SQLTransactionErrorCallback,
} from './SQLite.types';

const ExpoSQLite = requireNativeModule('ExpoSQLite');

function zipObject(keys: string[], values: any[]) {
  const result = {};
  for (let i = 0; i < keys.length; i++) {
    result[keys[i]] = values[i];
  }
  return result;
}

/** The database returned by `openDatabase()` */
export class SQLiteDatabase {
  _name: string;
  _closed: boolean = false;

  constructor(name: string) {
    this._name = name;
  }

  /**
   * Executes the SQL statement and returns a callback resolving with the result.
   */
  exec(queries: Query[], readOnly: boolean, callback: SQLiteCallback): void {
    if (this._closed) {
      throw new Error(`The SQLite database is closed`);
    }

    ExpoSQLite.exec(this._name, queries.map(_serializeQuery), readOnly).then(
      (nativeResultSets) => {
        callback(null, nativeResultSets.map(_deserializeResultSet));
      },
      (error) => {
        // TODO: make the native API consistently reject with an error, not a string or other type
        callback(error instanceof Error ? error : new Error(error));
      }
    );
  }

  /**
   * Executes the SQL statement and returns a Promise resolving with the result.
   */
  async execAsync(queries: Query[], readOnly: boolean): Promise<(ResultSetError | ResultSet)[]> {
    if (this._closed) {
      throw new Error(`The SQLite database is closed`);
    }

    const nativeResultSets = await ExpoSQLite.exec(
      this._name,
      queries.map(_serializeQuery),
      readOnly
    );
    return nativeResultSets.map(_deserializeResultSet);
  }

  /**
   * @deprecated Use `closeAsync()` instead.
   */
  close = this.closeAsync;

  /**
   * Close the database.
   */
  closeAsync(): void {
    this._closed = true;
    return ExpoSQLite.close(this._name);
  }

  /**
   * Delete the database file.
   * > The database has to be closed prior to deletion.
   */
  deleteAsync(): Promise<void> {
    if (!this._closed) {
      throw new Error(
        `Unable to delete '${this._name}' database that is currently open. Close it prior to deletion.`
      );
    }

    return ExpoSQLite.deleteAsync(this._name);
  }

  /**
   * Creates a new transaction with Promise support.
   * @param asyncCallback A `SQLTransactionAsyncCallback` function that can perform SQL statements in a transaction.
   * @param readOnly true if all the SQL statements in the callback are read only.
   */
  async transactionAsync(
    asyncCallback: SQLTransactionAsyncCallback,
    readOnly: boolean = false
  ): Promise<void> {
    await this.execAsync([{ sql: 'BEGIN;', args: [] }], false);
    try {
      const transaction = new ExpoSQLTransactionAsync(this, readOnly);
      await asyncCallback(transaction);
      await this.execAsync([{ sql: 'END;', args: [] }], false);
    } catch (e: unknown) {
      await this.execAsync([{ sql: 'ROLLBACK;', args: [] }], false);
      throw e;
    }
  }

  // @ts-expect-error: properties that are added from websql
  version: string;

  /**
   * Execute a database transaction.
   * @param callback A function representing the transaction to perform. Takes a Transaction
   * (see below) as its only parameter, on which it can add SQL statements to execute.
   * @param errorCallback Called if an error occurred processing this transaction. Takes a single
   * parameter describing the error.
   * @param successCallback Called when the transaction has completed executing on the database.
   */
  // @ts-expect-error: properties that are added from websql
  transaction(
    callback: SQLTransactionCallback,
    errorCallback?: SQLTransactionErrorCallback,
    successCallback?: () => void
  ): void;

  // @ts-expect-error: properties that are added from websql
  readTransaction(
    callback: SQLTransactionCallback,
    errorCallback?: SQLTransactionErrorCallback,
    successCallback?: () => void
  ): void;
}

function _serializeQuery(query: Query): Query | [string, any[]] {
  return Platform.OS === 'android'
    ? {
        sql: query.sql,
        args: query.args.map(_escapeBlob),
      }
    : [query.sql, query.args];
}

function _deserializeResultSet(nativeResult): ResultSet | ResultSetError {
  const [errorMessage, insertId, rowsAffected, columns, rows] = nativeResult;
  // TODO: send more structured error information from the native module so we can better construct
  // a SQLException object
  if (errorMessage !== null) {
    return { error: new Error(errorMessage) } as ResultSetError;
  }

  return {
    insertId,
    rowsAffected,
    rows: rows.map((row) => zipObject(columns, row)),
  };
}

function _escapeBlob<T>(data: T): T {
  if (typeof data === 'string') {
    /* eslint-disable no-control-regex */
    return data
      .replace(/\u0002/g, '\u0002\u0002')
      .replace(/\u0001/g, '\u0001\u0002')
      .replace(/\u0000/g, '\u0001\u0001') as any;
    /* eslint-enable no-control-regex */
  } else {
    return data;
  }
}

const _openExpoSQLiteDatabase = customOpenDatabase(SQLiteDatabase);

// @needsAudit @docsMissing
/**
 * Open a database, creating it if it doesn't exist, and return a `Database` object. On disk,
 * the database will be created under the app's [documents directory](./filesystem), i.e.
 * `${FileSystem.documentDirectory}/SQLite/${name}`.
 * > The `version`, `description` and `size` arguments are ignored, but are accepted by the function
 * for compatibility with the WebSQL specification.
 * @param name Name of the database file to open.
 * @param version
 * @param description
 * @param size
 * @param callback
 * @return
 */
export function openDatabase(
  name: string,
  version: string = '1.0',
  description: string = name,
  size: number = 1,
  callback?: (db: SQLiteDatabase) => void
): SQLiteDatabase {
  if (name === undefined) {
    throw new TypeError(`The database name must not be undefined`);
  }
  const db = _openExpoSQLiteDatabase(name, version, description, size, callback);
  db.exec = db._db.exec.bind(db._db);
  db.execAsync = db._db.execAsync.bind(db._db);
  db.closeAsync = db._db.closeAsync.bind(db._db);
  db.deleteAsync = db._db.deleteAsync.bind(db._db);
  db.transactionAsync = db._db.transactionAsync.bind(db._db);
  return db;
}

/**
 * Internal data structure for the async transaction API.
 * @internal
 */
export class ExpoSQLTransactionAsync implements SQLTransactionAsync {
  constructor(private readonly db: SQLiteDatabase, private readonly readOnly: boolean) {}

  async executeSqlAsync(
    sqlStatement: string,
    args?: (number | string)[]
  ): Promise<ResultSetError | ResultSet> {
    const resultSets = await this.db.execAsync(
      [{ sql: sqlStatement, args: args ?? [] }],
      this.readOnly
    );
    return resultSets[0];
  }
}
