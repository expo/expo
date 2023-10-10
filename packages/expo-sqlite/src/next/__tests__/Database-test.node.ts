import { openDatabaseAsync, Database } from '../Database';

jest.mock('../ExpoSQLiteNext');

interface TestEntity {
  value: string;
  intValue: number;
}

describe('Database', () => {
  let db: Database | null = null;

  afterEach(async () => {
    db?.closeAsync();
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
    expect(result.lastID).toBe(1);
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
});
