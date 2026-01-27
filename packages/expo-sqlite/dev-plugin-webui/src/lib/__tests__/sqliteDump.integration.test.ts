import { describe, expect, jest, test } from '@jest/globals';
import * as SQLite from 'expo-sqlite';

import { dumpDatabase, importDatabase } from '../sqliteDump';

jest.mock('../../../node_modules/expo-sqlite/build/ExpoSQLite.js', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('../../../../src/__mocks__/ExpoSQLite')
);

const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
  console.log = jest.fn();
});
afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.log = originalConsoleLog;
});

describe('sqliteDump - Export and Import Roundtrip', () => {
  test('should preserve simple table data in roundtrip', async () => {
    // Create source database
    const sourceDb = await SQLite.openDatabaseAsync(':memory:');
    await sourceDb.execAsync('CREATE TABLE users (id INTEGER, name TEXT, age INTEGER)');
    await sourceDb.runAsync('INSERT INTO users VALUES (?, ?, ?)', [1, 'Alice', 30]);
    await sourceDb.runAsync('INSERT INTO users VALUES (?, ?, ?)', [2, 'Bob', 25]);

    // Export to SQL
    const sqlDump = await dumpDatabase(sourceDb);

    // Import to new database
    const targetDb = await SQLite.openDatabaseAsync(':memory:');
    await importDatabase(targetDb, sqlDump);

    // Verify data
    const users = await targetDb.getAllAsync<{ id: number; name: string; age: number }>(
      'SELECT * FROM users ORDER BY id'
    );

    expect(users).toEqual([
      { id: 1, name: 'Alice', age: 30 },
      { id: 2, name: 'Bob', age: 25 },
    ]);

    await sourceDb.closeAsync();
    await targetDb.closeAsync();
  });

  test('should preserve NULL values in roundtrip', async () => {
    const sourceDb = await SQLite.openDatabaseAsync(':memory:');
    await sourceDb.execAsync('CREATE TABLE test (id INTEGER, value TEXT)');
    await sourceDb.runAsync('INSERT INTO test VALUES (?, ?)', [1, 'present']);
    await sourceDb.runAsync('INSERT INTO test VALUES (?, ?)', [2, null]);

    const sqlDump = await dumpDatabase(sourceDb);
    const targetDb = await SQLite.openDatabaseAsync(':memory:');
    await importDatabase(targetDb, sqlDump);

    const rows = await targetDb.getAllAsync<{ id: number; value: string | null }>(
      'SELECT * FROM test ORDER BY id'
    );

    expect(rows[0].value).toBe('present');
    expect(rows[1].value).toBeNull();

    await sourceDb.closeAsync();
    await targetDb.closeAsync();
  });

  test('should preserve BLOB data in roundtrip', async () => {
    const sourceDb = await SQLite.openDatabaseAsync(':memory:');
    await sourceDb.execAsync('CREATE TABLE test (id INTEGER, data BLOB)');
    const blobData = new Uint8Array([0x01, 0x02, 0x03, 0xff, 0xab, 0xcd]);
    await sourceDb.runAsync('INSERT INTO test VALUES (?, ?)', [1, blobData]);

    const sqlDump = await dumpDatabase(sourceDb);
    const targetDb = await SQLite.openDatabaseAsync(':memory:');
    await importDatabase(targetDb, sqlDump);

    const rows = await targetDb.getAllAsync<{ id: number; data: Uint8Array }>('SELECT * FROM test');

    // Handle both Uint8Array and Buffer-like objects
    const receivedData = rows[0].data as any;
    const actualData =
      receivedData instanceof Uint8Array
        ? Array.from(receivedData)
        : receivedData.data || Array.from(receivedData);
    const expectedData = Array.from(blobData);
    expect(actualData).toEqual(expectedData);

    await sourceDb.closeAsync();
    await targetDb.closeAsync();
  });

  test('should preserve special characters in text', async () => {
    const sourceDb = await SQLite.openDatabaseAsync(':memory:');
    await sourceDb.execAsync('CREATE TABLE test (text TEXT)');
    await sourceDb.runAsync('INSERT INTO test VALUES (?)', ["It's a test with 'quotes'"]);
    await sourceDb.runAsync('INSERT INTO test VALUES (?)', ['Line 1\nLine 2']);
    await sourceDb.runAsync('INSERT INTO test VALUES (?)', ['Tab\there']);

    const sqlDump = await dumpDatabase(sourceDb);
    const targetDb = await SQLite.openDatabaseAsync(':memory:');
    await importDatabase(targetDb, sqlDump);

    const rows = await targetDb.getAllAsync<{ text: string }>('SELECT * FROM test');

    expect(rows[0].text).toBe("It's a test with 'quotes'");
    expect(rows[1].text).toBe('Line 1\nLine 2');
    expect(rows[2].text).toBe('Tab\there');

    await sourceDb.closeAsync();
    await targetDb.closeAsync();
  });

  test('should preserve multiple tables with foreign keys', async () => {
    const sourceDb = await SQLite.openDatabaseAsync(':memory:');
    await sourceDb.execAsync(`
      CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);
      CREATE TABLE posts (id INTEGER PRIMARY KEY, user_id INTEGER, title TEXT);
    `);
    await sourceDb.runAsync('INSERT INTO users VALUES (?, ?)', [1, 'Alice']);
    await sourceDb.runAsync('INSERT INTO posts VALUES (?, ?, ?)', [1, 1, 'Hello World']);

    const sqlDump = await dumpDatabase(sourceDb);
    const targetDb = await SQLite.openDatabaseAsync(':memory:');
    await importDatabase(targetDb, sqlDump);

    const users = await targetDb.getAllAsync('SELECT * FROM users');
    const posts = await targetDb.getAllAsync('SELECT * FROM posts');

    expect(users).toHaveLength(1);
    expect(posts).toHaveLength(1);

    await sourceDb.closeAsync();
    await targetDb.closeAsync();
  });

  test('should preserve indexes', async () => {
    const sourceDb = await SQLite.openDatabaseAsync(':memory:');
    await sourceDb.execAsync('CREATE TABLE test (id INTEGER, name TEXT)');
    await sourceDb.execAsync('CREATE INDEX idx_name ON test(name)');

    const sqlDump = await dumpDatabase(sourceDb);
    const targetDb = await SQLite.openDatabaseAsync(':memory:');
    await importDatabase(targetDb, sqlDump);

    // Verify index exists
    const indexes = await targetDb.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='index' AND name='idx_name'"
    );

    expect(indexes).toHaveLength(1);
    expect(indexes[0].name).toBe('idx_name');

    await sourceDb.closeAsync();
    await targetDb.closeAsync();
  });

  test('should preserve table with INTEGER PRIMARY KEY (rowid)', async () => {
    const sourceDb = await SQLite.openDatabaseAsync(':memory:');
    await sourceDb.execAsync('CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)');
    await sourceDb.runAsync('INSERT INTO test (name) VALUES (?)', ['Alice']);
    await sourceDb.runAsync('INSERT INTO test (name) VALUES (?)', ['Bob']);

    // Get the rowids
    const sourceRows = await sourceDb.getAllAsync<{ id: number; name: string }>(
      'SELECT id, name FROM test ORDER BY id'
    );

    const sqlDump = await dumpDatabase(sourceDb);
    const targetDb = await SQLite.openDatabaseAsync(':memory:');
    await importDatabase(targetDb, sqlDump);

    const targetRows = await targetDb.getAllAsync<{ id: number; name: string }>(
      'SELECT id, name FROM test ORDER BY id'
    );

    // IDs should be preserved
    expect(targetRows).toEqual(sourceRows);

    await sourceDb.closeAsync();
    await targetDb.closeAsync();
  });

  test('should handle large dataset', async () => {
    const sourceDb = await SQLite.openDatabaseAsync(':memory:');
    await sourceDb.execAsync('CREATE TABLE test (id INTEGER, value TEXT)');

    // Insert 1000 rows
    for (let i = 0; i < 1000; i++) {
      await sourceDb.runAsync('INSERT INTO test VALUES (?, ?)', [i, `value_${i}`]);
    }

    const sqlDump = await dumpDatabase(sourceDb);
    const targetDb = await SQLite.openDatabaseAsync(':memory:');
    await importDatabase(targetDb, sqlDump);

    const count = await targetDb.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM test'
    );

    expect(count?.count).toBe(1000);

    await sourceDb.closeAsync();
    await targetDb.closeAsync();
  });

  test('should handle empty database', async () => {
    const sourceDb = await SQLite.openDatabaseAsync(':memory:');

    const sqlDump = await dumpDatabase(sourceDb);
    const targetDb = await SQLite.openDatabaseAsync(':memory:');
    await importDatabase(targetDb, sqlDump);

    // Should not throw, just create empty database
    const tables = await targetDb.getAllAsync("SELECT name FROM sqlite_master WHERE type='table'");
    expect(tables).toHaveLength(0);

    await sourceDb.closeAsync();
    await targetDb.closeAsync();
  });

  test('should handle database with only empty tables', async () => {
    const sourceDb = await SQLite.openDatabaseAsync(':memory:');
    await sourceDb.execAsync('CREATE TABLE empty1 (id INTEGER)');
    await sourceDb.execAsync('CREATE TABLE empty2 (name TEXT)');

    const sqlDump = await dumpDatabase(sourceDb);
    const targetDb = await SQLite.openDatabaseAsync(':memory:');
    await importDatabase(targetDb, sqlDump);

    const tables = await targetDb.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );

    expect(tables).toHaveLength(2);
    expect(tables[0].name).toBe('empty1');
    expect(tables[1].name).toBe('empty2');

    await sourceDb.closeAsync();
    await targetDb.closeAsync();
  });
});

describe('sqliteDump - Import Error Handling', () => {
  test('should handle invalid SQL gracefully', async () => {
    const targetDb = await SQLite.openDatabaseAsync(':memory:');
    const invalidSQL = 'THIS IS NOT VALID SQL;';

    // Should not throw, but log warnings
    await importDatabase(targetDb, invalidSQL);

    await targetDb.closeAsync();
  });

  test('should handle SQL with comments', async () => {
    const targetDb = await SQLite.openDatabaseAsync(':memory:');
    const sqlWithComments = `
      -- This is a comment
      CREATE TABLE test (id INTEGER);
      -- Another comment
      INSERT INTO test VALUES (1);
    `;

    await importDatabase(targetDb, sqlWithComments);

    const rows = await targetDb.getAllAsync('SELECT * FROM test');
    expect(rows).toHaveLength(1);

    await targetDb.closeAsync();
  });

  test('should handle multi-line statements', async () => {
    const targetDb = await SQLite.openDatabaseAsync(':memory:');
    const multilineSQL = `
      CREATE TABLE test (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        age INTEGER
      );
      INSERT INTO test (id, name, age)
      VALUES (1, 'Alice', 30);
    `;

    await importDatabase(targetDb, multilineSQL);

    const rows = await targetDb.getAllAsync('SELECT * FROM test');
    expect(rows).toHaveLength(1);

    await targetDb.closeAsync();
  });
});

describe('sqliteDump - Complex Schema Roundtrip', () => {
  test('should preserve composite primary keys', async () => {
    const sourceDb = await SQLite.openDatabaseAsync(':memory:');
    await sourceDb.execAsync(`
      CREATE TABLE test (
        a INTEGER,
        b INTEGER,
        value TEXT,
        PRIMARY KEY (a, b)
      )
    `);
    await sourceDb.runAsync('INSERT INTO test VALUES (?, ?, ?)', [1, 1, 'first']);
    await sourceDb.runAsync('INSERT INTO test VALUES (?, ?, ?)', [1, 2, 'second']);

    const sqlDump = await dumpDatabase(sourceDb);
    const targetDb = await SQLite.openDatabaseAsync(':memory:');
    await importDatabase(targetDb, sqlDump);

    const rows = await targetDb.getAllAsync('SELECT * FROM test ORDER BY a, b');
    expect(rows).toHaveLength(2);

    await sourceDb.closeAsync();
    await targetDb.closeAsync();
  });

  test('should preserve unique constraints', async () => {
    const sourceDb = await SQLite.openDatabaseAsync(':memory:');
    await sourceDb.execAsync('CREATE TABLE test (email TEXT UNIQUE)');
    await sourceDb.runAsync('INSERT INTO test VALUES (?)', ['test@example.com']);

    const sqlDump = await dumpDatabase(sourceDb);
    const targetDb = await SQLite.openDatabaseAsync(':memory:');
    await importDatabase(targetDb, sqlDump);

    // Try to insert duplicate - should fail
    let error = null;
    try {
      await targetDb.runAsync('INSERT INTO test VALUES (?)', ['test@example.com']);
    } catch (err) {
      error = err;
    }

    expect(error).not.toBeNull();

    await sourceDb.closeAsync();
    await targetDb.closeAsync();
  });
});

describe('sqliteDump - SQL Identifier Quoting', () => {
  test('should handle simple alphanumeric identifiers', async () => {
    const db = await SQLite.openDatabaseAsync(':memory:');
    await db.execAsync('CREATE TABLE simple_table (id INTEGER, name TEXT)');
    const dump = await dumpDatabase(db);

    expect(dump).toContain('CREATE TABLE IF NOT EXISTS simple_table');
    await db.closeAsync();
  });

  test('should quote identifiers with special characters', async () => {
    const db = await SQLite.openDatabaseAsync(':memory:');
    await db.execAsync('CREATE TABLE "table-with-dash" (id INTEGER)');
    const dump = await dumpDatabase(db);

    expect(dump).toContain('"table-with-dash"');
    await db.closeAsync();
  });

  test('should quote SQL keyword identifiers', async () => {
    const db = await SQLite.openDatabaseAsync(':memory:');
    await db.execAsync('CREATE TABLE "select" (id INTEGER)');
    const dump = await dumpDatabase(db);

    expect(dump).toContain('"select"');
    await db.closeAsync();
  });

  test('should handle column names that are keywords', async () => {
    const db = await SQLite.openDatabaseAsync(':memory:');
    await db.execAsync('CREATE TABLE test ("order" INTEGER, "from" TEXT)');
    const dump = await dumpDatabase(db);

    expect(dump).toContain('"order"');
    expect(dump).toContain('"from"');
    await db.closeAsync();
  });
});

describe('sqliteDump - String Value Escaping', () => {
  test('should escape single quotes in text', async () => {
    const db = await SQLite.openDatabaseAsync(':memory:');
    await db.execAsync('CREATE TABLE test (text TEXT)');
    await db.runAsync('INSERT INTO test (text) VALUES (?)', ["It's a test"]);
    const dump = await dumpDatabase(db);

    expect(dump).toContain("It''s a test");
    await db.closeAsync();
  });

  test('should handle newlines in text', async () => {
    const db = await SQLite.openDatabaseAsync(':memory:');
    await db.execAsync('CREATE TABLE test (text TEXT)');
    await db.runAsync('INSERT INTO test (text) VALUES (?)', ['Line 1\nLine 2']);
    const dump = await dumpDatabase(db);

    // Should use replace() function for newlines
    expect(dump).toContain('replace(');
    expect(dump).toContain('char(10)');
    await db.closeAsync();
  });

  test('should handle carriage returns in text', async () => {
    const db = await SQLite.openDatabaseAsync(':memory:');
    await db.execAsync('CREATE TABLE test (text TEXT)');
    await db.runAsync('INSERT INTO test (text) VALUES (?)', ['Line 1\rLine 2']);
    const dump = await dumpDatabase(db);

    // Should use replace() function for carriage returns
    expect(dump).toContain('replace(');
    expect(dump).toContain('char(13)');
    await db.closeAsync();
  });

  test('should handle both newlines and carriage returns', async () => {
    const db = await SQLite.openDatabaseAsync(':memory:');
    await db.execAsync('CREATE TABLE test (text TEXT)');
    await db.runAsync('INSERT INTO test (text) VALUES (?)', ['Line 1\r\nLine 2']);
    const dump = await dumpDatabase(db);

    expect(dump).toContain('replace(');
    expect(dump).toContain('char(10)');
    expect(dump).toContain('char(13)');
    await db.closeAsync();
  });
});

describe('sqliteDump - Data Type Handling', () => {
  test('should handle INTEGER values', async () => {
    const db = await SQLite.openDatabaseAsync(':memory:');
    await db.execAsync('CREATE TABLE test (num INTEGER)');
    await db.runAsync('INSERT INTO test (num) VALUES (?)', [42]);
    await db.runAsync('INSERT INTO test (num) VALUES (?)', [-100]);
    await db.runAsync('INSERT INTO test (num) VALUES (?)', [0]);
    const dump = await dumpDatabase(db);

    expect(dump).toContain('42');
    expect(dump).toContain('-100');
    expect(dump).toContain('0');
    await db.closeAsync();
  });

  test('should handle FLOAT values', async () => {
    const db = await SQLite.openDatabaseAsync(':memory:');
    await db.execAsync('CREATE TABLE test (num REAL)');
    await db.runAsync('INSERT INTO test (num) VALUES (?)', [3.14159]);
    await db.runAsync('INSERT INTO test (num) VALUES (?)', [-2.5]);
    const dump = await dumpDatabase(db);

    // Float precision may vary, just check the value is present in some form
    expect(dump).toMatch(/3\.141\d+/);
    expect(dump).toMatch(/-2\.5/);
    await db.closeAsync();
  });

  test('should handle NULL values', async () => {
    const db = await SQLite.openDatabaseAsync(':memory:');
    await db.execAsync('CREATE TABLE test (value TEXT)');
    await db.runAsync('INSERT INTO test (value) VALUES (?)', [null]);
    const dump = await dumpDatabase(db);

    expect(dump).toContain('NULL');
    await db.closeAsync();
  });

  test('should handle TEXT values', async () => {
    const db = await SQLite.openDatabaseAsync(':memory:');
    await db.execAsync('CREATE TABLE test (text TEXT)');
    await db.runAsync('INSERT INTO test (text) VALUES (?)', ['Hello, World!']);
    await db.runAsync('INSERT INTO test (text) VALUES (?)', ['']);
    const dump = await dumpDatabase(db);

    expect(dump).toContain("'Hello, World!'");
    expect(dump).toContain("''");
    await db.closeAsync();
  });

  test('should handle BLOB values', async () => {
    const db = await SQLite.openDatabaseAsync(':memory:');
    await db.execAsync('CREATE TABLE test (data BLOB)');
    const blobData = new Uint8Array([0x01, 0x02, 0xff, 0xab]);
    await db.runAsync('INSERT INTO test (data) VALUES (?)', [blobData]);
    const dump = await dumpDatabase(db);

    // BLOB should be hex encoded
    expect(dump).toContain("x'0102ffab'");
    await db.closeAsync();
  });
});

describe('sqliteDump - Table Features', () => {
  test('should handle empty tables', async () => {
    const db = await SQLite.openDatabaseAsync(':memory:');
    await db.execAsync('CREATE TABLE empty (id INTEGER)');
    const dump = await dumpDatabase(db);

    expect(dump).toContain('CREATE TABLE IF NOT EXISTS empty');
    // Should not contain any INSERT statements
    expect(dump).not.toMatch(/INSERT INTO empty/);
    await db.closeAsync();
  });

  test('should handle multiple tables', async () => {
    const db = await SQLite.openDatabaseAsync(':memory:');
    await db.execAsync('CREATE TABLE users (id INTEGER, name TEXT)');
    await db.execAsync('CREATE TABLE posts (id INTEGER, user_id INTEGER)');
    const dump = await dumpDatabase(db);

    expect(dump).toContain('CREATE TABLE IF NOT EXISTS users');
    expect(dump).toContain('CREATE TABLE IF NOT EXISTS posts');
    await db.closeAsync();
  });

  test('should handle INTEGER PRIMARY KEY (rowid alias)', async () => {
    const db = await SQLite.openDatabaseAsync(':memory:');
    await db.execAsync('CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)');
    await db.runAsync('INSERT INTO test (name) VALUES (?)', ['Alice']);
    const dump = await dumpDatabase(db);

    // Should preserve the auto-generated rowid
    expect(dump).toContain('INSERT INTO test');
    await db.closeAsync();
  });

  test('should handle composite primary keys', async () => {
    const db = await SQLite.openDatabaseAsync(':memory:');
    await db.execAsync('CREATE TABLE test (a INTEGER, b INTEGER, PRIMARY KEY (a, b))');
    await db.runAsync('INSERT INTO test (a, b) VALUES (?, ?)', [1, 2]);
    const dump = await dumpDatabase(db);

    expect(dump).toContain('CREATE TABLE IF NOT EXISTS test');
    expect(dump).toContain('INSERT INTO test');
    expect(dump).toContain('1');
    expect(dump).toContain('2');
    await db.closeAsync();
  });

  test('should handle indexes', async () => {
    const db = await SQLite.openDatabaseAsync(':memory:');
    await db.execAsync('CREATE TABLE test (id INTEGER, name TEXT)');
    await db.execAsync('CREATE INDEX idx_name ON test(name)');
    const dump = await dumpDatabase(db);

    expect(dump).toContain('CREATE INDEX idx_name ON test(name)');
    await db.closeAsync();
  });
});

describe('sqliteDump - Special Cases', () => {
  test('should wrap dump in transaction with foreign_keys=OFF', async () => {
    const db = await SQLite.openDatabaseAsync(':memory:');
    await db.execAsync('CREATE TABLE test (id INTEGER)');
    const dump = await dumpDatabase(db);

    expect(dump).toContain('PRAGMA foreign_keys=OFF;');
    expect(dump).toContain('BEGIN TRANSACTION;');
    expect(dump).toContain('COMMIT;');
    await db.closeAsync();
  });

  test('should use CREATE TABLE IF NOT EXISTS', async () => {
    const db = await SQLite.openDatabaseAsync(':memory:');
    await db.execAsync('CREATE TABLE test (id INTEGER)');
    const dump = await dumpDatabase(db);

    expect(dump).toContain('CREATE TABLE IF NOT EXISTS');
    await db.closeAsync();
  });

  test('should handle tables with all column types', async () => {
    const db = await SQLite.openDatabaseAsync(':memory:');
    await db.execAsync(`
      CREATE TABLE all_types (
        id INTEGER PRIMARY KEY,
        int_col INTEGER,
        real_col REAL,
        text_col TEXT,
        blob_col BLOB,
        null_col TEXT
      )
    `);
    await db.runAsync(
      'INSERT INTO all_types (int_col, real_col, text_col, blob_col, null_col) VALUES (?, ?, ?, ?, ?)',
      [42, 3.14, 'test', new Uint8Array([0x01, 0x02]), null]
    );
    const dump = await dumpDatabase(db);

    expect(dump).toContain('42');
    expect(dump).toMatch(/3\.14/);
    expect(dump).toContain("'test'");
    expect(dump).toContain("x'0102'");
    expect(dump).toContain('NULL');
    await db.closeAsync();
  });
});
