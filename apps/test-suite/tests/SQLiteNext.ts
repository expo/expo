import { Asset } from 'expo-asset';
import * as FS from 'expo-file-system';
import * as SQLite from 'expo-sqlite/next';

export const name = 'SQLiteNext';

// The version here needs to be the same as both the podspec and build.gradle for expo-sqlite
const VERSION = '3.42.0';

interface UserEntity {
  name: string;
  k: number;
  j: number;
}

export function test({ describe, expect, it, beforeEach, afterEach, ...t }) {
  describe('Basic tests', () => {
    it('should be able to drop + create a table, insert, query', async () => {
      const db = await SQLite.openDatabaseAsync(':memory:');
      await db.execAsync(`
DROP TABLE IF EXISTS Users;
CREATE TABLE IF NOT EXISTS Users (user_id INTEGER PRIMARY KEY NOT NULL, name VARCHAR(64), k INT, j REAL);
`);
      const statement = await db.prepareAsync('INSERT INTO Users (name, k, j) VALUES (?, ?, ?)');
      await statement.runAsync('Tim Duncan', 1, 23.4);
      await statement.runAsync(['Manu Ginobili', 5, 72.8]);
      await statement.runAsync(['Nikhilesh Sigatapu', 7, 42.14]);

      const results = await db.allAsync<UserEntity>('SELECT * FROM Users');
      expect(results.length).toBe(3);
      expect(results[0].j).toBeCloseTo(23.4);
      await statement.finalizeAsync();
      await db.closeAsync();
    });

    it(`should use specified SQLite version: ${VERSION}`, async () => {
      const db = await SQLite.openDatabaseAsync(':memory:');
      const row = await db.getAsync<{ 'sqlite_version()': string }>('SELECT sqlite_version()');
      expect(row['sqlite_version()']).toEqual(VERSION);
      await db.closeAsync();
    });

    it('unixepoch() is supported', async () => {
      const db = await SQLite.openDatabaseAsync(':memory:');
      const row = await db.getAsync<{ 'unixepoch()': number }>('SELECT unixepoch()');
      expect(row['unixepoch()']).toBeTruthy();
      await db.closeAsync();
    });

    it('should support PRAGMA statements', async () => {
      const db = await SQLite.openDatabaseAsync(':memory:');
      await db.execAsync(`
DROP TABLE IF EXISTS SomeTable;
CREATE TABLE IF NOT EXISTS SomeTable (id INTEGER PRIMARY KEY NOT NULL, name VARCHAR(64));
`);

      const results = await db.allAsync<any>('PRAGMA table_info(SomeTable)');
      expect(results.length).toBe(2);
      expect(results[0].name).toBe('id');
      expect(results[1].name).toBe('name');

      // a no-result pragma
      await db.runAsync('PRAGMA case_sensitive_like = true');

      // a setter/getter pragma
      await db.runAsync('PRAGMA user_version = 123');
      const info = await db.getAsync<any>('PRAGMA user_version');
      expect(info.user_version).toBe(123);

      await db.closeAsync();
    });
  });

  describe('File system tests', () => {
    it('should work with a downloaded .db file', async () => {
      await FS.downloadAsync(
        Asset.fromModule(require('../assets/asset-db.db')).uri,
        `${FS.documentDirectory}SQLite/downloaded.db`
      );

      const db = await SQLite.openDatabaseAsync('downloaded.db');
      const results = await db.allAsync<UserEntity>('SELECT * FROM Users');
      expect(results.length).toEqual(3);
      expect(results[0].j).toBeCloseTo(23.4);
      await db.closeAsync();
    }, 30000);

    it('should create and delete a database in file system', async () => {
      const db = await SQLite.openDatabaseAsync('test.db');
      await db.execAsync(`
DROP TABLE IF EXISTS Users;
CREATE TABLE IF NOT EXISTS Users (user_id INTEGER PRIMARY KEY NOT NULL, name VARCHAR(64), k INT, j REAL);
`);
      await db.closeAsync();

      let fileInfo = await FS.getInfoAsync(`${FS.documentDirectory}SQLite/test.db`);
      expect(fileInfo.exists).toBeTruthy();

      await SQLite.deleteDatabaseAsync('test.db');
      fileInfo = await FS.getInfoAsync(`${FS.documentDirectory}SQLite/test.db`);
      expect(fileInfo.exists).toBeFalsy();
    });

    it('should be able to recreate db from scratch by deleting file', async () => {
      let db = await SQLite.openDatabaseAsync('test.db');
      await db.execAsync(`
DROP TABLE IF EXISTS Users;
CREATE TABLE IF NOT EXISTS Users (user_id INTEGER PRIMARY KEY NOT NULL, name VARCHAR(64), k INT, j REAL);
INSERT INTO Users (name, k, j) VALUES ('Tim Duncan', 1, 23.4);
`);
      let results = await db.allAsync<UserEntity>('SELECT * FROM Users');
      expect(results.length).toBe(1);
      await db.closeAsync();

      let fileInfo = await FS.getInfoAsync(`${FS.documentDirectory}SQLite/test.db`);
      expect(fileInfo.exists).toBeTruthy();
      await FS.deleteAsync(`${FS.documentDirectory}SQLite/test.db`);
      fileInfo = await FS.getInfoAsync(`${FS.documentDirectory}SQLite/test.db`);
      expect(fileInfo.exists).toBeFalsy();

      db = await SQLite.openDatabaseAsync('test.db');
      await db.execAsync(`
      DROP TABLE IF EXISTS Users;
      CREATE TABLE IF NOT EXISTS Users (user_id INTEGER PRIMARY KEY NOT NULL, name VARCHAR(64), k INT, j REAL);
      `);
      results = await db.allAsync<UserEntity>('SELECT * FROM Users');
      expect(results.length).toBe(0);
      await db.runAsync('INSERT INTO Users (name, k, j) VALUES (?, ?, ?)', 'Tim Duncan', 1, 23.4);
      results = await db.allAsync<UserEntity>('SELECT * FROM Users');
      expect(results.length).toBe(1);

      await db.closeAsync();
    });
  });

  describe('Statements', () => {
    it('should maintain correct type of potentialy null bind parameters', async () => {
      const db = await SQLite.openDatabaseAsync(':memory:');
      await db.execAsync(`
DROP TABLE IF EXISTS Nulling;
CREATE TABLE IF NOT EXISTS Nulling (id INTEGER PRIMARY KEY NOT NULL, x NUMERIC, y NUMERIC);
`);
      await db.runAsync('INSERT INTO Nulling (x, y) VALUES (?, ?)', [null, null]);
      const statement = await db.prepareAsync('INSERT INTO Nulling (x, y) VALUES (?, ?)');
      statement.runAsync(null, null);
      statement.finalizeAsync();

      const results = await db.allAsync<{ x: number | null; y: number | null }>(
        'SELECT * FROM Nulling'
      );
      expect(results[0].x).toBeNull();
      expect(results[0].y).toBeNull();
      expect(results[1].x).toBeNull();
      expect(results[1].y).toBeNull();

      await db.closeAsync();
    });

    it('should support the `RETURNING` clause', async () => {
      const db = await SQLite.openDatabaseAsync(':memory:');
      await db.execAsync(`
DROP TABLE IF EXISTS customers;
CREATE TABLE customers (id PRIMARY KEY NOT NULL, name VARCHAR(255),email VARCHAR(255));
`);

      let statement = await db.prepareAsync(
        'INSERT INTO customers (id, name, email) VALUES (?, ?, ?) RETURNING name, email'
      );
      let result = await statement.getAsync<any>(1, 'John Doe', 'john@example.com');
      await statement.finalizeAsync();
      expect(result.email).toBe('john@example.com');
      expect(result.name).toBe('John Doe');

      statement = await db.prepareAsync(
        'UPDATE customers SET name=$name, email=$email WHERE id=$id RETURNING name, email'
      );
      result = await statement.getAsync<any>({
        $id: 1,
        $name: 'Jane Doe',
        $email: 'jane@example.com',
      });
      await statement.finalizeAsync();
      expect(result.email).toBe('jane@example.com');
      expect(result.name).toBe('Jane Doe');

      statement = await db.prepareAsync('DELETE from customers WHERE id=? RETURNING name, email');
      result = await statement.getAsync<any>(1);
      await statement.finalizeAsync();
      expect(result.email).toBe('jane@example.com');
      expect(result.name).toBe('Jane Doe');
    });

    it('runAsync should return changes in RunResult', async () => {
      const db = await SQLite.openDatabaseAsync(':memory:');
      await db.execAsync(`
DROP TABLE IF EXISTS Users;
CREATE TABLE IF NOT EXISTS Users (user_id INTEGER PRIMARY KEY NOT NULL, name VARCHAR(64));
`);

      await db.runAsync('INSERT INTO Users (name) VALUES (?), (?), (?)', [
        'name1',
        'name2',
        'name3',
      ]);
      let statement = await db.prepareAsync('DELETE FROM Users WHERE name=?');
      let result = await statement.runAsync('name1');
      expect(result.changes).toBe(1);
      await statement.finalizeAsync();

      statement = await db.prepareAsync('DELETE FROM Users WHERE name=? OR name=?');
      result = await statement.runAsync(['name2', 'name3']);
      expect(result.changes).toBe(2);
      await statement.finalizeAsync();

      // ensure deletion succeedeed
      expect((await db.allAsync('SELECT * FROM Users')).length).toBe(0);

      await db.closeAsync();
    });

    it('should return correct rowsAffected value when deleting cascade', async () => {
      const db = await SQLite.openDatabaseAsync(':memory:');
      await db.runAsync('PRAGMA foreign_keys = ON');
      await db.execAsync(`
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Posts;
CREATE TABLE IF NOT EXISTS Users (user_id INTEGER PRIMARY KEY NOT NULL, name VARCHAR(64));
CREATE TABLE IF NOT EXISTS Posts (post_id INTEGER PRIMARY KEY NOT NULL, content VARCHAR(64), userposted INTEGER, FOREIGN KEY(userposted) REFERENCES Users(user_id) ON DELETE CASCADE);
`);

      await db.runAsync('INSERT INTO Users (name) VALUES (?), (?), (?)', [
        'name1',
        'name2',
        'name3',
      ]);
      await db.runAsync('INSERT INTO Posts (content, userposted) VALUES (?, ?), (?, ?), (?, ?)', [
        'post1',
        1,
        'post2',
        1,
        'post3',
        2,
      ]);

      let statement = await db.prepareAsync('DELETE FROM Users WHERE name=?');
      let result = await statement.runAsync('name1');
      expect(result.changes).toBe(1);
      await statement.finalizeAsync();

      statement = await db.prepareAsync('DELETE FROM Users WHERE name=? OR name=?');
      result = await statement.runAsync(['name2', 'name3']);
      expect(result.changes).toBe(2);
      await statement.finalizeAsync();

      // ensure deletion succeedeed
      expect((await db.allAsync('SELECT * FROM Users')).length).toBe(0);
      expect((await db.allAsync('SELECT * FROM Posts')).length).toBe(0);

      await db.runAsync('PRAGMA foreign_keys = OFF');
      await db.closeAsync();
    });
  });

  describe('Statement parameters bindings', () => {
    let db: SQLite.Database;

    beforeEach(async () => {
      db = await SQLite.openDatabaseAsync(':memory:');
      await db.execAsync(`
DROP TABLE IF EXISTS Users;
CREATE TABLE IF NOT EXISTS Users (user_id INTEGER PRIMARY KEY NOT NULL, name VARCHAR(64), k INT, j REAL);
INSERT INTO Users (user_id, name, k, j) VALUES (1, 'Tim Duncan', 1, 23.4);
INSERT INTO Users (user_id, name, k, j) VALUES (2, 'Manu Ginobili', 5, 72.8);
INSERT INTO Users (user_id, name, k, j) VALUES (3, 'Nikhilesh Sigatapu', 7, 42.14);
`);
    });
    afterEach(async () => {
      await db.closeAsync();
    });

    it('should support async iterator', async () => {
      const results: UserEntity[] = [];
      const statement = await db.prepareAsync('SELECT * FROM Users ORDER BY user_id DESC');
      for await (const row of statement.eachAsync<UserEntity>()) {
        results.push(row);
      }
      await statement.finalizeAsync();
      expect(results.length).toBe(3);
      expect(results[0].name).toBe('Nikhilesh Sigatapu');
      expect(results[1].name).toBe('Manu Ginobili');
      expect(results[2].name).toBe('Tim Duncan');
    });

    it('should support variadic unnamed parameter binding', async () => {
      const statement = await db.prepareAsync('SELECT * FROM Users WHERE name = ? AND k = ?');
      expect(await statement.getAsync<UserEntity>('Tim Duncan', 1)).not.toBeNull();
      expect(await statement.getAsync<UserEntity>('Tim Duncan', -1)).toBeNull();
      await statement.finalizeAsync();
    });

    it('should support array unnamed parameter binding', async () => {
      const statement = await db.prepareAsync('SELECT * FROM Users WHERE name = ? AND k = ?');
      expect(await statement.getAsync<UserEntity>(['Tim Duncan', 1])).not.toBeNull();
      expect(await statement.getAsync<UserEntity>(['Tim Duncan', -1])).toBeNull();
      await statement.finalizeAsync();
    });

    it('should support array named parameter binding - $VVV', async () => {
      const statement = await db.prepareAsync('SELECT * FROM Users WHERE name = $name AND k = $k');
      expect(await statement.getAsync<UserEntity>({ $name: 'Tim Duncan', $k: 1 })).not.toBeNull();
      expect(await statement.getAsync<UserEntity>({ $name: 'Tim Duncan', $k: -1 })).toBeNull();
      await statement.finalizeAsync();
    });

    it('should support array named parameter binding - :VVV', async () => {
      const statement = await db.prepareAsync('SELECT * FROM Users WHERE name = :name AND k = :k');
      expect(
        await statement.getAsync<UserEntity>({ ':name': 'Tim Duncan', ':k': 1 })
      ).not.toBeNull();
      expect(await statement.getAsync<UserEntity>({ ':name': 'Tim Duncan', ':k': -1 })).toBeNull();
      await statement.finalizeAsync();
    });

    it('should support array named parameter binding - @VVV', async () => {
      const statement = await db.prepareAsync('SELECT * FROM Users WHERE name = @name AND k = @k');
      expect(
        await statement.getAsync<UserEntity>({ '@name': 'Tim Duncan', '@k': 1 })
      ).not.toBeNull();
      expect(await statement.getAsync<UserEntity>({ '@name': 'Tim Duncan', '@k': -1 })).toBeNull();
      await statement.finalizeAsync();
    });
  });

  describe('transactionAsync', () => {
    let db: SQLite.Database;

    afterEach(async () => {
      await db.closeAsync();
    });

    it('should support async transaction', async () => {
      db = await SQLite.openDatabaseAsync(':memory:');
      await db.execAsync(`
DROP TABLE IF EXISTS Users;
CREATE TABLE IF NOT EXISTS Users (user_id INTEGER PRIMARY KEY NOT NULL, name VARCHAR(64));
`);

      async function fakeUserFetcher(userID) {
        switch (userID) {
          case 1: {
            return Promise.resolve('Tim Duncan');
          }
          case 2: {
            return Promise.resolve('Manu Ginobili');
          }
          case 3: {
            return Promise.resolve('Nikhilesh Sigatapu');
          }
          default: {
            return null;
          }
        }
      }

      const userName = await fakeUserFetcher(1);
      await db.transactionAsync(async () => {
        await db.runAsync('INSERT INTO Users (name) VALUES (?)', [userName]);
        const result = await db.getAsync<UserEntity>('SELECT * FROM Users LIMIT 1');
        expect(result.name).toEqual('Tim Duncan');
      });
    });

    it('should support Promise.all', async () => {
      db = await SQLite.openDatabaseAsync(':memory:');
      await db.execAsync(`
DROP TABLE IF EXISTS Users;
CREATE TABLE IF NOT EXISTS Users (user_id INTEGER PRIMARY KEY NOT NULL, name VARCHAR(64));
`);

      await db.transactionAsync(async () => {
        const statement = await db.prepareAsync('INSERT INTO Users (name) VALUES (?)');
        await Promise.all([
          statement.runAsync('aaa'),
          statement.runAsync(['bbb']),
          statement.runAsync('ccc'),
        ]);

        const result = await db.getAsync<any>('SELECT COUNT(*) FROM Users');
        expect(result['COUNT(*)']).toEqual(3);
      });
    });

    it('should rollback transaction when exception happens inside a transaction', async () => {
      db = await SQLite.openDatabaseAsync(':memory:');
      await db.execAsync(`
DROP TABLE IF EXISTS Users;
CREATE TABLE IF NOT EXISTS Users (user_id INTEGER PRIMARY KEY NOT NULL, name VARCHAR(64));
`);

      await db.runAsync('INSERT INTO Users (name) VALUES (?)', ['aaa']);
      expect((await db.getAsync<any>('SELECT COUNT(*) FROM Users'))['COUNT(*)']).toBe(1);

      let error = null;
      try {
        await db.transactionAsync(async () => {
          await db.runAsync('INSERT INTO Users (name) VALUES (?)', ['bbb']);
          await db.runAsync('INSERT INTO Users (name) VALUES (?)', ['ccc']);
          // exeuting invalid sql statement will throw an exception
          await db.runAsync('INSERT2');
        });
      } catch (e) {
        error = e;
      }
      expect(error).not.toBeNull();

      expect((await db.getAsync<any>('SELECT COUNT(*) FROM Users'))['COUNT(*)']).toBe(1);
    });

    it('transactionAsync could possibly have other async queries interrupted inside the transaction', async () => {
      db = await SQLite.openDatabaseAsync('test.db');
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

      let error = null;
      try {
        await Promise.all([promise1, promise2]);
      } catch (e) {
        error = e;
      }
      expect(error.toString()).toMatch(/Exception from promise1: Expected aaa but received bbb/);
    });

    it('transactionExclusiveAsync should execute a transaction atomically and abort other write query', async () => {
      db = await SQLite.openDatabaseAsync('test.db');
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

      let error = null;
      try {
        await Promise.all([promise1, promise2]);
      } catch (e) {
        error = e;
      }

      expect(error.toString()).toMatch(/Exception from promise2:[\s\S]*database is locked/);

      // We still need to wait for promise1 to finish for promise1 to finalize the transaction.
      await promise1;
    });
  });

  describe('Synchronous calls', () => {
    let db: SQLite.Database | null = null;

    beforeEach(() => {
      db = SQLite.openDatabaseSync(':memory:');
      db.execSync(`
DROP TABLE IF EXISTS Users;
CREATE TABLE IF NOT EXISTS Users (user_id INTEGER PRIMARY KEY NOT NULL, name VARCHAR(64), k INT, j REAL);
INSERT INTO Users (user_id, name, k, j) VALUES (1, 'Tim Duncan', 1, 23.4);
INSERT INTO Users (user_id, name, k, j) VALUES (2, 'Manu Ginobili', 5, 72.8);
INSERT INTO Users (user_id, name, k, j) VALUES (3, 'Nikhilesh Sigatapu', 7, 42.14);
`);
    });

    afterEach(() => {
      db?.closeSync();
    });

    it('Basic CRUD', () => {
      const result = db.runSync('INSERT INTO Users (name, k, j) VALUES (?, ?, ?)', 'aaa', 1, 2.3);
      expect(result.changes).toBe(1);
      expect(result.lastInsertRowid > 0).toBeTruthy();
      expect(db.allSync<UserEntity>('SELECT * FROM Users').length).toBe(4);
      expect(db.getSync<UserEntity>('SELECT * FROM Users WHERE name = ?', 'aaa')).not.toBeNull();

      db.runSync('UPDATE Users SET name = ? WHERE name = ?', 'bbb', 'aaa');
      expect(db.getSync<UserEntity>('SELECT * FROM Users WHERE name = ?', 'aaa')).toBeNull();
      expect(db.getSync<UserEntity>('SELECT * FROM Users WHERE name = ?', 'bbb')).not.toBeNull();

      db.runSync('DELETE FROM Users WHERE name = ?', 'bbb');
      expect(db.getSync<UserEntity>('SELECT * FROM Users WHERE name = ?', 'bbb')).toBeNull();
      expect(db.allSync<UserEntity>('SELECT * FROM Users').length).toBe(3);
    });

    it('eachSync should return iterable', () => {
      const results: UserEntity[] = [];
      const statement = db.prepareSync('SELECT * FROM Users ORDER BY user_id DESC');
      for (const row of statement.eachSync<UserEntity>()) {
        results.push(row);
      }
      statement.finalizeSync();
      expect(results.length).toBe(3);
      expect(results[0].name).toBe('Nikhilesh Sigatapu');
      expect(results[1].name).toBe('Manu Ginobili');
      expect(results[2].name).toBe('Tim Duncan');
    });

    it('transactionSync should commit changes', () => {
      db.transactionSync(() => {
        db?.runSync('INSERT INTO Users (name, k, j) VALUES (?, ?, ?)', 'aaa', 1, 2.3);
      });
      const results = db.allSync<UserEntity>('SELECT * FROM Users');
      expect(results.length).toBe(4);
    });

    it('transactionSync should rollback changes when exceptions happen', () => {
      expect(() => {
        db?.transactionSync(() => {
          db?.runSync('DELETE FROM Users');
          throw new Error('Exception inside transaction');
        });
      }).toThrow();

      const results = db.allSync<UserEntity>('SELECT * FROM Users');
      expect(results.length > 0).toBe(true);
    });
  });

  describe('CR-SQLite', () => {
    it('should load crsqlite extension correctly', async () => {
      const db = await SQLite.openDatabaseAsync('test.db', { enableCRSQLite: true });
      await db.execAsync(`
DROP TABLE IF EXISTS foo;
CREATE TABLE foo (a INTEGER PRIMARY KEY NOT NULL, b INTEGER);
`);

      await db.getAsync(`SELECT crsql_as_crr("foo")`);
      await db.runAsync('INSERT INTO foo (a, b) VALUES (?, ?)', 1, 2);
      await db.runAsync('INSERT INTO foo (a, b) VALUES (?, ?)', [3, 4]);
      const result = await db.getAsync<any>(`SELECT * FROM crsql_changes`);
      expect(result.table).toEqual('foo');
      expect(result.val).toEqual(2);

      await db.closeAsync();
      await SQLite.deleteDatabaseAsync('test.db');
    });
  });

  describe('onDatabaseChange', () => {
    it('should emit onDatabaseChange event when `enableChangeListener` is true', async () => {
      const db = await SQLite.openDatabaseAsync('test.db', { enableChangeListener: true });
      await db.execAsync(`
DROP TABLE IF EXISTS foo;
CREATE TABLE foo (a INTEGER PRIMARY KEY NOT NULL, b INTEGER);
`);

      const waitChangePromise = new Promise((resolve) => {
        SQLite.addDatabaseChangeListener(({ dbName, tableName, rowId }) => {
          expect(dbName).toEqual('test.db');
          expect(tableName).toEqual('foo');
          expect(rowId).toBeDefined();
          resolve(null);
        });
      });

      const delayedInsertPromise = new Promise((resolve) => setTimeout(resolve, 0)).then(() =>
        db.runAsync('INSERT INTO foo (a, b) VALUES (?, ?)', 1, 2)
      );

      await Promise.all([waitChangePromise, delayedInsertPromise]);

      await db.closeAsync();
    }, 10000);
  });
}

async function delayAsync(timeMs: number) {
  return new Promise((resolve) => setTimeout(resolve, timeMs));
}
