import { openDatabaseAsync, openDatabaseSync, type SQLiteDatabase } from './SQLiteDatabase';

/**
 * Update function for the [`setItemAsync()`](#setitemasynckey-value) or [`setItemSync()`](#setitemsynckey-value) method. It computes the new value based on the previous value. The function returns the new value to set for the key.
 * @param prevValue The previous value associated with the key, or `null` if the key was not set.
 * @returns The new value to set for the key.
 */
export type SQLiteStorageSetItemUpdateFunction = (prevValue: string | null) => string;

const DATABASE_VERSION = 1;
const STATEMENT_GET = 'SELECT value FROM storage WHERE key = ?;';
const STATEMENT_SET =
  'INSERT INTO storage (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value;';
const STATEMENT_REMOVE = 'DELETE FROM storage WHERE key = ?;';
const STATEMENT_GET_ALL_KEYS = 'SELECT key FROM storage;';
const STATEMENT_CLEAR = 'DELETE FROM storage;';

const MIGRATION_STATEMENT_0 =
  'CREATE TABLE IF NOT EXISTS storage (key TEXT PRIMARY KEY NOT NULL, value TEXT);';

/**
 * Key-value storage backed by SQLite. This class accepts a `databaseName` parameter in its constructor, which is the name of the database file to use for the storage.
 */
export class SQLiteStorage {
  private db: SQLiteDatabase | null = null;

  constructor(private readonly databaseName: string) {}

  //#region Asynchronous API

  /**
   * Retrieves the value associated with the given key asynchronously.
   */
  getItemAsync = async (key: string): Promise<string | null> => {
    const db = await this.getDbAsync();
    const result = await db.getFirstAsync<{ value: string }>(STATEMENT_GET, key);
    return result?.value ?? null;
  };

  /**
   * Sets the value for the given key asynchronously.
   * If a function is provided, it computes the new value based on the previous value.
   */
  setItemAsync = async (
    key: string,
    value: string | SQLiteStorageSetItemUpdateFunction
  ): Promise<void> => {
    const db = await this.getDbAsync();

    if (typeof value === 'function') {
      await db.withExclusiveTransactionAsync(async (tx) => {
        const prevResult = await tx.getFirstAsync<{ value: string }>(STATEMENT_GET, key);
        const prevValue = prevResult?.value ?? null;
        const nextValue = value(prevValue);
        await tx.runAsync(STATEMENT_SET, key, nextValue);
      });
      return;
    }

    await db.runAsync(STATEMENT_SET, key, value);
  };

  /**
   * Removes the value associated with the given key asynchronously.
   */
  removeItemAsync = async (key: string): Promise<boolean> => {
    const db = await this.getDbAsync();
    const result = await db.runAsync(STATEMENT_REMOVE, key);
    return result.changes > 0;
  };

  /**
   * Retrieves all keys stored in the storage asynchronously.
   */
  getAllKeysAsync = async (): Promise<string[]> => {
    const db = await this.getDbAsync();
    const result = await db.getAllAsync<{ key: string }>(STATEMENT_GET_ALL_KEYS);
    return result.map(({ key }) => key);
  };

  /**
   * Clears all key-value pairs from the storage asynchronously.
   */
  clearAsync = async (): Promise<boolean> => {
    const db = await this.getDbAsync();
    const result = await db.runAsync(STATEMENT_CLEAR);
    return result.changes > 0;
  };

  /**
   * Closes the database connection asynchronously.
   */
  closeAsync = async (): Promise<void> => {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  };

  //#endregion

  //#region Synchronous API

  /**
   * Retrieves the value associated with the given key synchronously.
   */
  getItemSync = (key: string): string | null => {
    const db = this.getDbSync();
    const result = db.getFirstSync<{ value: string }>(STATEMENT_GET, key);
    return result?.value ?? null;
  };

  /**
   * Sets the value for the given key synchronously.
   * If a function is provided, it computes the new value based on the previous value.
   */
  setItemSync = (key: string, value: string | SQLiteStorageSetItemUpdateFunction): void => {
    const db = this.getDbSync();

    if (typeof value === 'function') {
      db.withTransactionSync(() => {
        const prevResult = db.getFirstSync<{ value: string }>(STATEMENT_GET, key);
        const prevValue = prevResult?.value ?? null;
        const nextValue = value(prevValue);
        db.runSync(STATEMENT_SET, key, nextValue);
      });
      return;
    }

    db.runSync(STATEMENT_SET, key, value);
  };

  /**
   * Removes the value associated with the given key synchronously.
   */
  removeItemSync = (key: string): boolean => {
    const db = this.getDbSync();
    const result = db.runSync(STATEMENT_REMOVE, key);
    return result.changes > 0;
  };

  /**
   * Retrieves all keys stored in the storage synchronously.
   */
  getAllKeysSync = (): string[] => {
    const db = this.getDbSync();
    const result = db.getAllSync<{ key: string }>(STATEMENT_GET_ALL_KEYS);
    return result.map(({ key }) => key);
  };

  /**
   * Clears all key-value pairs from the storage synchronously.
   */
  clearSync = (): boolean => {
    const db = this.getDbSync();
    const result = db.runSync(STATEMENT_CLEAR);
    return result.changes > 0;
  };

  /**
   * Closes the database connection synchronously.
   */
  closeSync = (): void => {
    if (this.db) {
      this.db.closeSync();
      this.db = null;
    }
  };

  //#endregion

  //#region react-native-async-storage compatible API

  /**
   * Alias for [`getItemAsync()`](#getitemasynckey) method.
   */
  getItem = async (key: string): Promise<string | null> => {
    return this.getItemAsync(key);
  };

  /**
   * Alias for [`setItemAsync()`](#setitemasynckey-value).
   */
  setItem = async (
    key: string,
    value: string | SQLiteStorageSetItemUpdateFunction
  ): Promise<void> => {
    this.setItemAsync(key, value);
  };

  /**
   * Alias for [`removeItemAsync()`](#removeitemasynckey) method.
   */
  removeItem = async (key: string): Promise<void> => {
    this.removeItemAsync(key);
  };

  /**
   * Alias for [`getAllKeysAsync()`](#getallkeysasync) method.
   */
  getAllKeys = async (): Promise<string[]> => {
    return this.getAllKeysAsync();
  };

  /**
   * Alias for [`clearAsync()`](#clearasync) method.
   */
  clear = async (): Promise<void> => {
    this.clearAsync();
  };

  /**
   * Merges the given value with the existing value for the given key asynchronously.
   * If the existing value is a JSON object, performs a deep merge.
   */
  mergeItem = async (key: string, value: string): Promise<void> => {
    await this.setItemAsync(key, (prevValue) => {
      if (prevValue == null) {
        return value;
      }
      const prevJSON = JSON.parse(prevValue);
      const newJSON = JSON.parse(value);
      const mergedJSON = SQLiteStorage.mergeDeep(prevJSON, newJSON);
      return JSON.stringify(mergedJSON);
    });
  };

  /**
   * Retrieves the values associated with the given keys asynchronously.
   */
  multiGet = async (keys: string[]): Promise<[string, string | null][]> => {
    const db = await this.getDbAsync();
    let result: [string, string | null][] = [];
    await db.withExclusiveTransactionAsync(async (tx) => {
      result = await Promise.all(
        keys.map(async (key) => {
          const row = await tx.getFirstAsync<{ value: string }>(STATEMENT_GET, key);
          return [key, row?.value ?? null];
        })
      );
    });
    return result;
  };

  /**
   * Sets multiple key-value pairs asynchronously.
   */
  multiSet = async (keyValuePairs: [string, string][]): Promise<void> => {
    const db = await this.getDbAsync();
    await db.withExclusiveTransactionAsync(async (tx) => {
      for (const [key, value] of keyValuePairs) {
        await tx.runAsync(STATEMENT_SET, key, value);
      }
    });
  };

  /**
   * Removes the values associated with the given keys asynchronously.
   */
  multiRemove = async (keys: string[]): Promise<void> => {
    const db = await this.getDbAsync();
    await db.withExclusiveTransactionAsync(async (tx) => {
      for (const key of keys) {
        await tx.runAsync(STATEMENT_REMOVE, key);
      }
    });
  };

  /**
   * Merges multiple key-value pairs asynchronously.
   * If existing values are JSON objects, performs a deep merge.
   */
  multiMerge = async (keyValuePairs: [string, string][]): Promise<void> => {
    const db = await this.getDbAsync();
    await db.withExclusiveTransactionAsync(async (tx) => {
      for (const [key, value] of keyValuePairs) {
        const prevValue = await tx.getFirstAsync<{ value: string }>(STATEMENT_GET, key);
        if (prevValue == null) {
          await tx.runAsync(STATEMENT_SET, key, value);
          continue;
        }
        const prevJSON = JSON.parse(prevValue.value);
        const newJSON = JSON.parse(value);
        const mergedJSON = SQLiteStorage.mergeDeep(prevJSON, newJSON);
        await tx.runAsync(STATEMENT_SET, key, JSON.stringify(mergedJSON));
      }
    });
  };

  /**
   * Alias for [`closeAsync()`](#closeasync-1) method.
   */
  close = async (): Promise<void> => {
    this.closeAsync();
  };

  //#endregion

  //#region Internals

  private async getDbAsync(): Promise<SQLiteDatabase> {
    if (!this.db) {
      const db = await openDatabaseAsync(this.databaseName);
      await this.maybeMigrateDbAsync(db);
      this.db = db;
    }
    return this.db;
  }

  private getDbSync(): SQLiteDatabase {
    if (!this.db) {
      const db = openDatabaseSync(this.databaseName);
      this.maybeMigrateDbSync(db);
      this.db = db;
    }
    return this.db;
  }

  private async maybeMigrateDbAsync(db: SQLiteDatabase) {
    await db.withExclusiveTransactionAsync(async (tx) => {
      const result = await tx.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
      let currentDbVersion = result?.user_version ?? 0;
      if (currentDbVersion >= DATABASE_VERSION) {
        return;
      }
      if (currentDbVersion === 0) {
        await tx.execAsync(MIGRATION_STATEMENT_0);
        currentDbVersion = 1;
      }
      await tx.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
    });
  }

  private maybeMigrateDbSync(db: SQLiteDatabase) {
    db.withTransactionSync(() => {
      const result = db.getFirstSync<{ user_version: number }>('PRAGMA user_version');
      let currentDbVersion = result?.user_version ?? 0;
      if (currentDbVersion >= DATABASE_VERSION) {
        return;
      }
      if (currentDbVersion === 0) {
        db.execSync(MIGRATION_STATEMENT_0);
        currentDbVersion = 1;
      }
      db.execSync(`PRAGMA user_version = ${DATABASE_VERSION}`);
    });
  }

  /**
   * Recursively merge two JSON objects.
   */
  private static mergeDeep(target: any, source: any): any {
    if (typeof target !== 'object' || target === null) {
      return source;
    }

    if (typeof source !== 'object' || source === null) {
      return target;
    }

    const output = { ...target };

    for (const key of Object.keys(source)) {
      if (source[key] instanceof Array) {
        if (!output[key]) {
          output[key] = [];
        }
        output[key] = output[key].concat(source[key]);
      } else if (typeof source[key] === 'object') {
        output[key] = this.mergeDeep(target[key], source[key]);
      } else {
        output[key] = source[key];
      }
    }

    return output;
  }

  //#endregion
}

/**
 * This default instance of the [`SQLiteStorage`](#sqlitestorage-1) class is used as a drop-in replacement for the `AsyncStorage` module from [`@react-native-async-storage/async-storage`](https://github.com/react-native-async-storage/async-storage).
 */
export const AsyncStorage = new SQLiteStorage('ExpoSQLiteStorage');

/**
 * Alias for [`AsyncStorage`](#asyncstorage-1), given the storage not only offers asynchronous methods.
 */
export const Storage = AsyncStorage;
