import assert from 'assert';
import sqlite3 from 'better-sqlite3';

import { SQLiteOpenOptions } from '../NativeDatabase';
import {
  SQLiteBindBlobParams,
  SQLiteBindParams,
  SQLiteBindPrimitiveParams,
  SQLiteColumnNames,
  SQLiteColumnValues,
  SQLiteRunResult,
} from '../NativeStatement';

export default {
  deleteDatebaseAsync: jest.fn(),

  defaultDatabaseDirectory: '.',
  bundledExtensions: {},

  ensureDatabasePathExistsAsync: jest.fn().mockImplementation(async (databasePath: string) => {}),
  ensureDatabasePathExistsSync: jest.fn().mockImplementation((databasePath: string) => {}),

  NativeDatabase: jest
    .fn()
    .mockImplementation(
      (databaseName: string, options?: SQLiteOpenOptions, serializedData?: Uint8Array) =>
        new NativeDatabase(databaseName, options, serializedData)
    ),

  NativeStatement: jest.fn().mockImplementation(() => new NativeStatement()),
};

//#region async sqlite3

/**
 * A sqlite3.Database wrapper with async methods and conforming to the NativeDatabase interface.
 */
class NativeDatabase {
  private readonly sqlite3Db: sqlite3.Database;

  constructor(databaseName: string, options?: SQLiteOpenOptions, serializedData?: Uint8Array) {
    if (serializedData != null) {
      this.sqlite3Db = new sqlite3(Buffer.from(serializedData));
    } else {
      this.sqlite3Db = new sqlite3(databaseName);
    }
  }

  //#region Asynchronous API

  initAsync = jest.fn().mockResolvedValue(null);
  isInTransactionAsync = jest.fn().mockImplementation(async () => {
    return this.sqlite3Db.inTransaction;
  });
  closeAsync = jest.fn().mockImplementation(async () => {
    return this.sqlite3Db.close();
  });
  execAsync = jest.fn().mockImplementation(async (source: string) => {
    return this.sqlite3Db.exec(source);
  });
  serializeAsync = jest.fn().mockImplementation(async (databaseName: string) => {
    return this.sqlite3Db.serialize({ attached: databaseName });
  });
  prepareAsync = jest
    .fn()
    .mockImplementation(async (nativeStatement: NativeStatement, source: string) => {
      nativeStatement.sqlite3Stmt = this.sqlite3Db.prepare(source);
    });

  //#endregion

  //#region Synchronous API

  initSync = jest.fn();
  isInTransactionSync = jest.fn().mockImplementation(() => this.sqlite3Db.inTransaction);
  closeSync = jest.fn().mockImplementation(() => this.sqlite3Db.close());
  execSync = jest.fn().mockImplementation((source: string) => this.sqlite3Db.exec(source));
  serializeSync = jest.fn().mockImplementation((databaseName: string) => {
    return this.sqlite3Db.serialize({ attached: databaseName });
  });
  prepareSync = jest.fn().mockImplementation((nativeStatement: NativeStatement, source: string) => {
    nativeStatement.sqlite3Stmt = this.sqlite3Db.prepare(source);
  });

  //#endregion
}

/**
 * A sqlite3.Statement wrapper with async methods and conforming to the NativeStatement interface.
 */
class NativeStatement {
  public sqlite3Stmt: sqlite3.Statement | null = null;
  private iterator: ReturnType<sqlite3.Statement['iterate']> | null = null;

  //#region Asynchronous API

  public runAsync = jest
    .fn()
    .mockImplementation(
      (
        database: NativeDatabase,
        bindParams: SQLiteBindPrimitiveParams,
        bindBlobParams: SQLiteBindBlobParams,
        shouldPassAsArray: boolean
      ): Promise<SQLiteRunResult & { firstRowValues: SQLiteColumnValues }> =>
        Promise.resolve(
          this._run(normalizeSQLite3Args(bindParams, bindBlobParams, shouldPassAsArray))
        )
    );
  public stepAsync = jest.fn().mockImplementation((database: NativeDatabase): Promise<any> => {
    assert(this.sqlite3Stmt);
    if (this.iterator == null) {
      this.iterator = this.sqlite3Stmt.iterate();
      // Since the first row is retrieved by `_run()`, we need to skip the first row here.
      this.iterator.next();
    }
    const result = this.iterator.next();
    const columnValues =
      result.done === false ? Object.values(result.value as Record<string, any>) : null;
    return Promise.resolve(columnValues);
  });
  public getAllAsync = jest
    .fn()
    .mockImplementation((database: NativeDatabase) => Promise.resolve(this._allValues()));
  public getColumnNamesAsync = jest.fn().mockImplementation(async (database: NativeDatabase) => {
    assert(this.sqlite3Stmt);
    return this.sqlite3Stmt.columns().map((column) => column.name);
  });
  public resetAsync = jest.fn().mockImplementation(async (database: NativeDatabase) => {
    this._reset();
  });
  public finalizeAsync = jest.fn().mockImplementation(async (database: NativeDatabase) => {
    this._finalize();
  });

  //#endregion

  //#region Synchronous API

  public runSync = jest
    .fn()
    .mockImplementation(
      (
        database: NativeDatabase,
        bindParams: SQLiteBindPrimitiveParams,
        bindBlobParams: SQLiteBindBlobParams,
        shouldPassAsArray: boolean
      ): SQLiteRunResult & { firstRowValues: SQLiteColumnValues } =>
        this._run(normalizeSQLite3Args(bindParams, bindBlobParams, shouldPassAsArray))
    );
  public stepSync = jest.fn().mockImplementation((database: NativeDatabase): any => {
    assert(this.sqlite3Stmt);
    if (this.iterator == null) {
      this.iterator = this.sqlite3Stmt.iterate();
      // Since the first row is retrieved by `_run()`, we need to skip the first row here.
      this.iterator.next();
    }

    const result = this.iterator.next();
    const columnValues =
      result.done === false ? Object.values(result.value as Record<string, any>) : null;
    return columnValues;
  });
  public getAllSync = jest.fn().mockImplementation((database: NativeDatabase) => this._allValues());
  public getColumnNamesSync = jest.fn().mockImplementation((database: NativeDatabase) => {
    assert(this.sqlite3Stmt);
    return this.sqlite3Stmt.columns().map((column) => column.name);
  });
  public resetSync = jest.fn().mockImplementation((database: NativeDatabase) => {
    this._reset();
  });
  public finalizeSync = jest.fn().mockImplementation((database: NativeDatabase) => {
    this._finalize();
  });

  //#endregion

  private _run = (...params: any[]): SQLiteRunResult & { firstRowValues: SQLiteColumnValues } => {
    assert(this.sqlite3Stmt);
    this.sqlite3Stmt.bind(...params);
    const result = this.sqlite3Stmt.run();

    // better-sqlite3 does not support run() returning the first row, use get() instead.
    let firstRow;
    try {
      firstRow = this.sqlite3Stmt.get();
    } catch {
      // better-sqlite3 may throw `TypeError: This statement does not return data. Use run() instead`
      firstRow = null;
    }
    return {
      lastInsertRowId: Number(result.lastInsertRowid),
      changes: result.changes,
      firstRowValues: firstRow ? Object.values(firstRow) : [],
    };
  };

  private _allValues = (): SQLiteColumnNames[] => {
    assert(this.sqlite3Stmt);
    const sqlite3Stmt = this.sqlite3Stmt as any;
    // Since the first row is retrieved by `_run()`, we need to skip the first row here.
    return sqlite3Stmt
      .all()
      .slice(1)
      .map((row: any) => Object.values(row));
  };

  private _reset = () => {
    assert(this.sqlite3Stmt);
    this.iterator?.return?.();
    this.iterator = this.sqlite3Stmt.iterate();
  };

  private _finalize = () => {
    this.iterator?.return?.();
    this.iterator = null;
  };
}

//#endregion

function normalizeSQLite3Args(
  bindParams: SQLiteBindPrimitiveParams,
  bindBlobParams: SQLiteBindBlobParams,
  shouldPassAsArray: boolean
): SQLiteBindParams {
  if (shouldPassAsArray) {
    const result: SQLiteBindParams = [];
    for (const [key, value] of Object.entries(bindParams)) {
      result[Number(key)] = value;
    }
    for (const [key, value] of Object.entries(bindBlobParams)) {
      result[Number(key)] = value;
    }
    return result;
  }

  const replaceRegexp = /^[:@$]/;
  const result: SQLiteBindParams = {};
  for (const [key, value] of Object.entries(bindParams)) {
    const normalizedKey = key.replace(replaceRegexp, '');
    result[normalizedKey] = value;
  }
  for (const [key, value] of Object.entries(bindBlobParams)) {
    const normalizedKey = key.replace(replaceRegexp, '');
    result[normalizedKey] = value;
  }
  return result;
}
