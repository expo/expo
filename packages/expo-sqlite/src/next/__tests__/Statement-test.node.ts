import { openDatabaseAsync, Database } from '../Database';
import { Statement, normalizeParams } from '../Statement';

jest.mock('../ExpoSQLiteNext');

interface TestEntity {
  value: string;
  intValue: number;
}

describe(Statement, () => {
  let db: Database;

  beforeEach(async () => {
    db = await openDatabaseAsync(':memory:');
    await db.execAsync(`
  CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY NOT NULL, value TEXT NOT NULL, intValue INTEGER);
  INSERT INTO test (value, intValue) VALUES ('test1', 123);
  INSERT INTO test (value, intValue) VALUES ('test1', 456);
  INSERT INTO test (value, intValue) VALUES ('test1', 789);
  `);
  });

  afterEach(async () => {
    await db.closeAsync();
  });

  it('runExec should return RunResult', async () => {
    const statement = await db.prepareAsync('INSERT INTO test (value, intValue) VALUES (?, ?)');
    const result = await statement.runAsync('hello', 111);
    expect(result.lastInsertRowid).toBeDefined();
    expect(result.changes).toBe(1);
    await statement.finalizeAsync();
  });

  it('getExec should support variadic unnamed parameter binding', async () => {
    const statement = await db.prepareAsync('SELECT * FROM test WHERE value = ? AND intValue = ?');
    const result = await statement.getAsync<TestEntity>('test1', 789);
    expect(result?.intValue).toBe(789);
    await statement.finalizeAsync();
  });

  it('getExec should support array unnamed parameter binding', async () => {
    const statement = await db.prepareAsync('SELECT * FROM test WHERE value = ? AND intValue = ?');
    const result = await statement.getAsync<TestEntity>(['test1', 789]);
    expect(result?.intValue).toBe(789);
    await statement.finalizeAsync();
  });

  it('getExec should support named parameter binding', async () => {
    const statement = await db.prepareAsync(
      'SELECT * FROM test WHERE value = $value and intValue = $intValue'
    );
    const result = await statement.getAsync<TestEntity>({ $value: 'test1', $intValue: 789 });
    expect(result?.intValue).toBe(789);
    await statement.finalizeAsync();
  });

  it('getExec should return null result when no matched in query', async () => {
    const statement = await db.prepareAsync('SELECT * FROM test WHERE value = ?');
    const result = await statement.getAsync<TestEntity>('not-exist');
    expect(result).toBeNull();
    await statement.finalizeAsync();
  });

  it('allExec should return all items', async () => {
    const statement = await db.prepareAsync('SELECT * FROM test WHERE intValue > ?');
    const results = await statement.allAsync<TestEntity>([200]);
    expect(results.length).toBe(2);
    expect(results[0].intValue).toBe(456);
    expect(results[1].intValue).toBe(789);
    await statement.finalizeAsync();
  });

  it('eachExec should return async iterable', async () => {
    const statement = await db.prepareAsync(
      'SELECT * FROM test WHERE intValue > $intValue ORDER BY intValue DESC'
    );
    const results: TestEntity[] = [];
    for await (const row of statement.eachAsync<TestEntity>({ $intValue: 200 })) {
      results.push(row);
    }
    expect(results.length).toBe(2);
    expect(results[0].intValue).toBe(789);
    expect(results[1].intValue).toBe(456);
    await statement.finalizeAsync();
  });

  it('resetAsync should reset the statement cursor', async () => {
    const statement = await db.prepareAsync('SELECT * FROM test ORDER BY intValue ASC');
    let result = await statement.getAsync<TestEntity>();
    expect(result?.intValue).toBe(123);
    result = await statement.getAsync<TestEntity>();
    expect(result?.intValue).toBe(456);
    await statement.resetAsync();
    result = await statement.getAsync<TestEntity>();
    expect(result?.intValue).toBe(123);
    await statement.finalizeAsync();
  });
});

describe(normalizeParams, () => {
  it('should accept no params', () => {
    expect(normalizeParams()).toStrictEqual({
      shouldPassAsObject: false,
      params: [],
    });
  });

  it('should accept variadic empty array', () => {
    expect(normalizeParams(...[])).toStrictEqual({
      shouldPassAsObject: false,
      params: [],
    });
  });

  it('should accept single primitive param as array', () => {
    expect(normalizeParams(1)).toStrictEqual({
      shouldPassAsObject: false,
      params: [1],
    });
    expect(normalizeParams('hello')).toStrictEqual({
      shouldPassAsObject: false,
      params: ['hello'],
    });
  });

  it('should accept variadic params', () => {
    expect(normalizeParams(1, 2, 3)).toStrictEqual({
      shouldPassAsObject: false,
      params: [1, 2, 3],
    });
  });

  it('should accept array params', () => {
    expect(normalizeParams([1, 2, 3])).toStrictEqual({
      shouldPassAsObject: false,
      params: [1, 2, 3],
    });
  });

  it('should accept object params', () => {
    expect(normalizeParams({ foo: 'foo', bar: 'bar' })).toStrictEqual({
      shouldPassAsObject: true,
      params: { foo: 'foo', bar: 'bar' },
    });
  });

  it('special cases - should pass as array params', () => {
    expect(normalizeParams({ foo: 'foo', bar: 'bar' }, 1, 2, 3)).toStrictEqual({
      shouldPassAsObject: false,
      params: [{ foo: 'foo', bar: 'bar' }, 1, 2, 3],
    });
    expect(normalizeParams({ foo: 'foo', bar: 'bar' }, [1, 2, 3])).toStrictEqual({
      shouldPassAsObject: false,
      params: [{ foo: 'foo', bar: 'bar' }, [1, 2, 3]],
    });
    expect(normalizeParams({ foo: 'foo', bar: 'bar' }, { hello: 'hello' })).toStrictEqual({
      shouldPassAsObject: false,
      params: [{ foo: 'foo', bar: 'bar' }, { hello: 'hello' }],
    });
  });
});
