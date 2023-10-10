import assert from 'assert';
import sqlite3 from 'sqlite3';
import { promisify } from 'util';

const databaseMap = new Map<number, Database>();
const statementMap = new Map<number, Statement>();
let nextDatabaseId = 1;
let nextStatementId = 1;

type RunResult = Pick<sqlite3.RunResult, 'lastID' | 'changes'>;

export default {
  get name(): string {
    return 'ExpoSQLiteNext';
  },

  openDatabaseAsync: jest
    .fn()
    .mockImplementation(async (dbName: string, options?: unknown): Promise<number> => {
      const db = await openDatabaseAsync(dbName);
      const id = nextDatabaseId++;
      databaseMap.set(id, db);
      return id;
    }),

  deleteDatebaseAsync: jest.fn(),

  isInTransaction: jest.fn().mockReturnValue(false),
  isInTransactionAsync: jest.fn().mockResolvedValue(false),

  closeDatabaseAsync: jest.fn().mockImplementation(async (databaseId: number): Promise<void> => {
    const db = databaseMap.get(databaseId);
    assert(db);
    db.closeAsync();
  }),

  execAsync: jest
    .fn()
    .mockImplementation(async (databaseId: number, source: string): Promise<void> => {
      const db = databaseMap.get(databaseId);
      assert(db);
      await db.execAsync(source);
    }),

  prepareAsync: jest
    .fn()
    .mockImplementation(async (databaseId: number, source: string): Promise<number> => {
      const db = databaseMap.get(databaseId);
      assert(db);
      const id = nextStatementId++;
      const statement = await db.prepareAsync(source);
      statementMap.set(id, statement);
      return id;
    }),

  statementArrayRunAsync: jest
    .fn()
    .mockImplementation(
      async (databaseId: number, statementId: number, bindParams: any[]): Promise<RunResult> => {
        const statement = statementMap.get(statementId);
        assert(statement);
        return statement.runAsync(bindParams);
      }
    ),

  statementObjectRunAsync: jest
    .fn()
    .mockImplementation(
      async (
        databaseId: number,
        statementId: number,
        bindParams: Record<string, any>
      ): Promise<RunResult> => {
        const statement = statementMap.get(statementId);
        assert(statement);
        return statement.runAsync(bindParams);
      }
    ),

  statementArrayGetAsync: jest
    .fn()
    .mockImplementation(
      async (databaseId: number, statementId: number, bindParams: any[]): Promise<unknown> => {
        const statement = statementMap.get(statementId);
        assert(statement);
        if (statement.isInIteration) {
          return await statement.iterGetAsync();
        } else {
          return await statement.getAsync(bindParams);
        }
      }
    ),

  statementObjectGetAsync: jest
    .fn()
    .mockImplementation(
      async (
        databaseId: number,
        statementId: number,
        bindParams: Record<string, any>
      ): Promise<unknown> => {
        const statement = statementMap.get(statementId);
        assert(statement);
        if (statement.isInIteration) {
          return await statement.iterGetAsync();
        } else {
          return await statement.getAsync(bindParams);
        }
      }
    ),

  statementArrayGetAllAsync: jest
    .fn()
    .mockImplementation(
      async (databaseId: number, statementId: number, bindParams: any[]): Promise<unknown> => {
        const statement = statementMap.get(statementId);
        assert(statement);
        return await statement.allAsync(bindParams);
      }
    ),

  statementObjectGetAllAsync: jest
    .fn()
    .mockImplementation(
      async (
        databaseId: number,
        statementId: number,
        bindParams: Record<string, any>
      ): Promise<unknown> => {
        const statement = statementMap.get(statementId);
        assert(statement);
        return await statement.allAsync(bindParams);
      }
    ),

  statementResetAsync: jest
    .fn()
    .mockImplementation(async (databaseId: number, statementId: number): Promise<void> => {
      const statement = statementMap.get(statementId);
      assert(statement);
      return statement.resetAsync();
    }),

  statementFinalizeAsync: jest
    .fn()
    .mockImplementation(async (databaseId: number, statementId: number): Promise<void> => {
      const statement = statementMap.get(statementId);
      assert(statement);
      return statement.finalizeAsync();
    }),
};

//#region async sqlite3

/**
 * A sqlite3.Database wrapper with async methods.
 */
class Database extends sqlite3.Database {
  closeAsync = promisify(this.close.bind(this));
  runAsync = promisify(this.run.bind(this));
  execAsync = promisify(this.exec.bind(this));
  getAsync = promisify(this.get.bind(this));
  allAsync = promisify(this.all.bind(this));

  prepareAsync = (sql: string): Promise<Statement> =>
    Promise.resolve(new Statement(this.prepare(sql)));
}

/**
 * A sqlite3.Statement wrapper with async methods.
 */
class Statement {
  public isInIteration = false;
  constructor(private readonly statement: sqlite3.Statement) {}

  runAsync = (...params: any[]): Promise<RunResult> => {
    return new Promise<RunResult>((resolve, reject) => {
      this.statement.run(...params, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            // @ts-expect-error
            lastID: this.statement.lastID,
            // @ts-expect-error
            changes: this.statement.changes,
          });
        }
      });
    });
  };

  getAsync = <T>(...params: any[]) =>
    new Promise<T | null>((resolve, reject) => {
      this.statement.get(...params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          this.isInIteration = true;
          resolve(row ?? null);
        }
      });
    });

  iterGetAsync = <T>() =>
    new Promise<T | null>((resolve, reject) => {
      this.statement.get((err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve((row ?? null) as T | null);
        }
      });
    });

  allAsync = <T>(...params: any[]) =>
    new Promise<T[]>((resolve, reject) => {
      this.statement.all(...params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          this.isInIteration = false;
          resolve(rows);
        }
      });
    });

  resetAsync = () =>
    new Promise<void>((resolve, reject) => {
      this.statement.reset((err) => {
        if (err) {
          reject(err);
        } else {
          this.isInIteration = false;
          resolve();
        }
      });
    });

  finalizeAsync = () =>
    new Promise<void>((resolve, reject) => {
      this.statement.finalize((err) => {
        if (err) {
          reject(err);
        } else {
          this.isInIteration = false;
          resolve();
        }
      });
    });
}

/**
 * async version of sqlite3.Database
 */
function openDatabaseAsync(filename: string): Promise<Database> {
  return new Promise<Database>((resolve, reject) => {
    const db = new Database(filename, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(db);
      }
    });
  });
}

//#endregion
