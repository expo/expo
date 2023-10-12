import assert from 'assert';
import sqlite3 from 'sqlite3';
import { promisify } from 'util';

import { OpenOptions } from '../NativeDatabase';
import { BindParams } from '../NativeStatement';

type RunResult = Pick<sqlite3.RunResult, 'lastID' | 'changes'>;

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
class NativeDatabase extends sqlite3.Database {
  initAsync = jest.fn().mockResolvedValue(null);
  isInTransaction = jest.fn().mockReturnValue(false);
  isInTransactionAsync = jest.fn().mockResolvedValue(false);

  closeAsync = jest
    .fn()
    .mockImplementation(promisify(this.close.bind(this)) as () => Promise<void>);

  execAsync = jest
    .fn()
    .mockImplementation(promisify(this.exec.bind(this)) as (sql: string) => Promise<void>);

  prepareAsync = jest
    .fn()
    .mockImplementation(async (nativeStatement: NativeStatement, source: string) => {
      nativeStatement.sqlite3Stmt = this.prepare(source);
    });
}

/**
 * A sqlite3.Statement wrapper with async methods and conforming to the NativeStatement interface.
 */
class NativeStatement {
  public sqlite3Stmt: sqlite3.Statement | null = null;
  public isInIteration = false;

  public arrayRunAsync = jest
    .fn()
    .mockImplementation((database: NativeDatabase, params: BindParams): Promise<RunResult> => {
      return this._runAsync(params);
    });
  public objectRunAsync = jest
    .fn()
    .mockImplementation((database: NativeDatabase, params: BindParams): Promise<RunResult> => {
      return this._runAsync(params);
    });

  public arrayGetAsync = jest
    .fn()
    .mockImplementation((database: NativeDatabase, params: BindParams): Promise<any> => {
      if (this.isInIteration) {
        return this._iterGetAsync();
      } else {
        return this._getAsync(params);
      }
    });
  public objectGetAsync = jest
    .fn()
    .mockImplementation((database: NativeDatabase, params: BindParams): Promise<any> => {
      if (this.isInIteration) {
        return this._iterGetAsync();
      } else {
        return this._getAsync(params);
      }
    });

  public arrayGetAllAsync = jest
    .fn()
    .mockImplementation((database: NativeDatabase, params: BindParams): Promise<any> => {
      return this._allAsync(params);
    });
  public objectGetAllAsync = jest
    .fn()
    .mockImplementation((database: NativeDatabase, params: BindParams): Promise<any> => {
      return this._allAsync(params);
    });

  public resetAsync = jest.fn().mockImplementation((database: NativeDatabase): Promise<void> => {
    return this._resetAsync();
  });
  public finalizeAsync = jest.fn().mockImplementation((database: NativeDatabase): Promise<void> => {
    return this._finalizeAsync();
  });

  private _runAsync = (...params: any[]): Promise<RunResult> => {
    return new Promise<RunResult>((resolve, reject) => {
      assert(this.sqlite3Stmt);
      this.sqlite3Stmt.run(...params, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            // @ts-expect-error
            lastID: this.sqlite3Stmt.lastID,
            // @ts-expect-error
            changes: this.sqlite3Stmt.changes,
          });
        }
      });
    });
  };

  private _getAsync = <T>(...params: any[]) =>
    new Promise<T | null>((resolve, reject) => {
      assert(this.sqlite3Stmt);
      this.sqlite3Stmt.get(...params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          this.isInIteration = true;
          resolve(row ?? null);
        }
      });
    });

  private _iterGetAsync = <T>() =>
    new Promise<T | null>((resolve, reject) => {
      assert(this.sqlite3Stmt);
      this.sqlite3Stmt.get((err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve((row ?? null) as T | null);
        }
      });
    });

  private _allAsync = <T>(...params: any[]) =>
    new Promise<T[]>((resolve, reject) => {
      assert(this.sqlite3Stmt);
      this.sqlite3Stmt.all(...params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          this.isInIteration = false;
          resolve(rows);
        }
      });
    });

  private _resetAsync = () =>
    new Promise<void>((resolve, reject) => {
      assert(this.sqlite3Stmt);
      this.sqlite3Stmt.reset((err) => {
        if (err) {
          reject(err);
        } else {
          this.isInIteration = false;
          resolve();
        }
      });
    });

  private _finalizeAsync = () =>
    new Promise<void>((resolve, reject) => {
      assert(this.sqlite3Stmt);
      this.sqlite3Stmt.finalize((err) => {
        if (err) {
          reject(err);
        } else {
          this.isInIteration = false;
          resolve();
        }
      });
    });
}

//#endregion
