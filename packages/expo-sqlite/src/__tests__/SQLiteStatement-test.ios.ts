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

  it('reading a result after the statement ran again should throw, not return the later rows', async () => {
    const statement = await db.prepareAsync('SELECT intValue FROM test WHERE intValue = ?');
    const first = await statement.executeAsync<TestEntity>(123);
    const second = await statement.executeAsync<TestEntity>(789);
    // `first` no longer owns the one native cursor, so it must not step `second`'s rows.
    await expect(first.getAllAsync()).rejects.toThrow(/prepared statement ran again/);
    expect((await second.getAllAsync()).map((row) => row.intValue)).toEqual([789]);
    await statement.finalizeAsync();
  });

  it('a superseded result that must step for its first row should throw', async () => {
    const statement = await db.prepareAsync('SELECT intValue FROM test WHERE intValue > ?');
    // No row matches, so this result has no cached row and has to step the cursor.
    const first = await statement.executeAsync<TestEntity>(1000);
    await statement.executeAsync<TestEntity>(0);
    await expect(first.getFirstAsync()).rejects.toThrow(/prepared statement ran again/);
    await statement.finalizeAsync();
  });

  it('a superseded result should still serve the first row it was already given', async () => {
    const statement = await db.prepareAsync('SELECT intValue FROM test WHERE intValue = ?');
    const first = await statement.executeAsync<TestEntity>(123);
    const second = await statement.executeAsync<TestEntity>(789);
    // `run` handed each result its own first row, and serving it steps no cursor.
    expect((await first.getFirstAsync())?.intValue).toBe(123);
    expect((await second.getFirstAsync())?.intValue).toBe(789);
    await statement.finalizeAsync();
  });

  it('executeSync results should be guarded the same way', async () => {
    const statement = await db.prepareAsync('SELECT intValue FROM test WHERE intValue = ?');
    const first = statement.executeSync<TestEntity>(123);
    statement.executeSync<TestEntity>(789);
    expect(() => first.getAllSync()).toThrow(/prepared statement ran again/);
    await statement.finalizeAsync();
  });

  it('concurrent reads over one shared statement should not return another reader rows', async () => {
    await db.execAsync(`
  CREATE TABLE IF NOT EXISTS shared (id INTEGER PRIMARY KEY NOT NULL, value TEXT NOT NULL);
  INSERT INTO shared (id, value) VALUES (1, 'one');
  INSERT INTO shared (id, value) VALUES (2, 'two');
  INSERT INTO shared (id, value) VALUES (3, 'three');
  `);
    const statement = await db.prepareAsync('SELECT value FROM shared WHERE id = ?');
    const readAsync = async (id: number) => {
      const result = await statement.executeAsync<{ value: string }>(id);
      try {
        return (await result.getAllAsync()).map((row) => row.value);
      } catch {
        return 'superseded';
      }
    };
    const results = await Promise.all([readAsync(1), readAsync(2), readAsync(3)]);
    // One reader owns the cursor and the rest say so, but no reader gets another reader rows.
    for (const result of results) {
      expect(result === 'superseded' || result.length === 1).toBe(true);
    }
    expect(results.filter((result) => result !== 'superseded')).toHaveLength(1);
    await statement.finalizeAsync();
  });

  it('resetAsync on a superseded result should throw', async () => {
    const statement = await db.prepareAsync('SELECT intValue FROM test WHERE intValue = ?');
    const first = await statement.executeAsync<TestEntity>(123);
    const second = await statement.executeAsync<TestEntity>(789);
    // Resetting the stale result would rewind the cursor that `second` owns now.
    await expect(first.resetAsync()).rejects.toThrow(/prepared statement ran again/);
    expect((await second.getAllAsync()).map((row) => row.intValue)).toEqual([789]);
    await statement.finalizeAsync();
  });

  it('a superseded result should throw from the async generator mid-iteration', async () => {
    const statement = await db.prepareAsync('SELECT intValue FROM test ORDER BY intValue ASC');
    const first = await statement.executeAsync<TestEntity>();
    const iterator = first[Symbol.asyncIterator]();
    expect((await iterator.next()).value?.intValue).toBe(123);
    // Supersede the result while it is still part-way through its rows.
    await statement.executeAsync<TestEntity>();
    await expect(iterator.next()).rejects.toThrow(/prepared statement ran again/);
    await statement.finalizeAsync();
  });

  it('a superseded result should throw from the sync generator mid-iteration', async () => {
    const statement = await db.prepareAsync('SELECT intValue FROM test ORDER BY intValue ASC');
    const first = statement.executeSync<TestEntity>();
    const iterator = first[Symbol.iterator]();
    expect(iterator.next().value?.intValue).toBe(123);
    statement.executeSync<TestEntity>();
    expect(() => iterator.next()).toThrow(/prepared statement ran again/);
    await statement.finalizeAsync();
  });

  it('getFirstSync on a superseded result should throw', async () => {
    const statement = await db.prepareAsync('SELECT intValue FROM test WHERE intValue > ?');
    // No row matches, so this result has no cached row and has to step the cursor.
    const first = statement.executeSync<TestEntity>(1000);
    statement.executeSync<TestEntity>(0);
    expect(() => first.getFirstSync()).toThrow(/prepared statement ran again/);
    await statement.finalizeAsync();
  });

  it('resetSync on a superseded result should throw', async () => {
    const statement = await db.prepareAsync('SELECT intValue FROM test WHERE intValue = ?');
    const first = statement.executeSync<TestEntity>(123);
    const second = statement.executeSync<TestEntity>(789);
    // Resetting the stale result would rewind the cursor that `second` owns now.
    expect(() => first.resetSync()).toThrow(/prepared statement ran again/);
    expect(second.getAllSync().map((row) => row.intValue)).toEqual([789]);
    await statement.finalizeAsync();
  });

  it('executeForRawResultAsync results should be guarded the same way', async () => {
    const statement = await db.prepareAsync('SELECT intValue FROM test WHERE intValue = ?');
    const first = await statement.executeForRawResultAsync<TestEntity>(123);
    const second = await statement.executeForRawResultAsync<TestEntity>(789);
    await expect(first.getAllAsync()).rejects.toThrow(/prepared statement ran again/);
    expect(await second.getAllAsync()).toEqual([[789]]);
    await statement.finalizeAsync();
  });

  it('only the last of several executions should own the cursor', async () => {
    const statement = await db.prepareAsync('SELECT intValue FROM test WHERE intValue = ?');
    const first = await statement.executeAsync<TestEntity>(123);
    const second = await statement.executeAsync<TestEntity>(456);
    const third = await statement.executeAsync<TestEntity>(789);
    await expect(first.getAllAsync()).rejects.toThrow(/prepared statement ran again/);
    await expect(second.getAllAsync()).rejects.toThrow(/prepared statement ran again/);
    expect((await third.getAllAsync()).map((row) => row.intValue)).toEqual([789]);
    await statement.finalizeAsync();
  });

  it('executions queued with no read between them should all settle', async () => {
    const statement = await db.prepareAsync('SELECT intValue FROM test WHERE intValue = ?');
    // A result left unread must not keep later executions from resolving.
    await statement.executeAsync<TestEntity>(123);
    const queued = [
      statement.executeAsync<TestEntity>(456),
      statement.executeAsync<TestEntity>(789),
      statement.executeAsync<TestEntity>(123),
    ];
    await expect(Promise.all(queued)).resolves.toHaveLength(3);
    await statement.finalizeAsync();
  });

  it('a sync execution should supersede an earlier async result', async () => {
    const statement = await db.prepareAsync('SELECT intValue FROM test WHERE intValue = ?');
    const asyncResult = await statement.executeAsync<TestEntity>(123);
    const syncResult = statement.executeSync<TestEntity>(789);
    await expect(asyncResult.getAllAsync()).rejects.toThrow(/prepared statement ran again/);
    expect(syncResult.getAllSync().map((row) => row.intValue)).toEqual([789]);
    await statement.finalizeAsync();
  });

  it('a statement should stay usable across many executions', async () => {
    const statement = await db.prepareAsync('SELECT intValue FROM test WHERE intValue = ?');
    const values = [123, 456, 789] as const;
    for (let index = 0; index < 60; index++) {
      const intValue = values[index % values.length] as number;
      const result = await statement.executeAsync<TestEntity>(intValue);
      expect((await result.getAllAsync()).map((row) => row.intValue)).toEqual([intValue]);
    }
    await statement.finalizeAsync();
  });

  it('concurrent writes over one shared statement should all apply', async () => {
    // A write takes one native call and caches no rows, so the ownership check must not reject
    // the reuse pattern that write-heavy callers rely on.
    const statement = await db.prepareAsync('INSERT INTO test (value, intValue) VALUES (?, ?)');
    await Promise.all([
      statement.executeAsync('written', 1),
      statement.executeAsync('written', 2),
      statement.executeAsync('written', 3),
    ]);
    await statement.finalizeAsync();
    const written = await db.getAllAsync<TestEntity>(
      'SELECT intValue FROM test WHERE value = ? ORDER BY intValue ASC',
      'written'
    );
    expect(written.map((row) => row.intValue)).toEqual([1, 2, 3]);
  });

  it('a write statement reused in a loop should keep returning its own row', async () => {
    const statement = await db.prepareAsync(
      'INSERT INTO test (value, intValue) VALUES (?, ?) RETURNING intValue'
    );
    for (const intValue of [11, 22, 33]) {
      const result = await statement.executeAsync<TestEntity>('looped', intValue);
      // `run` cached this row, so reading it steps no cursor even once superseded.
      expect((await result.getFirstAsync())?.intValue).toBe(intValue);
    }
    await statement.finalizeAsync();
  });
});
