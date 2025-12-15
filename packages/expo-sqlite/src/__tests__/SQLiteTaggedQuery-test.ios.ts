import type { SQLiteRunResult } from '../NativeStatement';
import { openDatabaseAsync, SQLiteDatabase } from '../SQLiteDatabase';

jest.mock('expo/devtools', () => ({
  getDevToolsPluginClientAsync: jest.fn(),
}));
jest.mock('../ExpoSQLite', () => require('../__mocks__/ExpoSQLite'));

interface TestUser {
  id: number;
  name: string;
  age: number;
}

interface TestData {
  id: number;
  value: string;
  intValue: number;
  blobValue?: Uint8Array;
}

describe('SQLiteTaggedQuery', () => {
  let db: SQLiteDatabase;
  let sql: SQLiteDatabase['sql'];

  beforeEach(async () => {
    db = await openDatabaseAsync(':memory:');
    await db.execAsync(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        age INTEGER
      );
      CREATE TABLE test_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        value TEXT,
        intValue INTEGER,
        blobValue BLOB
      );
    `);
    sql = db.sql;
  });

  afterEach(async () => {
    await db.closeAsync();
  });

  // Happy path - basic queries
  it('should execute query with direct await', async () => {
    await db.runAsync('INSERT INTO users (name, age) VALUES (?, ?)', 'Alice', 30);
    await db.runAsync('INSERT INTO users (name, age) VALUES (?, ?)', 'Bob', 25);
    await db.runAsync('INSERT INTO users (name, age) VALUES (?, ?)', 'Charlie', 30);

    const age = 30;
    // Type parameter automatically infers TestUser[] - no assertion needed!
    const users = await sql<TestUser>`SELECT * FROM users WHERE age = ${age}`;

    expect(users).toHaveLength(2);
    expect(users[0].name).toBe('Alice');
    expect(users[1].name).toBe('Charlie');
  });

  it('should execute query with multiple parameters', async () => {
    await db.runAsync('INSERT INTO users (name, age) VALUES (?, ?)', 'Alice', 30);
    await db.runAsync('INSERT INTO users (name, age) VALUES (?, ?)', 'Bob', 25);

    const name = 'Alice';
    const age = 30;
    const users = await sql<TestUser>`
      SELECT * FROM users WHERE name = ${name} AND age = ${age}
    `;

    expect(users).toHaveLength(1);
    expect(users[0].name).toBe('Alice');
    expect(users[0].age).toBe(30);
  });

  it('should execute query with no parameters', async () => {
    await db.runAsync('INSERT INTO users (name, age) VALUES (?, ?)', 'Alice', 30);
    await db.runAsync('INSERT INTO users (name, age) VALUES (?, ?)', 'Bob', 25);

    const users = await sql<TestUser>`SELECT * FROM users ORDER BY age`;

    expect(users).toHaveLength(2);
    expect(users[0].name).toBe('Bob');
    expect(users[1].name).toBe('Alice');
  });

  it('should return first row with .first() method', async () => {
    await db.runAsync('INSERT INTO users (name, age) VALUES (?, ?)', 'Alice', 30);
    await db.runAsync('INSERT INTO users (name, age) VALUES (?, ?)', 'Bob', 25);

    const age = 30;
    const user = await sql<TestUser>`SELECT * FROM users WHERE age = ${age}`.first();

    expect(user).not.toBeNull();
    expect(user!.name).toBe('Alice');
    expect(user!.age).toBe(30);
  });

  it('should handle complex queries with order by and limit', async () => {
    await db.runAsync('INSERT INTO users (name, age) VALUES (?, ?)', 'Alice', 30);
    await db.runAsync('INSERT INTO users (name, age) VALUES (?, ?)', 'Bob', 25);
    await db.runAsync('INSERT INTO users (name, age) VALUES (?, ?)', 'Charlie', 35);

    const minAge = 20;
    const limit = 2;
    const users = await sql<TestUser>`
      SELECT * FROM users WHERE age > ${minAge} ORDER BY age DESC LIMIT ${limit}
    `;

    expect(users).toHaveLength(2);
    expect(users[0].name).toBe('Charlie');
    expect(users[1].name).toBe('Alice');
  });

  it('should execute insert and return metadata', async () => {
    const name = 'Alice';
    const age = 30;
    const result = (await sql`
      INSERT INTO users (name, age) VALUES (${name}, ${age})
    `) as SQLiteRunResult;

    expect(result.lastInsertRowId).toBe(1);
    expect(result.changes).toBe(1);

    const user = await db.getFirstAsync<TestUser>('SELECT * FROM users WHERE id = 1');
    expect(user?.name).toBe('Alice');
    expect(user?.age).toBe(30);
  });

  it('should execute update and return affected rows', async () => {
    await db.runAsync('INSERT INTO users (name, age) VALUES (?, ?)', 'Alice', 30);
    await db.runAsync('INSERT INTO users (name, age) VALUES (?, ?)', 'Bob', 25);

    const newAge = 31;
    const oldAge = 30;
    const result = (await sql`
      UPDATE users SET age = ${newAge} WHERE age = ${oldAge}
    `) as SQLiteRunResult;

    expect(result.changes).toBe(1);

    const user = await db.getFirstAsync<TestUser>('SELECT * FROM users WHERE name = ?', 'Alice');
    expect(user?.age).toBe(31);
  });

  it('should execute delete and return affected rows', async () => {
    await db.runAsync('INSERT INTO users (name, age) VALUES (?, ?)', 'Alice', 30);
    await db.runAsync('INSERT INTO users (name, age) VALUES (?, ?)', 'Bob', 25);

    const age = 30;
    const result = (await sql`DELETE FROM users WHERE age = ${age}`) as SQLiteRunResult;

    expect(result.changes).toBe(1);

    const users = await db.getAllAsync<TestUser>('SELECT * FROM users');
    expect(users).toHaveLength(1);
    expect(users[0].name).toBe('Bob');
  });

  it('should handle insert with returning clause', async () => {
    const name = 'Alice';
    const age = 30;
    const users = await sql<TestUser>`
      INSERT INTO users (name, age) VALUES (${name}, ${age}) RETURNING *
    `;

    expect(users).toHaveLength(1);
    expect(users[0].name).toBe('Alice');
    expect(users[0].age).toBe(30);
    expect(users[0].id).toBeGreaterThan(0);
  });

  it('should return values as arrays with .values()', async () => {
    await db.runAsync('INSERT INTO users (name, age) VALUES (?, ?)', 'Alice', 30);
    await db.runAsync('INSERT INTO users (name, age) VALUES (?, ?)', 'Bob', 25);

    const rows = await sql`SELECT name, age FROM users ORDER BY age`.values();

    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual(['Bob', 25]);
    expect(rows[1]).toEqual(['Alice', 30]);
  });

  it('should iterate over rows with for-await-of', async () => {
    await db.runAsync('INSERT INTO users (name, age) VALUES (?, ?)', 'Alice', 30);
    await db.runAsync('INSERT INTO users (name, age) VALUES (?, ?)', 'Bob', 25);
    await db.runAsync('INSERT INTO users (name, age) VALUES (?, ?)', 'Charlie', 35);

    const users: TestUser[] = [];
    for await (const user of sql<TestUser>`SELECT * FROM users ORDER BY age`.each()) {
      users.push(user);
    }

    expect(users).toHaveLength(3);
    expect(users[0].name).toBe('Bob');
    expect(users[1].name).toBe('Alice');
    expect(users[2].name).toBe('Charlie');
  });

  it('should iterate with parameters', async () => {
    await db.runAsync('INSERT INTO users (name, age) VALUES (?, ?)', 'Alice', 30);
    await db.runAsync('INSERT INTO users (name, age) VALUES (?, ?)', 'Bob', 25);
    await db.runAsync('INSERT INTO users (name, age) VALUES (?, ?)', 'Charlie', 35);

    const minAge = 28;
    const users: TestUser[] = [];
    for await (const user of sql<TestUser>`SELECT * FROM users WHERE age > ${minAge}`.each()) {
      users.push(user);
    }

    expect(users).toHaveLength(2);
    expect(users[0].name).toBe('Alice');
    expect(users[1].name).toBe('Charlie');
  });

  it('should execute query synchronously with .allSync()', async () => {
    await db.runAsync('INSERT INTO users (name, age) VALUES (?, ?)', 'Alice', 30);
    await db.runAsync('INSERT INTO users (name, age) VALUES (?, ?)', 'Bob', 25);

    const age = 30;
    const users = sql<TestUser>`SELECT * FROM users WHERE age = ${age}`.allSync();

    expect(users).toHaveLength(1);
    expect(users[0].name).toBe('Alice');
  });

  it('should execute query synchronously with .firstSync()', async () => {
    await db.runAsync('INSERT INTO users (name, age) VALUES (?, ?)', 'Alice', 30);

    const name = 'Alice';
    const user = sql<TestUser>`SELECT * FROM users WHERE name = ${name}`.firstSync();

    expect(user).not.toBeNull();
    expect(user!.name).toBe('Alice');
  });

  it('should execute mutation synchronously with .allSync()', async () => {
    const name = 'Alice';
    const age = 30;
    const result =
      sql`INSERT INTO users (name, age) VALUES (${name}, ${age})`.allSync() as SQLiteRunResult;

    expect(result.lastInsertRowId).toBe(1);
    expect(result.changes).toBe(1);
  });

  it('should iterate synchronously with .eachSync()', async () => {
    await db.runAsync('INSERT INTO users (name, age) VALUES (?, ?)', 'Alice', 30);
    await db.runAsync('INSERT INTO users (name, age) VALUES (?, ?)', 'Bob', 25);

    const users: TestUser[] = [];
    for (const user of sql<TestUser>`SELECT * FROM users ORDER BY age`.eachSync()) {
      users.push(user);
    }

    expect(users).toHaveLength(2);
    expect(users[0].name).toBe('Bob');
    expect(users[1].name).toBe('Alice');
  });

  it('should return values as arrays synchronously with .valuesSync()', async () => {
    await db.runAsync('INSERT INTO users (name, age) VALUES (?, ?)', 'Alice', 30);
    await db.runAsync('INSERT INTO users (name, age) VALUES (?, ?)', 'Bob', 25);

    const rows = sql`SELECT name, age FROM users ORDER BY age`.valuesSync();

    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual(['Bob', 25]);
    expect(rows[1]).toEqual(['Alice', 30]);
  });

  it('should work within transactions', async () => {
    await db.withTransactionAsync(async () => {
      const name1 = 'Alice';
      const age1 = 30;
      await sql`INSERT INTO users (name, age) VALUES (${name1}, ${age1})`;

      const name2 = 'Bob';
      const age2 = 25;
      await sql`INSERT INTO users (name, age) VALUES (${name2}, ${age2})`;
    });

    const users = await sql<TestUser>`SELECT * FROM users`;
    expect(users).toHaveLength(2);
  });

  it('should rollback on error within transaction', async () => {
    await expect(
      db.withTransactionAsync(async () => {
        const name = 'Alice';
        const age = 30;
        await sql`INSERT INTO users (name, age) VALUES (${name}, ${age})`;
        throw new Error('Intentional error');
      })
    ).rejects.toThrow('Intentional error');

    const users = await sql<TestUser>`SELECT * FROM users`;
    expect(users).toHaveLength(0);
  });

  it('should work within synchronous transactions', async () => {
    db.withTransactionSync(() => {
      const name1 = 'Alice';
      const age1 = 30;
      sql`INSERT INTO users (name, age) VALUES (${name1}, ${age1})`.allSync();

      const name2 = 'Bob';
      const age2 = 25;
      sql`INSERT INTO users (name, age) VALUES (${name2}, ${age2})`.allSync();
    });

    const users = sql<TestUser>`SELECT * FROM users`.allSync();
    expect(users).toHaveLength(2);
  });

  it('should allow method chaining', async () => {
    const name = 'Alice';
    const age = 30;

    await sql`INSERT INTO users (name, age) VALUES (${name}, ${age})`;
    const user = await sql<TestUser>`SELECT * FROM users WHERE name = ${name}`.first();

    expect(user).not.toBeNull();
    expect(user!.name).toBe('Alice');
  });

  it('should allow multiple queries in sequence', async () => {
    const name1 = 'Alice';
    await sql`INSERT INTO users (name, age) VALUES (${name1}, ${30})`;

    const name2 = 'Bob';
    await sql`INSERT INTO users (name, age) VALUES (${name2}, ${25})`;

    const users = await sql<TestUser>`SELECT * FROM users`;
    expect(users).toHaveLength(2);
  });

  // Edge cases
  it('should return null from .first() when no rows match', async () => {
    const age = 999;
    const user = await sql<TestUser>`SELECT * FROM users WHERE age = ${age}`.first();

    expect(user).toBeNull();
  });

  it('should handle empty result set in iterator', async () => {
    const users: TestUser[] = [];
    for await (const user of sql<TestUser>`SELECT * FROM users`.each()) {
      users.push(user);
    }

    expect(users).toHaveLength(0);
  });

  it('should handle empty result sets', async () => {
    const users = await sql<TestUser>`SELECT * FROM users WHERE age = ${999}`;
    expect(users).toEqual([]);
  });

  it('should handle very long strings', async () => {
    const longString = 'A'.repeat(10000);
    await sql`INSERT INTO users (name, age) VALUES (${longString}, ${25})`;

    const user = await sql<TestUser>`SELECT * FROM users`.first();
    expect(user!.name).toBe(longString);
  });

  it('should handle large numbers', async () => {
    const largeNumber = 2147483647;
    await sql`INSERT INTO users (name, age) VALUES (${'Test'}, ${largeNumber})`;

    const user = await sql<TestUser>`SELECT * FROM users`.first();
    expect(user!.age).toBe(largeNumber);
  });

  it('should handle multiple parameters of same value', async () => {
    const age = 30;
    await db.runAsync('INSERT INTO users (name, age) VALUES (?, ?)', 'Alice', 30);
    await db.runAsync('INSERT INTO users (name, age) VALUES (?, ?)', 'Bob', 25);
    await db.runAsync('INSERT INTO users (name, age) VALUES (?, ?)', 'Charlie', 30);

    const users = await sql<TestUser>`
      SELECT * FROM users WHERE age >= ${age} AND age <= ${age}
    `;

    expect(users).toHaveLength(2);
  });

  it('should handle query with only template string and no parameters', async () => {
    await db.runAsync('INSERT INTO users (name, age) VALUES (?, ?)', 'Alice', 30);

    const users = await sql<TestUser>`SELECT * FROM users`;

    expect(users).toHaveLength(1);
    expect(users[0].name).toBe('Alice');
  });

  it('should handle null values', async () => {
    const name = 'Alice';
    const age = null;
    await sql`INSERT INTO users (name, age) VALUES (${name}, ${age})`;

    const user = await sql<TestUser>`SELECT * FROM users WHERE name = ${name}`.first();

    expect(user).not.toBeNull();
    expect(user!.name).toBe('Alice');
    expect(user!.age).toBeNull();
  });

  it('should handle undefined values as null', async () => {
    const name = 'Bob';
    const age = undefined;
    await sql`INSERT INTO users (name, age) VALUES (${name}, ${age})`;

    const user = await sql<TestUser>`SELECT * FROM users WHERE name = ${name}`.first();

    expect(user).not.toBeNull();
    expect(user!.name).toBe('Bob');
    expect(user!.age).toBeNull();
  });

  it('should handle integer values', async () => {
    const value = 'test';
    const intValue = 42;
    await sql`INSERT INTO test_data (value, intValue) VALUES (${value}, ${intValue})`;

    const data = await sql<TestData>`SELECT * FROM test_data WHERE intValue = ${intValue}`.first();

    expect(data).not.toBeNull();
    expect(data!.intValue).toBe(42);
  });

  it('should handle floating point values', async () => {
    const value = 'test';
    const floatValue = 3.14159;
    await sql`INSERT INTO test_data (value, intValue) VALUES (${value}, ${floatValue})`;

    const data = await sql<TestData>`SELECT * FROM test_data`.first();

    expect(data).not.toBeNull();
    expect(data!.intValue).toBeCloseTo(3.14159, 5);
  });

  it('should handle boolean values', async () => {
    const value = 'test';
    const boolValue = true;
    await sql`INSERT INTO test_data (value, intValue) VALUES (${value}, ${boolValue})`;

    const data = await sql<TestData>`SELECT * FROM test_data`.first();

    expect(data).not.toBeNull();
    expect(data!.intValue).toBe(1);
  });

  it('should handle uint8array blob values', async () => {
    const value = 'test';
    const blob = new Uint8Array([1, 2, 3, 4, 5]);
    await sql`INSERT INTO test_data (value, blobValue) VALUES (${value}, ${blob})`;

    const data = await sql<TestData>`SELECT * FROM test_data`.first();

    expect(data).not.toBeNull();
    expect(data!.blobValue).toBeInstanceOf(Uint8Array);
    expect(Array.from(data!.blobValue!)).toEqual([1, 2, 3, 4, 5]);
  });

  it('should handle empty strings', async () => {
    const name = '';
    const age = 25;
    await sql`INSERT INTO users (name, age) VALUES (${name}, ${age})`;

    const user = await sql<TestUser>`SELECT * FROM users WHERE name = ${name}`.first();

    expect(user).not.toBeNull();
    expect(user!.name).toBe('');
  });

  // Security - SQL injection prevention
  it('should safely handle sql injection attempts in string values', async () => {
    await db.runAsync('INSERT INTO users (name, age) VALUES (?, ?)', 'Alice', 30);

    const maliciousInput = "'; DROP TABLE users; --";
    const users = await sql<TestUser>`
      SELECT * FROM users WHERE name = ${maliciousInput}
    `;

    expect(users).toHaveLength(0);

    const allUsers = await db.getAllAsync<TestUser>('SELECT * FROM users');
    expect(allUsers).toHaveLength(1);
    expect(allUsers[0].name).toBe('Alice');
  });

  it('should safely handle sql injection with or 1=1', async () => {
    await db.runAsync('INSERT INTO users (name, age) VALUES (?, ?)', 'Alice', 30);

    const maliciousInput = "Alice' OR '1'='1";
    const users = await sql<TestUser>`
      SELECT * FROM users WHERE name = ${maliciousInput}
    `;

    expect(users).toHaveLength(0);
  });

  it('should handle special characters in strings', async () => {
    const name = "O'Brien";
    await sql`INSERT INTO users (name, age) VALUES (${name}, ${42})`;

    const users = await sql<TestUser>`SELECT * FROM users WHERE name = ${name}`;

    expect(users).toHaveLength(1);
    expect(users[0].name).toBe("O'Brien");
  });

  it('should handle strings with quotes and backslashes', async () => {
    const name = 'Test "quoted" and \\backslash\\';
    await sql`INSERT INTO users (name, age) VALUES (${name}, ${25})`;

    const users = await sql<TestUser>`SELECT * FROM users WHERE name = ${name}`;

    expect(users).toHaveLength(1);
    expect(users[0].name).toBe(name);
  });

  // Error cases
  it('should throw error for invalid sql syntax', async () => {
    const age = 30;
    try {
      await sql`INVALID SQL SYNTAX ${age}`;
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it('should throw error for missing table', async () => {
    const name = 'Alice';
    try {
      await sql`SELECT * FROM nonexistent_table WHERE name = ${name}`;
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
