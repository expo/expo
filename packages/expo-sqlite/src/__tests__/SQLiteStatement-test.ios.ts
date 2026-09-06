import type { SQLiteDatabase } from '../SQLiteDatabase';
import { openDatabaseAsync } from '../SQLiteDatabase';
import { SQLiteStatement } from '../SQLiteStatement';

jest.mock('expo/devtools', () => ({
  getDevToolsPluginClientAsync: jest.fn(),
}));
jest.mock('../ExpoSQLite', () => require('../__mocks__/ExpoSQLite'));

interface TestEntity {
  value: string;
  intValue: number;
}

describe(SQLiteStatement, () => {
  let db: SQLiteDatabase;

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

  it('executeAsync should return object with `lastInsertRowId` and `changes`', async () => {
    const statement = await db.prepareAsync('INSERT INTO test (value, intValue) VALUES (?, ?)');
    const result = await statement.executeAsync('hello', 111);
    expect(result.lastInsertRowId).toBeGreaterThan(0);
    expect(result.changes).toBe(1);
    await statement.finalizeAsync();
  });

  it('executeAsync should support variadic unnamed parameter binding', async () => {
    const statement = await db.prepareAsync('SELECT * FROM test WHERE value = ? AND intValue = ?');
    const result = await statement.executeAsync<TestEntity>('test1', 789);
    const firstRow = await result.getFirstAsync();
    expect(firstRow?.intValue).toBe(789);
    await statement.finalizeAsync();
  });

  it('executeAsync should support array unnamed parameter binding', async () => {
    const statement = await db.prepareAsync('SELECT * FROM test WHERE value = ? AND intValue = ?');
    const result = await statement.executeAsync<TestEntity>(['test1', 789]);
    const firstRow = await result.getFirstAsync();
    expect(firstRow?.intValue).toBe(789);
    await statement.finalizeAsync();
  });

  it('executeAsync should support named parameter binding', async () => {
    const statement = await db.prepareAsync(
      'SELECT * FROM test WHERE value = $value and intValue = $intValue'
    );
    const result = await statement.executeAsync<TestEntity>({ $value: 'test1', $intValue: 789 });
    const firstRow = await result.getFirstAsync();
    expect(firstRow?.intValue).toBe(789);
    await statement.finalizeAsync();
  });

  it('executeAsync + getFirstAsync should return null result when no matched in query', async () => {
    const statement = await db.prepareAsync('SELECT * FROM test WHERE value = ?');
    const result = await statement.executeAsync<TestEntity>('not-exist');
    const firstRow = await result.getFirstAsync();
    expect(firstRow).toBeNull();
    await statement.finalizeAsync();
  });

  it('executeAsync + getAllAsync should return all items', async () => {
    const statement = await db.prepareAsync('SELECT * FROM test WHERE intValue > ?');
    const result = await statement.executeAsync<TestEntity>([200]);
    const allRows = await result.getAllAsync();
    expect(allRows.length).toBe(2);
    expect(allRows[0]?.intValue).toBe(456);
    expect(allRows[1]?.intValue).toBe(789);
    await statement.finalizeAsync();
  });

  it('executeAsync should return async iterable', async () => {
    const statement = await db.prepareAsync(
      'SELECT * FROM test WHERE intValue > $intValue ORDER BY intValue DESC'
    );
    const result = await statement.executeAsync<TestEntity>({ $intValue: 200 });
    const rows: TestEntity[] = [];
    for await (const row of result) {
      rows.push(row);
    }
    expect(rows.length).toBe(2);
    expect(rows[0]?.intValue).toBe(789);
    expect(rows[1]?.intValue).toBe(456);
    await statement.finalizeAsync();
  });

  it('executeForRawResultAsync + getFirstAsync should return the first raw value array', async () => {
    const statement = await db.prepareAsync('SELECT * FROM test WHERE intValue = ?');
    const result = await statement.executeForRawResultAsync<TestEntity>(123);
    const firstRow = await result.getFirstAsync();
    expect(firstRow).toEqual([1, 'test1', 123]);
    await statement.finalizeAsync();
  });

  it('executeForRawResultAsync + getAllAsync should return all raw value arrays', async () => {
    const statement = await db.prepareAsync('SELECT * FROM test WHERE intValue > ?');
    const result = await statement.executeForRawResultAsync<TestEntity>([200]);
    const allRows = await result.getAllAsync();
    expect(allRows.length).toBe(2);
    expect(allRows[0]?.[2]).toBe(456);
    expect(allRows[1]?.[2]).toBe(789);
    await statement.finalizeAsync();
  });

  it('executeForRawResultAsync should return async iterable for raw value arrays', async () => {
    const statement = await db.prepareAsync(
      'SELECT * FROM test WHERE intValue > $intValue ORDER BY intValue DESC'
    );
    const result = await statement.executeForRawResultAsync<TestEntity>({ $intValue: 200 });
    const intValues: number[] = [];
    for await (const row of result) {
      intValues.push(row[2] as number);
    }
    expect(intValues.length).toBe(2);
    expect(intValues[0]).toBe(789);
    expect(intValues[1]).toBe(456);
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
    const result = await statement.executeAsync<TestEntity>();
    let row = (await result.next()).value;
    expect(row?.intValue).toBe(123);
    row = (await result.next()).value;
    expect(row?.intValue).toBe(456);
    await result.resetAsync();
    row = (await result.next()).value;
    expect(row?.intValue).toBe(123);
    await statement.finalizeAsync();
  });

  it('concurrent reads over one shared statement should not corrupt each other', async () => {
    await db.execAsync(`
  CREATE TABLE IF NOT EXISTS shared (id INTEGER PRIMARY KEY NOT NULL, value TEXT NOT NULL);
  INSERT INTO shared (id, value) VALUES (1, 'one');
  INSERT INTO shared (id, value) VALUES (2, 'two');
  INSERT INTO shared (id, value) VALUES (3, 'three');
  `);
    const statement = await db.prepareAsync('SELECT value FROM shared WHERE id = ?');
    const readAsync = async (id: number) => {
      const result = await statement.executeAsync<{ value: string }>(id);
      const rows = await result.getAllAsync();
      return rows.map((row) => row.value);
    };
    const [first, second, third] = await Promise.all([readAsync(1), readAsync(2), readAsync(3)]);
    expect(first).toEqual(['one']);
    expect(second).toEqual(['two']);
    expect(third).toEqual(['three']);
    await statement.finalizeAsync();
  });

  it('a cursor abandoned without reading rows should not block later executions', async () => {
    const statement = await db.prepareAsync('SELECT value FROM test WHERE intValue = ?');
    // Never read the rows of the first execution.
    await statement.executeAsync<TestEntity>(123);
    const result = await statement.executeAsync<TestEntity>(456);
    expect(await result.getAllAsync()).toEqual([{ value: 'test1' }]);
    await statement.finalizeAsync();
  });

  it('a partially iterated cursor should not block later executions', async () => {
    const statement = await db.prepareAsync('SELECT intValue FROM test ORDER BY intValue ASC');
    const result = await statement.executeAsync<TestEntity>();
    for await (const row of result) {
      expect(row.intValue).toBe(123);
      break;
    }
    const second = await statement.executeAsync<TestEntity>();
    expect((await second.getAllAsync()).map((row) => row.intValue)).toEqual([123, 456, 789]);
    await statement.finalizeAsync();
  });

  it('a failed execution should not block later executions', async () => {
    const statement = await db.prepareAsync('SELECT value FROM test WHERE intValue = ?');
    await expect(statement.executeAsync<TestEntity>(Symbol('bad') as any)).rejects.toThrow();
    const result = await statement.executeAsync<TestEntity>(123);
    expect(await result.getAllAsync()).toEqual([{ value: 'test1' }]);
    await statement.finalizeAsync();
  });

  it('an execution started while another cursor is mid-fetch should still be serialized', async () => {
    await db.execAsync(`
  CREATE TABLE IF NOT EXISTS wide (id INTEGER PRIMARY KEY NOT NULL, tag TEXT NOT NULL);
  INSERT INTO wide (id, tag) VALUES (1, 'a1');
  INSERT INTO wide (id, tag) VALUES (2, 'a2');
  INSERT INTO wide (id, tag) VALUES (3, 'b1');
  `);
    const statement = await db.prepareAsync('SELECT tag FROM wide WHERE tag LIKE ?');
    const first = await statement.executeAsync<{ tag: string }>('a%');
    // Start a second execution without awaiting, while the first cursor is unread.
    const secondPromise = statement.executeAsync<{ tag: string }>('b%');
    const firstRows = (await first.getAllAsync()).map((row) => row.tag);
    const secondRows = (await (await secondPromise).getAllAsync()).map((row) => row.tag);
    expect(firstRows).toEqual(['a1', 'a2']);
    expect(secondRows).toEqual(['b1']);
    await statement.finalizeAsync();
  });

  it('resetAsync on a cursor superseded by another execution should throw', async () => {
    const statement = await db.prepareAsync('SELECT intValue FROM test WHERE intValue = ?');
    const first = await statement.executeAsync<TestEntity>(123);
    expect((await first.getAllAsync()).map((row) => row.intValue)).toEqual([123]);
    const second = await statement.executeAsync<TestEntity>(456);
    // Resetting the stale cursor would rewind the second execution instead of the first.
    await expect(first.resetAsync()).rejects.toThrow('can no longer be reset');
    expect((await second.getAllAsync()).map((row) => row.intValue)).toEqual([456]);
    await statement.finalizeAsync();
  });

  it('several executions queued behind one unread cursor should each get their own rows', async () => {
    const statement = await db.prepareAsync('SELECT intValue FROM test WHERE intValue = ?');
    const first = await statement.executeAsync<TestEntity>(123);
    // Queue two more executions while the first cursor is still unread.
    const secondPromise = statement.executeAsync<TestEntity>(456);
    const thirdPromise = statement.executeAsync<TestEntity>(789);
    const firstRows = (await first.getAllAsync()).map((row) => row.intValue);
    const secondRows = (await (await secondPromise).getAllAsync()).map((row) => row.intValue);
    const thirdRows = (await (await thirdPromise).getAllAsync()).map((row) => row.intValue);
    expect(firstRows).toEqual([123]);
    expect(secondRows).toEqual([456]);
    expect(thirdRows).toEqual([789]);
    await statement.finalizeAsync();
  });
});
