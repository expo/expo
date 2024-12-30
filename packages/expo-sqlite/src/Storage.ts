import { openDatabaseSync, type SQLiteDatabase } from './index';

export function checkValidInput(...input: unknown[]) {
  const [key, value] = input;

  if (typeof key !== 'string') {
    throw new Error(
      `[SQLiteStorage] Using ${typeof key} type for key is not supported. Use string instead. Key passed: ${key}`
    );
  }

  if (input.length > 1 && typeof value !== 'string' && typeof value !== 'function') {
    throw new Error(
      `[SQLiteStorage] Using ${typeof value} type for value is not supported. Use string instead. Key passed: ${key}. Value passed : ${value}`
    );
  }
}

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
 * Key-value store backed by SQLite. This class accepts a `databaseName` parameter in its constructor, which is the name of the database file to use for the storage.
 */
export class SQLiteStorage {
  private db: SQLiteDatabase | null = null;

  constructor(private readonly databaseName: string) {}

  //#region Asynchronous API

  /**
   * Retrieves the value associated with the given key asynchronously.
   */
  async getItemAsync(key: string): Promise<string | null> {
    checkValidInput(key);
    const db = this.getDbSync();
    const result = await db.getFirstAsync<{ value: string }>(STATEMENT_GET, key);
    return result?.value ?? null;
  }

  /**
   * Sets the value for the given key asynchronously.
   * If a function is provided, it computes the new value based on the previous value.
   */
  async setItemAsync(
    key: string,
    value: string | SQLiteStorageSetItemUpdateFunction
  ): Promise<void> {
    checkValidInput(key, value);
    const db = this.getDbSync();

    if (typeof value === 'function') {
      await db.withExclusiveTransactionAsync(async (tx) => {
        const prevResult = await tx.getFirstAsync<{ value: string }>(STATEMENT_GET, key);
        const prevValue = prevResult?.value ?? null;
        const nextValue = value(prevValue);
        checkValidInput(key, nextValue);
        await tx.runAsync(STATEMENT_SET, key, nextValue);
      });
      return;
    }

    await db.runAsync(STATEMENT_SET, key, value);
  }

  /**
   * Removes the value associated with the given key asynchronously.
   */
  async removeItemAsync(key: string): Promise<boolean> {
    checkValidInput(key);
    const db = this.getDbSync();
    const result = await db.runAsync(STATEMENT_REMOVE, key);
    return result.changes > 0;
  }

  /**
   * Retrieves all keys stored in the storage asynchronously.
   */
  async getAllKeysAsync(): Promise<string[]> {
    const db = this.getDbSync();
    const result = await db.getAllAsync<{ key: string }>(STATEMENT_GET_ALL_KEYS);
    return result.map(({ key }) => key);
  }

  /**
   * Clears all key-value pairs from the storage asynchronously.
   */
  async clearAsync(): Promise<boolean> {
    const db = this.getDbSync();
    const result = await db.runAsync(STATEMENT_CLEAR);
    return result.changes > 0;
  }

  /**
   * Closes the database connection asynchronously.
   */
  async closeAsync(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }

  //#endregion

  //#region Synchronous API

  /**
   * Retrieves the value associated with the given key synchronously.
   */
  getItemSync(key: string): string | null {
    checkValidInput(key);
    const db = this.getDbSync();
    const result = db.getFirstSync<{ value: string }>(STATEMENT_GET, key);
    return result?.value ?? null;
  }

  /**
   * Sets the value for the given key synchronously.
   * If a function is provided, it computes the new value based on the previous value.
   */
  setItemSync(key: string, value: string | SQLiteStorageSetItemUpdateFunction): void {
    checkValidInput(key, value);
    const db = this.getDbSync();

    if (typeof value === 'function') {
      db.withTransactionSync(() => {
        const prevResult = db.getFirstSync<{ value: string }>(STATEMENT_GET, key);
        const prevValue = prevResult?.value ?? null;
        const nextValue = value(prevValue);
        checkValidInput(key, nextValue);
        db.runSync(STATEMENT_SET, key, nextValue);
      });
      return;
    }

    db.runSync(STATEMENT_SET, key, value);
  }

  /**
   * Removes the value associated with the given key synchronously.
   */
  removeItemSync(key: string): boolean {
    checkValidInput(key);
    const db = this.getDbSync();
    const result = db.runSync(STATEMENT_REMOVE, key);
    return result.changes > 0;
  }

  /**
   * Retrieves all keys stored in the storage synchronously.
   */
  getAllKeysSync(): string[] {
    const db = this.getDbSync();
    const result = db.getAllSync<{ key: string }>(STATEMENT_GET_ALL_KEYS);
    return result.map(({ key }) => key);
  }

  /**
   * Clears all key-value pairs from the storage synchronously.
   */
  clearSync(): boolean {
    const db = this.getDbSync();
    const result = db.runSync(STATEMENT_CLEAR);
    return result.changes > 0;
  }

  /**
   * Closes the database connection synchronously.
   */
  closeSync(): void {
    if (this.db) {
      this.db.closeSync();
      this.db = null;
    }
  }

  //#endregion

  //#region react-native-async-storage compatible API

  /**
   * Alias for [`getItemAsync()`](#getitemasynckey) method.
   */
  async getItem(key: string): Promise<string | null> {
    return this.getItemAsync(key);
  }

  /**
   * Alias for [`setItemAsync()`](#setitemasynckey-value).
   */
  async setItem(key: string, value: string | SQLiteStorageSetItemUpdateFunction): Promise<void> {
    await this.setItemAsync(key, value);
  }

  /**
   * Alias for [`removeItemAsync()`](#removeitemasynckey) method.
   */
  async removeItem(key: string): Promise<void> {
    await this.removeItemAsync(key);
  }

  /**
   * Alias for [`getAllKeysAsync()`](#getallkeysasync) method.
   */
  async getAllKeys(): Promise<string[]> {
    return this.getAllKeysAsync();
  }

  /**
   * Alias for [`clearAsync()`](#clearasync) method.
   */
  async clear(): Promise<void> {
    await this.clearAsync();
  }

  /**
   * Merges the given value with the existing value for the given key asynchronously.
   * If the existing value is a JSON object, performs a deep merge.
   */
  async mergeItem(key: string, value: string): Promise<void> {
    checkValidInput(key, value);
    await this.setItemAsync(key, (prevValue) => {
      if (prevValue == null) {
        return value;
      }
      const prevJSON = JSON.parse(prevValue);
      const newJSON = JSON.parse(value);
      const mergedJSON = SQLiteStorage.mergeDeep(prevJSON, newJSON);
      return JSON.stringify(mergedJSON);
    });
  }

  /**
   * Retrieves the values associated with the given keys asynchronously.
   */
  async multiGet(keys: string[]): Promise<[string, string | null][]> {
    return Promise.all(
      keys.map(async (key): Promise<[string, string | null]> => {
        checkValidInput(key);
        return [key, await this.getItemAsync(key)];
      })
    );
  }

  /**
   * Sets multiple key-value pairs asynchronously.
   */
  async multiSet(keyValuePairs: [string, string][]): Promise<void> {
    const db = this.getDbSync();
    await db.withExclusiveTransactionAsync(async (tx) => {
      for (const [key, value] of keyValuePairs) {
        checkValidInput(key, value);
        await tx.runAsync(STATEMENT_SET, key, value);
      }
    });
  }

  /**
   * Removes the values associated with the given keys asynchronously.
   */
  async multiRemove(keys: string[]): Promise<void> {
    const db = this.getDbSync();
    await db.withExclusiveTransactionAsync(async (tx) => {
      for (const key of keys) {
        checkValidInput(key);
        await tx.runAsync(STATEMENT_REMOVE, key);
      }
    });
  }

  /**
   * Merges multiple key-value pairs asynchronously.
   * If existing values are JSON objects, performs a deep merge.
   */
  async multiMerge(keyValuePairs: [string, string][]): Promise<void> {
    const db = this.getDbSync();
    await db.withExclusiveTransactionAsync(async (tx) => {
      for (const [key, value] of keyValuePairs) {
        checkValidInput(key, value);
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
  }

  /**
   * Alias for [`closeAsync()`](#closeasync-1) method.
   */
  async close(): Promise<void> {
    await this.closeAsync();
  }

  //#endregion

  //#region Internals

  private getDbSync(): SQLiteDatabase {
    if (!this.db) {
      const db = openDatabaseSync(this.databaseName);
      this.maybeMigrateDbSync(db);
      this.db = db;
    }
    return this.db;
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

export default AsyncStorage;

/**
 * Alias for [`AsyncStorage`](#sqliteasyncstorage), given the storage not only offers asynchronous methods.
 */
export const Storage = AsyncStorage;
