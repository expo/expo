import assert from 'assert';
import fs from 'fs';
import { DatabaseSync, type SQLInputValue, type StatementSync } from 'node:sqlite';
import os from 'os';
import path from 'path';

import type { SQLiteOpenOptions } from '../NativeDatabase';
import type {
  SQLiteBindBlobParams,
  SQLiteBindParams,
  SQLiteBindPrimitiveParams,
  SQLiteColumnNames,
  SQLiteColumnValues,
  SQLiteRunResult,
} from '../NativeStatement';

// Per-worker temp directory: node:sqlite refuses concurrent opens of the same path across processes.
const defaultDatabaseDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-sqlite-test-'));

export default {
  deleteDatebaseAsync: jest.fn(),

  defaultDatabaseDirectory,
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

//#region node:sqlite

/** node:sqlite (bundled with Node 22+) backs the mock, avoiding a node-gyp-compiled dependency. */
class NativeDatabase {
  private readonly nodeDb: DatabaseSync;

  constructor(databaseName: string, options?: SQLiteOpenOptions, serializedData?: Uint8Array) {
    if (serializedData != null) {
      // node:sqlite gained buffer construction after Node 22; unreachable while serialize is skipped.
      this.nodeDb = new DatabaseSync(Buffer.from(serializedData) as unknown as string);
    } else {
      this.nodeDb = new DatabaseSync(databaseName);
    }
  }

  //#region Asynchronous API

  initAsync = jest.fn().mockResolvedValue(null);
  isInTransactionAsync = jest.fn().mockImplementation(async () => this.nodeDb.isTransaction);
  closeAsync = jest.fn().mockImplementation(async () => this._close());
  execAsync = jest.fn().mockImplementation(async (source: string) => this.nodeDb.exec(source));
  serializeAsync = jest.fn().mockImplementation(async (databaseName: string) => this._serialize());
  prepareAsync = jest
    .fn()
    .mockImplementation(async (nativeStatement: NativeStatement, source: string) => {
      nativeStatement.prepare(this.nodeDb, source);
    });

  //#endregion

  //#region Synchronous API

  initSync = jest.fn();
  isInTransactionSync = jest.fn().mockImplementation(() => this.nodeDb.isTransaction);
  closeSync = jest.fn().mockImplementation(() => this._close());
  execSync = jest.fn().mockImplementation((source: string) => this.nodeDb.exec(source));
  serializeSync = jest.fn().mockImplementation((databaseName: string) => this._serialize());
  prepareSync = jest.fn().mockImplementation((nativeStatement: NativeStatement, source: string) => {
    nativeStatement.prepare(this.nodeDb, source);
  });

  //#endregion

  // node:sqlite throws when closing an already-closed database; callers may close more than once.
  private _close() {
    if (this.nodeDb.isOpen) {
      this.nodeDb.close();
    }
  }

  private _serialize(): Uint8Array {
    const serialize = (this.nodeDb as unknown as { serialize?: () => Uint8Array }).serialize;
    if (typeof serialize !== 'function') {
      throw new Error(
        'node:sqlite does not implement serialize() on this Node version, so the mock cannot serialize the database.'
      );
    }
    return serialize.call(this.nodeDb);
  }
}

/**
 * node:sqlite re-executes a statement's side effects on each run/get/all call, so row-returning
 * statements are driven through one iterator created in `_run()` to execute exactly once.
 */
class NativeStatement {
  private nodeStmt: StatementSync | null = null;
  private iterator: Iterator<unknown> | null = null;
  private boundParams: SQLiteBindParams = [];

  prepare(nodeDb: DatabaseSync, source: string) {
    const stmt = nodeDb.prepare(source);
    // The native module strips the `:@$` prefixes from named parameters.
    stmt.setAllowBareNamedParameters(true);
    // The JS layer expects rows as value arrays.
    stmt.setReturnArrays(true);
    this.nodeStmt = stmt;
  }

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
  public stepAsync = jest
    .fn()
    .mockImplementation(
      (database: NativeDatabase): Promise<SQLiteColumnValues | null> =>
        Promise.resolve(this._step())
    );
  public getAllAsync = jest
    .fn()
    .mockImplementation((database: NativeDatabase) => Promise.resolve(this._allValues()));
  public getColumnNamesAsync = jest
    .fn()
    .mockImplementation(async (database: NativeDatabase) => this._columnNames());
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
  public stepSync = jest
    .fn()
    .mockImplementation((database: NativeDatabase): SQLiteColumnValues | null => this._step());
  public getAllSync = jest.fn().mockImplementation((database: NativeDatabase) => this._allValues());
  public getColumnNamesSync = jest
    .fn()
    .mockImplementation((database: NativeDatabase) => this._columnNames());
  public resetSync = jest.fn().mockImplementation((database: NativeDatabase) => {
    this._reset();
  });
  public finalizeSync = jest.fn().mockImplementation((database: NativeDatabase) => {
    this._finalize();
  });

  //#endregion

  private _run = (
    params: SQLiteBindParams
  ): SQLiteRunResult & { firstRowValues: SQLiteColumnValues } => {
    assert(this.nodeStmt);
    this.boundParams = params;
    this.iterator = null;

    if (this.nodeStmt.columns().length === 0) {
      const result = this.nodeStmt.run(...asBindArgs(params));
      return {
        lastInsertRowId: Number(result.lastInsertRowid),
        changes: Number(result.changes),
        firstRowValues: [],
      };
    }

    // node:sqlite exposes no changes/lastInsertRowId for row-returning statements.
    this.iterator = this.nodeStmt.iterate(...asBindArgs(params));
    const first = this.iterator.next();
    return {
      lastInsertRowId: 0,
      changes: 0,
      firstRowValues: first.done ? [] : (first.value as SQLiteColumnValues),
    };
  };

  private _step = (): SQLiteColumnValues | null => {
    if (this.iterator == null) {
      return null;
    }
    const result = this.iterator.next();
    return result.done ? null : (result.value as SQLiteColumnValues);
  };

  private _allValues = (): SQLiteColumnValues[] => {
    if (this.iterator == null) {
      return [];
    }
    // _run() already consumed the first row.
    const rows: SQLiteColumnValues[] = [];
    let result = this.iterator.next();
    while (!result.done) {
      rows.push(result.value as SQLiteColumnValues);
      result = this.iterator.next();
    }
    return rows;
  };

  private _columnNames = (): SQLiteColumnNames => {
    assert(this.nodeStmt);
    return this.nodeStmt.columns().map((column) => column.name);
  };

  private _reset = () => {
    assert(this.nodeStmt);
    this.iterator?.return?.();
    this.iterator = this.nodeStmt.iterate(...asBindArgs(this.boundParams));
  };

  private _finalize = () => {
    this.iterator?.return?.();
    this.iterator = null;
  };
}

//#endregion

function asBindArgs(params: SQLiteBindParams): SQLInputValue[] {
  // Booleans are already normalized to 1/0 upstream, so values fit node:sqlite's input types.
  return (Array.isArray(params) ? params : [params]) as unknown as SQLInputValue[];
}

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
      if (value instanceof ArrayBuffer) {
        result[Number(key)] = new Uint8Array(value) as any;
        continue;
      }
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
    if (value instanceof ArrayBuffer) {
      result[normalizedKey] = new Uint8Array(value) as any;
      continue;
    }
    result[normalizedKey] = value;
  }
  return result;
}
