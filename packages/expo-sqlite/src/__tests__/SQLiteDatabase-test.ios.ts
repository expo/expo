// @ts-ignore-next-line: no @types/node
import fs from 'fs/promises';

import {
  deserializeDatabaseAsync,
  openDatabaseAsync,
  openDatabaseSync,
  SQLiteDatabase,
} from '../SQLiteDatabase';

jest.mock('../ExpoSQLite', () => require('../__mocks__/ExpoSQLite'));

interface TestEntity {
  value: string;
  intValue: number;
}

describe('Database', () => {
  let db: SQLiteDatabase | null = null;

  afterEach(async () => {
    await db?.closeAsync();
    await fs.unlink('test.db').catch(() => {});
  });

  it('openDatabaseAsync should return a database that could be closed', async () => {
    db = await openDatabaseAsync(':memory:');
    expect(db).toBeDefined();
    await db.closeAsync();
    db = null;
  });

  it('execAsync should execute a create table command', async () => {
    db = await openDatabaseAsync(':memory:');
    await db.execAsync(
      'CREATE TABLE test (id INTEGER PRIMARY KEY NOT NULL, value TEXT NOT NULL, intValue INTEGER)'
    );
  });

  it('execAsync should throw error from an invalid command', async () => {
    db = await openDatabaseAsync(':memory:');
    await expect(db.execAsync('INVALID COMMAMD')).rejects.toThrowError();
  });

  it('runAsync should return SQLiteRunResult', async () => {
    db = await openDatabaseAsync(':memory:');
    await db.execAsync(
      'CREATE TABLE test (id INTEGER PRIMARY KEY NOT NULL, value TEXT NOT NULL, intValue INTEGER)'
    );
    const result = await db.runAsync(
      'INSERT INTO test (value, intValue) VALUES (?, ?)',
      'test',
      123
    );
    expect(result.lastInsertRowId).toBe(1);
    expect(result.changes).toBe(1);
  });

  it('getFirstAsync should return a row', async () => {
    db = await openDatabaseAsync(':memory:');
    await db.execAsync(
      'CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY NOT NULL, value TEXT NOT NULL, intValue INTEGER)'
    );
    await db.runAsync('INSERT INTO test (value, intValue) VALUES (?, ?)', 'test', 123);
    const result = await db.getFirstAsync<TestEntity>('SELECT * FROM test');
    expect(result?.value).toBe('test');
    expect(result?.intValue).toBe(123);
  });

  it('getEachAsync should return async iterable', async () => {
    db = await openDatabaseAsync(':memory:');
    await db.execAsync(`
  CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY NOT NULL, value TEXT NOT NULL, intValue INTEGER);
  INSERT INTO test (value, intValue) VALUES ('test1', 123);
  INSERT INTO test (value, intValue) VALUES ('test2', 456);
  INSERT INTO test (value, intValue) VALUES ('test3', 789);
  `);
    const results: TestEntity[] = [];
    for await (const row of db.getEachAsync<TestEntity>(
      'SELECT * FROM test ORDER BY intValue DESC'
    )) {
      results.push(row);
    }
    expect(results[0].intValue).toBe(789);
    expect(results[1].intValue).toBe(456);
    expect(results[2].intValue).toBe(123);
  });

  it('getEachAsync should finalize from early iterator return', async () => {
    db = await openDatabaseAsync(':memory:');
    const mockPrepareAsync = jest.spyOn(db, 'prepareAsync');
    await db.execAsync(`
  CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY NOT NULL, value TEXT NOT NULL, intValue INTEGER);
  INSERT INTO test (value, intValue) VALUES ('test1', 123);
  INSERT INTO test (value, intValue) VALUES ('test2', 456);
  INSERT INTO test (value, intValue) VALUES ('test3', 789);
  `);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const row of db.getEachAsync<TestEntity>(
      'SELECT * FROM test ORDER BY intValue DESC'
    )) {
      break;
    }
    const mockStatement = await mockPrepareAsync.mock.results[0].value;
    expect(mockStatement.nativeStatement.finalizeAsync).toHaveBeenCalled();
  });

  it('getEachSync should finalize from early iterator return', async () => {
    db = await openDatabaseAsync(':memory:');
    const mockPrepareSync = jest.spyOn(db, 'prepareSync');
    await db.execAsync(`
  CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY NOT NULL, value TEXT NOT NULL, intValue INTEGER);
  INSERT INTO test (value, intValue) VALUES ('test1', 123);
  INSERT INTO test (value, intValue) VALUES ('test2', 456);
  INSERT INTO test (value, intValue) VALUES ('test3', 789);
  `);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const row of db.getEachSync<TestEntity>('SELECT * FROM test ORDER BY intValue DESC')) {
      break;
    }
    const mockStatement = await mockPrepareSync.mock.results[0].value;
    expect(mockStatement.nativeStatement.finalizeSync).toHaveBeenCalled();
  });

  it('getAllAsync should return all items', async () => {
    db = await openDatabaseAsync(':memory:');
    await db.execAsync(`
  CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY NOT NULL, value TEXT NOT NULL, intValue INTEGER);
  INSERT INTO test (value, intValue) VALUES ('test1', 123);
  INSERT INTO test (value, intValue) VALUES ('test2', 456);
  INSERT INTO test (value, intValue) VALUES ('test3', 789);
  `);
    const results = await db.getAllAsync<TestEntity>('SELECT * FROM test ORDER BY intValue DESC');
    expect(results[0].intValue).toBe(789);
    expect(results[1].intValue).toBe(456);
    expect(results[2].intValue).toBe(123);
  });

  it('withTransactionAsync should commit changes', async () => {
    db = await openDatabaseAsync(':memory:');
    await db.execAsync(
      'CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY NOT NULL, value TEXT NOT NULL, intValue INTEGER)'
    );

    await db.withTransactionAsync(async () => {
      await db?.runAsync('INSERT INTO test (value, intValue) VALUES (?, ?)', 'test', 123);
    });
    const results = await db.getAllAsync<TestEntity>('SELECT * FROM test');
    expect(results.length).toBe(1);
  });

  it('withTransactionAsync should rollback changes when exceptions happen', async () => {
    db = await openDatabaseAsync(':memory:');
    await db.execAsync(
      'CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY NOT NULL, value TEXT NOT NULL, intValue INTEGER)'
    );

    await expect(
      db?.withTransactionAsync(async () => {
        await db?.runAsync('INSERT INTO test (value, intValue) VALUES (?, ?)', 'test', 123);
        throw new Error('Exception inside transaction');
      })
    ).rejects.toThrow();

    const results = await db.getAllAsync<TestEntity>('SELECT * FROM test');
    expect(results.length).toBe(0);
  });

  it('withTransactionAsync could possibly have other async queries interrupted inside the transaction', async () => {
    db = await openDatabaseAsync('test.db');
    await db.execAsync(`
DROP TABLE IF EXISTS users;
CREATE TABLE IF NOT EXISTS users (user_id INTEGER PRIMARY KEY NOT NULL, name VARCHAR(64));
INSERT INTO users (name) VALUES ('aaa');
  `);

    const promise1 = db.withTransactionAsync(async () => {
      for (let i = 0; i < 10; ++i) {
        const result = await db?.getFirstAsync<{ name: string }>('SELECT name FROM users');
        if (result?.name !== 'aaa') {
          throw new Error(`Exception from promise1: Expected aaa but received ${result?.name}}`);
        }
        await db?.runAsync('UPDATE users SET name = ?', 'aaa');
        await delayAsync(200);
      }
    });

    const promise2 = new Promise(async (resolve, reject) => {
      try {
        await delayAsync(100);
        await db?.runAsync('UPDATE users SET name = ?', 'bbb');
        const result = await db?.getFirstAsync<{ name: string }>('SELECT name FROM users');
        if (result?.name !== 'bbb') {
          throw new Error(`Exception from promise2: Expected bbb but received ${result?.name}}`);
        }
        resolve(null);
      } catch (e) {
        reject(new Error(`Exception from promise2: ${e.toString()}`));
      }
    });

    await expect(Promise.all([promise1, promise2])).rejects.toThrow(
      /Exception from promise1: Expected aaa but received bbb/
    );
  });

  it('withExclusiveTransactionAsync should execute a transaction atomically and abort other write query', async () => {
    db = await openDatabaseAsync('test.db');
    await db.execAsync(`
DROP TABLE IF EXISTS users;
CREATE TABLE IF NOT EXISTS users (user_id INTEGER PRIMARY KEY NOT NULL, name VARCHAR(64));
INSERT INTO users (name) VALUES ('aaa');
  `);

    const promise1 = db.withExclusiveTransactionAsync(async (txn) => {
      for (let i = 0; i < 10; ++i) {
        const result = await txn.getFirstAsync<{ name: string }>('SELECT name FROM users');
        if (result?.name !== 'aaa') {
          throw new Error(`Exception from promise1: Expected aaa but received ${result?.name}}`);
        }
        await txn.runAsync('UPDATE users SET name = ?', 'aaa');
        await delayAsync(200);
      }
    });

    const promise2 = new Promise(async (resolve, reject) => {
      try {
        await delayAsync(100);
        await db?.runAsync('UPDATE users SET name = ?', 'bbb');
        const result = await db?.getFirstAsync<{ name: string }>('SELECT name FROM users');
        if (result?.name !== 'bbb') {
          throw new Error(`Exception from promise2: Expected bbb but received ${result?.name}}`);
        }
        resolve(null);
      } catch (e) {
        reject(new Error(`Exception from promise2: ${e.toString()}`));
      }
    });

    await expect(Promise.all([promise1, promise2])).rejects.toThrow(
      /Exception from promise2:[\s\S]*database is locked/
    );

    // We still need to wait for promise1 to finish for promise1 to finalize the transaction.
    await promise1;
  }, 10000);
});

describe('Database - Synchronous calls', () => {
  let db: SQLiteDatabase | null = null;

  afterEach(async () => {
    db?.closeSync();
    await fs.unlink('test.db').catch(() => {});
  });

  it('openDatabaseSync should return a database that could be closed', () => {
    db = openDatabaseSync(':memory:');
    expect(db).toBeDefined();
    db.closeSync();
    db = null;
  });

  it('getFirstSync should return a row', () => {
    db = openDatabaseSync(':memory:');
    db.execSync(
      'CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY NOT NULL, value TEXT NOT NULL, intValue INTEGER)'
    );
    db.runSync('INSERT INTO test (value, intValue) VALUES (?, ?)', 'test', 123);
    const result = db.getFirstSync<TestEntity>('SELECT * FROM test');
    expect(result?.value).toBe('test');
    expect(result?.intValue).toBe(123);
  });

  it('getEachSync should return iterable', () => {
    db = openDatabaseSync(':memory:');
    db.execSync(`
  CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY NOT NULL, value TEXT NOT NULL, intValue INTEGER);
  INSERT INTO test (value, intValue) VALUES ('test1', 123);
  INSERT INTO test (value, intValue) VALUES ('test2', 456);
  INSERT INTO test (value, intValue) VALUES ('test3', 789);
  `);
    const results: TestEntity[] = [];
    for (const row of db.getEachSync<TestEntity>('SELECT * FROM test ORDER BY intValue DESC')) {
      results.push(row);
    }
    expect(results[0].intValue).toBe(789);
    expect(results[1].intValue).toBe(456);
    expect(results[2].intValue).toBe(123);
  });

  it('withTransactionSync should commit changes', () => {
    db = openDatabaseSync(':memory:');
    db.execSync(
      'CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY NOT NULL, value TEXT NOT NULL, intValue INTEGER)'
    );

    db.withTransactionSync(() => {
      db?.runSync('INSERT INTO test (value, intValue) VALUES (?, ?)', 'test', 123);
    });
    const results = db.getAllSync<TestEntity>('SELECT * FROM test');
    expect(results.length).toBe(1);
  });

  it('withTransactionSync should rollback changes when exceptions happen', () => {
    db = openDatabaseSync(':memory:');
    db.execAsync(
      'CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY NOT NULL, value TEXT NOT NULL, intValue INTEGER)'
    );

    expect(() => {
      db?.withTransactionSync(() => {
        db?.runSync('INSERT INTO test (value, intValue) VALUES (?, ?)', 'test', 123);
        throw new Error('Exception inside transaction');
      });
    }).toThrow();

    const results = db.getAllSync<TestEntity>('SELECT * FROM test');
    expect(results.length).toBe(0);
  });
});

describe('Database - serialize / deserialize', () => {
  it('serialize / deserialize in between should keep the data', async () => {
    const db = await openDatabaseAsync(':memory:');
    await db.execAsync(
      'CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY NOT NULL, value TEXT NOT NULL, intValue INTEGER)'
    );
    await db.runAsync('INSERT INTO test (value, intValue) VALUES (?, ?)', 'test', 123);

    const serialized = await db.serializeAsync();
    await db.closeAsync();

    const db2 = await deserializeDatabaseAsync(serialized);
    const result = await db2.getFirstAsync<TestEntity>('SELECT * FROM test');
    expect(result?.value).toBe('test');
    expect(result?.intValue).toBe(123);
    await db2.closeAsync();
  });
});

async function delayAsync(timeMs: number) {
  return new Promise((resolve) => setTimeout(resolve, timeMs));
}
