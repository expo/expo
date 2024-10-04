// @ts-ignore-next-line: no @types/node
import fs from 'fs/promises';

import { openDatabaseAsync, openDatabaseSync, Database } from '../Database';

jest.mock('../ExpoSQLiteNext');

interface TestEntity {
  value: string;
  intValue: number;
}

describe('Database', () => {
  let db: Database | null = null;

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

  it('runAsync should return RunResult', async () => {
    db = await openDatabaseAsync(':memory:');
    await db.execAsync(
      'CREATE TABLE test (id INTEGER PRIMARY KEY NOT NULL, value TEXT NOT NULL, intValue INTEGER)'
    );
    const result = await db.runAsync(
      'INSERT INTO test (value, intValue) VALUES (?, ?)',
      'test',
      123
    );
    expect(result.lastInsertRowid).toBe(1);
    expect(result.changes).toBe(1);
  });

  it('getAsync should return a row', async () => {
    db = await openDatabaseAsync(':memory:');
    await db.execAsync(
      'CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY NOT NULL, value TEXT NOT NULL, intValue INTEGER)'
    );
    await db.runAsync('INSERT INTO test (value, intValue) VALUES (?, ?)', 'test', 123);
    const result = await db.getAsync<TestEntity>('SELECT * FROM test');
    expect(result?.value).toBe('test');
    expect(result?.intValue).toBe(123);
  });

  it('eachAsync should return async iterable', async () => {
    db = await openDatabaseAsync(':memory:');
    await db.execAsync(`
  CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY NOT NULL, value TEXT NOT NULL, intValue INTEGER);
  INSERT INTO test (value, intValue) VALUES ('test1', 123);
  INSERT INTO test (value, intValue) VALUES ('test2', 456);
  INSERT INTO test (value, intValue) VALUES ('test3', 789);
  `);
    const results: TestEntity[] = [];
    for await (const row of db.eachAsync<TestEntity>('SELECT * FROM test ORDER BY intValue DESC')) {
      results.push(row);
    }
    expect(results[0].intValue).toBe(789);
    expect(results[1].intValue).toBe(456);
    expect(results[2].intValue).toBe(123);
  });

  it('allAsync should return all items', async () => {
    db = await openDatabaseAsync(':memory:');
    await db.execAsync(`
  CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY NOT NULL, value TEXT NOT NULL, intValue INTEGER);
  INSERT INTO test (value, intValue) VALUES ('test1', 123);
  INSERT INTO test (value, intValue) VALUES ('test2', 456);
  INSERT INTO test (value, intValue) VALUES ('test3', 789);
  `);
    const results = await db.allAsync<TestEntity>('SELECT * FROM test ORDER BY intValue DESC');
    expect(results[0].intValue).toBe(789);
    expect(results[1].intValue).toBe(456);
    expect(results[2].intValue).toBe(123);
  });

  it('transactionAsync should commit changes', async () => {
    db = await openDatabaseAsync(':memory:');
    await db.execAsync(
      'CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY NOT NULL, value TEXT NOT NULL, intValue INTEGER)'
    );

    await db.transactionAsync(async () => {
      await db?.runAsync('INSERT INTO test (value, intValue) VALUES (?, ?)', 'test', 123);
    });
    const results = await db.allAsync<TestEntity>('SELECT * FROM test');
    expect(results.length).toBe(1);
  });

  it('transactionAsync should rollback changes when exceptions happen', async () => {
    db = await openDatabaseAsync(':memory:');
    await db.execAsync(
      'CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY NOT NULL, value TEXT NOT NULL, intValue INTEGER)'
    );

    await expect(
      db?.transactionAsync(async () => {
        await db?.runAsync('INSERT INTO test (value, intValue) VALUES (?, ?)', 'test', 123);
        throw new Error('Exception inside transaction');
      })
    ).rejects.toThrow();

    const results = await db.allAsync<TestEntity>('SELECT * FROM test');
    expect(results.length).toBe(0);
  });

  it('transactionAsync could possibly have other async queries interrupted inside the transaction', async () => {
    db = await openDatabaseAsync('test.db');
    await db.execAsync(`
DROP TABLE IF EXISTS Users;
CREATE TABLE IF NOT EXISTS Users (user_id INTEGER PRIMARY KEY NOT NULL, name VARCHAR(64));
INSERT INTO Users (name) VALUES ('aaa');
  `);

    const promise1 = db.transactionAsync(async () => {
      for (let i = 0; i < 10; ++i) {
        const result = await db?.getAsync<{ name: string }>('SELECT name FROM Users');
        if (result?.name !== 'aaa') {
          throw new Error(`Exception from promise1: Expected aaa but received ${result?.name}}`);
        }
        await db?.runAsync('UPDATE Users SET name = ?', 'aaa');
        await delayAsync(200);
      }
    });

    const promise2 = new Promise(async (resolve, reject) => {
      try {
        await delayAsync(100);
        await db?.runAsync('UPDATE Users SET name = ?', 'bbb');
        const result = await db?.getAsync<{ name: string }>('SELECT name FROM Users');
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

  it('transactionExclusiveAsync should execute a transaction atomically and abort other write query', async () => {
    db = await openDatabaseAsync('test.db');
    await db.execAsync(`
DROP TABLE IF EXISTS Users;
CREATE TABLE IF NOT EXISTS Users (user_id INTEGER PRIMARY KEY NOT NULL, name VARCHAR(64));
INSERT INTO Users (name) VALUES ('aaa');
  `);

    const promise1 = db.transactionExclusiveAsync(async (txn) => {
      for (let i = 0; i < 10; ++i) {
        const result = await txn.getAsync<{ name: string }>('SELECT name FROM Users');
        if (result?.name !== 'aaa') {
          throw new Error(`Exception from promise1: Expected aaa but received ${result?.name}}`);
        }
        await txn.runAsync('UPDATE Users SET name = ?', 'aaa');
        await delayAsync(200);
      }
    });

    const promise2 = new Promise(async (resolve, reject) => {
      try {
        await delayAsync(100);
        await db?.runAsync('UPDATE Users SET name = ?', 'bbb');
        const result = await db?.getAsync<{ name: string }>('SELECT name FROM Users');
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
  let db: Database | null = null;

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

  it('getSync should return a row', () => {
    db = openDatabaseSync(':memory:');
    db.execSync(
      'CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY NOT NULL, value TEXT NOT NULL, intValue INTEGER)'
    );
    db.runSync('INSERT INTO test (value, intValue) VALUES (?, ?)', 'test', 123);
    const result = db.getSync<TestEntity>('SELECT * FROM test');
    expect(result?.value).toBe('test');
    expect(result?.intValue).toBe(123);
  });

  it('eachSync should return iterable', () => {
    db = openDatabaseSync(':memory:');
    db.execSync(`
  CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY NOT NULL, value TEXT NOT NULL, intValue INTEGER);
  INSERT INTO test (value, intValue) VALUES ('test1', 123);
  INSERT INTO test (value, intValue) VALUES ('test2', 456);
  INSERT INTO test (value, intValue) VALUES ('test3', 789);
  `);
    const results: TestEntity[] = [];
    for (const row of db.eachSync<TestEntity>('SELECT * FROM test ORDER BY intValue DESC')) {
      results.push(row);
    }
    expect(results[0].intValue).toBe(789);
    expect(results[1].intValue).toBe(456);
    expect(results[2].intValue).toBe(123);
  });

  it('transactionSync should commit changes', () => {
    db = openDatabaseSync(':memory:');
    db.execSync(
      'CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY NOT NULL, value TEXT NOT NULL, intValue INTEGER)'
    );

    db.transactionSync(() => {
      db?.runSync('INSERT INTO test (value, intValue) VALUES (?, ?)', 'test', 123);
    });
    const results = db.allSync<TestEntity>('SELECT * FROM test');
    expect(results.length).toBe(1);
  });

  it('transactionSync should rollback changes when exceptions happen', () => {
    db = openDatabaseSync(':memory:');
    db.execAsync(
      'CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY NOT NULL, value TEXT NOT NULL, intValue INTEGER)'
    );

    expect(() => {
      db?.transactionSync(() => {
        db?.runSync('INSERT INTO test (value, intValue) VALUES (?, ?)', 'test', 123);
        throw new Error('Exception inside transaction');
      });
    }).toThrow();

    const results = db.allSync<TestEntity>('SELECT * FROM test');
    expect(results.length).toBe(0);
  });
});

async function delayAsync(timeMs: number) {
  return new Promise((resolve) => setTimeout(resolve, timeMs));
}
