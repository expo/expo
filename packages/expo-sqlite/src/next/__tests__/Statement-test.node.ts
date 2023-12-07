import { openDatabaseAsync, Database } from '../Database';
import { composeRow, composeRows, Statement, normalizeParams } from '../Statement';

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

  it('getColumnNamesAsync should return column names', async () => {
    const statement = await db.prepareAsync('SELECT * FROM test');
    const columnNames = await statement.getColumnNamesAsync();
    expect(columnNames).toEqual(['id', 'value', 'intValue']);

    const statement2 = await db.prepareAsync('SELECT id, value, intValue FROM test');
    const columnNames2 = await statement2.getColumnNamesAsync();
    expect(columnNames2).toEqual(['id', 'value', 'intValue']);

    const statement3 = await db.prepareAsync(
      'SELECT id AS idWithCustomName, value, intValue FROM test'
    );
    const columnNames3 = await statement3.getColumnNamesAsync();
    expect(columnNames3).toEqual(['idWithCustomName', 'value', 'intValue']);
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
    expect(normalizeParams()).toStrictEqual([{}, {}, true]);
  });

  it('should accept variadic empty array', () => {
    expect(normalizeParams(...[])).toStrictEqual([{}, {}, true]);
  });

  it('should accept single primitive param as array', () => {
    expect(normalizeParams(1)).toStrictEqual([{ 0: 1 }, {}, true]);
    expect(normalizeParams('hello')).toStrictEqual([{ 0: 'hello' }, {}, true]);
  });

  it('should accept variadic params', () => {
    expect(normalizeParams(1, 2, 3)).toStrictEqual([{ 0: 1, 1: 2, 2: 3 }, {}, true]);
  });

  it('should accept array params', () => {
    expect(normalizeParams([1, 2, 3])).toStrictEqual([{ 0: 1, 1: 2, 2: 3 }, {}, true]);
  });

  it('should accept object params', () => {
    expect(normalizeParams({ foo: 'foo', bar: 'bar' })).toStrictEqual([
      { foo: 'foo', bar: 'bar' },
      {},
      false,
    ]);
  });

  it('should support blob params', () => {
    const blob = new Uint8Array([0x00]);
    const blob2 = new Uint8Array([0x01]);
    expect(normalizeParams(blob)).toStrictEqual([{}, { 0: blob }, true]);
    expect(normalizeParams('hello', blob)).toStrictEqual([{ 0: 'hello' }, { 1: blob }, true]);
    expect(normalizeParams(['hello', blob, 'world', blob2])).toStrictEqual([
      { 0: 'hello', 2: 'world' },
      { 1: blob, 3: blob2 },
      true,
    ]);
    expect(normalizeParams({ foo: 'foo', bar: blob })).toStrictEqual([
      { foo: 'foo' },
      { bar: blob },
      false,
    ]);
  });

  it('special cases - should pass as array params', () => {
    expect(normalizeParams({ foo: 'foo', bar: 'bar' }, 1, 2, 3)).toStrictEqual([
      { 0: { foo: 'foo', bar: 'bar' }, 1: 1, 2: 2, 3: 3 },
      {},
      true,
    ]);
    expect(normalizeParams({ foo: 'foo', bar: 'bar' }, [1, 2, 3])).toStrictEqual([
      { 0: { foo: 'foo', bar: 'bar' }, 1: [1, 2, 3] },
      {},
      true,
    ]);
    expect(normalizeParams({ foo: 'foo', bar: 'bar' }, { hello: 'hello' })).toStrictEqual([
      { 0: { foo: 'foo', bar: 'bar' }, 1: { hello: 'hello' } },
      {},
      true,
    ]);
  });
});

describe(composeRow, () => {
  it('should compose row', () => {
    const columnNames = ['id', 'value', 'intValue'];
    const columnValues = [1, 'hello', 123];
    expect(composeRow(columnNames, columnValues)).toEqual({
      id: 1,
      value: 'hello',
      intValue: 123,
    });
  });

  it('should throw error when column names and values count mismatch', () => {
    const columnNames = ['id', 'value', 'intValue'];
    const columnValues = [1, 'hello'];
    expect(() => composeRow(columnNames, columnValues)).toThrow();
  });
});

describe(composeRows, () => {
  it('should compose rows', () => {
    const columnNames = ['id', 'value', 'intValue'];
    const columnValuesList = [
      [1, 'hello', 123],
      [2, 'world', 456],
    ];
    expect(composeRows(columnNames, columnValuesList)).toEqual([
      {
        id: 1,
        value: 'hello',
        intValue: 123,
      },
      {
        id: 2,
        value: 'world',
        intValue: 456,
      },
    ]);
  });

  it('should throw error when column names and values count mismatch', () => {
    const columnNames = ['id', 'value', 'intValue'];
    const columnValuesList = [[1, 'hello']];
    expect(() => composeRows(columnNames, columnValuesList)).toThrow();
  });

  it('not throw error when column names and values count mismatch only for some partial values', () => {
    const columnNames = ['id', 'value', 'intValue'];
    const columnValuesList = [
      [1, 'hello', 123],
      [2, 'world'],
    ];
    expect(() => composeRows(columnNames, columnValuesList)).not.toThrow();
    expect(composeRows(columnNames, columnValuesList)).toEqual([
      {
        id: 1,
        value: 'hello',
        intValue: 123,
      },
      {
        id: 2,
        value: 'world',
        intValue: undefined,
      },
    ]);
  });

  it('should return empty array when column values list is empty', () => {
    const columnNames = ['id', 'value', 'intValue'];
    const columnValuesList = [];
    expect(composeRows(columnNames, columnValuesList)).toEqual([]);
  });
});
