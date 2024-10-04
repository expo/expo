import { openDatabaseAsync, SQLiteDatabase } from '../SQLiteDatabase';
import { SQLiteStatement } from '../SQLiteStatement';

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
    expect(allRows[0].intValue).toBe(456);
    expect(allRows[1].intValue).toBe(789);
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
    expect(rows[0].intValue).toBe(789);
    expect(rows[1].intValue).toBe(456);
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
    expect(allRows[0][2]).toBe(456);
    expect(allRows[1][2]).toBe(789);
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
});
