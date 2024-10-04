import assert from 'assert';
import sqlite3 from 'better-sqlite3';

import { OpenOptions } from '../NativeDatabase';
import {
  BindBlobParams,
  BindParams,
  BindPrimitiveParams,
  ColumnValues,
  RunResult,
} from '../NativeStatement';

export default {
  get name(): string {
    return 'ExpoSQLiteNext';
  },

  deleteDatebaseAsync: jest.fn(),

  NativeDatabase: jest
    .fn()
    .mockImplementation((dbName: string, options?: OpenOptions) => new NativeDatabase(dbName)),

  NativeStatement: jest.fn().mockImplementation(() => new NativeStatement()),
};

//#region async sqlite3

/**
 * A sqlite3.Database wrapper with async methods and conforming to the NativeDatabase interface.
 */
class NativeDatabase {
  private readonly sqlite3Db: sqlite3.Database;

  constructor(dbName: string) {
    this.sqlite3Db = new sqlite3(dbName);
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
  private iteratorParams: BindParams = [];

  //#region Asynchronous API

  public runAsync = jest
    .fn()
    .mockImplementation(
      (
        database: NativeDatabase,
        bindParams: BindPrimitiveParams,
        bindBlobParams: BindBlobParams,
        shouldPassAsArray: boolean
      ): Promise<RunResult> =>
        Promise.resolve(
          this._run(normalizeSQLite3Args(bindParams, bindBlobParams, shouldPassAsArray))
        )
    );
  public getAsync = jest
    .fn()
    .mockImplementation(
      (
        database: NativeDatabase,
        bindParams: BindPrimitiveParams,
        bindBlobParams: BindBlobParams,
        shouldPassAsArray: boolean
      ): Promise<any> => {
        assert(this.sqlite3Stmt);
        if (this.iterator == null) {
          this.iteratorParams = normalizeSQLite3Args(bindParams, bindBlobParams, shouldPassAsArray);
          this.iterator = this.sqlite3Stmt.iterate(this.iteratorParams);
        }
        const result = this.iterator.next();
        const columnValues =
          result.done === false ? Object.values(result.value as Record<string, any>) : null;
        return Promise.resolve(columnValues);
      }
    );
  public getAllAsync = jest
    .fn()
    .mockImplementation(
      (
        database: NativeDatabase,
        bindParams: BindPrimitiveParams,
        bindBlobParams: BindBlobParams,
        shouldPassAsArray: boolean
      ) =>
        Promise.resolve(
          this._allValues(normalizeSQLite3Args(bindParams, bindBlobParams, shouldPassAsArray))
        )
    );
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
        bindParams: BindPrimitiveParams,
        bindBlobParams: BindBlobParams,
        shouldPassAsArray: boolean
      ): RunResult => this._run(normalizeSQLite3Args(bindParams, bindBlobParams, shouldPassAsArray))
    );
  public getSync = jest
    .fn()
    .mockImplementation(
      (
        database: NativeDatabase,
        bindParams: BindPrimitiveParams,
        bindBlobParams: BindBlobParams,
        shouldPassAsArray: boolean
      ): any => {
        assert(this.sqlite3Stmt);
        if (this.iterator == null) {
          this.iteratorParams = normalizeSQLite3Args(bindParams, bindBlobParams, shouldPassAsArray);
          this.iterator = this.sqlite3Stmt.iterate(this.iteratorParams);
        }
        const result = this.iterator.next();
        const columnValues =
          result.done === false ? Object.values(result.value as Record<string, any>) : null;
        return columnValues;
      }
    );
  public getAllSync = jest
    .fn()
    .mockImplementation(
      (
        database: NativeDatabase,
        bindParams: BindPrimitiveParams,
        bindBlobParams: BindBlobParams,
        shouldPassAsArray: boolean
      ) => this._allValues(normalizeSQLite3Args(bindParams, bindBlobParams, shouldPassAsArray))
    );
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

  private _run = (...params: any[]): RunResult => {
    assert(this.sqlite3Stmt);
    const result = this.sqlite3Stmt.run(...params);
    return {
      lastInsertRowid: Number(result.lastInsertRowid),
      changes: result.changes,
    };
  };

  private _allValues = (...params: any[]): ColumnValues[] => {
    assert(this.sqlite3Stmt);
    const sqlite3Stmt = this.sqlite3Stmt as any;
    return sqlite3Stmt.all(...params).map((row: any) => Object.values(row));
  };

  private _reset = () => {
    assert(this.sqlite3Stmt);
    this.iterator?.return?.();
    this.iterator = this.sqlite3Stmt.iterate(this.iteratorParams);
  };

  private _finalize = () => {
    this.iterator?.return?.();
    this.iterator = null;
    this.iteratorParams = [];
  };
}

//#endregion

function normalizeSQLite3Args(
  bindParams: BindPrimitiveParams,
  bindBlobParams: BindBlobParams,
  shouldPassAsArray: boolean
): BindParams {
  if (shouldPassAsArray) {
    const result: BindParams = [];
    for (const [key, value] of Object.entries(bindParams)) {
      result[Number(key)] = value;
    }
    for (const [key, value] of Object.entries(bindBlobParams)) {
      result[Number(key)] = value;
    }
    return result;
  }

  const replaceRegexp = /^[:@$]/;
  const result: BindParams = {};
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
