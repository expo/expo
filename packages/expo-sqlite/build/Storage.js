import { openDatabaseSync } from './index';
export function checkValidInput(...input) {
    const [key, value] = input;
    if (typeof key !== 'string') {
        throw new Error(`[SQLiteStorage] Using ${typeof key} type for key is not supported. Use string instead. Key passed: ${key}`);
    }
    if (input.length > 1 && typeof value !== 'string' && typeof value !== 'function') {
        throw new Error(`[SQLiteStorage] Using ${typeof value} type for value is not supported. Use string instead. Key passed: ${key}. Value passed : ${value}`);
    }
}
const DATABASE_VERSION = 1;
const STATEMENT_GET = 'SELECT value FROM storage WHERE key = ?;';
const STATEMENT_SET = 'INSERT INTO storage (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value;';
const STATEMENT_REMOVE = 'DELETE FROM storage WHERE key = ?;';
const STATEMENT_GET_ALL_KEYS = 'SELECT key FROM storage;';
const STATEMENT_CLEAR = 'DELETE FROM storage;';
const MIGRATION_STATEMENT_0 = 'CREATE TABLE IF NOT EXISTS storage (key TEXT PRIMARY KEY NOT NULL, value TEXT);';
/**
 * Key-value store backed by SQLite. This class accepts a `databaseName` parameter in its constructor, which is the name of the database file to use for the storage.
 */
export class SQLiteStorage {
    databaseName;
    db = null;
    constructor(databaseName) {
        this.databaseName = databaseName;
    }
    //#region Asynchronous API
    /**
     * Retrieves the value associated with the given key asynchronously.
     */
    async getItemAsync(key) {
        checkValidInput(key);
        const db = this.getDbSync();
        const result = await db.getFirstAsync(STATEMENT_GET, key);
        return result?.value ?? null;
    }
    /**
     * Sets the value for the given key asynchronously.
     * If a function is provided, it computes the new value based on the previous value.
     */
    async setItemAsync(key, value) {
        checkValidInput(key, value);
        const db = this.getDbSync();
        if (typeof value === 'function') {
            await db.withExclusiveTransactionAsync(async (tx) => {
                const prevResult = await tx.getFirstAsync(STATEMENT_GET, key);
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
    async removeItemAsync(key) {
        checkValidInput(key);
        const db = this.getDbSync();
        const result = await db.runAsync(STATEMENT_REMOVE, key);
        return result.changes > 0;
    }
    /**
     * Retrieves all keys stored in the storage asynchronously.
     */
    async getAllKeysAsync() {
        const db = this.getDbSync();
        const result = await db.getAllAsync(STATEMENT_GET_ALL_KEYS);
        return result.map(({ key }) => key);
    }
    /**
     * Clears all key-value pairs from the storage asynchronously.
     */
    async clearAsync() {
        const db = this.getDbSync();
        const result = await db.runAsync(STATEMENT_CLEAR);
        return result.changes > 0;
    }
    /**
     * Closes the database connection asynchronously.
     */
    async closeAsync() {
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
    getItemSync(key) {
        checkValidInput(key);
        const db = this.getDbSync();
        const result = db.getFirstSync(STATEMENT_GET, key);
        return result?.value ?? null;
    }
    /**
     * Sets the value for the given key synchronously.
     * If a function is provided, it computes the new value based on the previous value.
     */
    setItemSync(key, value) {
        checkValidInput(key, value);
        const db = this.getDbSync();
        if (typeof value === 'function') {
            db.withTransactionSync(() => {
                const prevResult = db.getFirstSync(STATEMENT_GET, key);
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
    removeItemSync(key) {
        checkValidInput(key);
        const db = this.getDbSync();
        const result = db.runSync(STATEMENT_REMOVE, key);
        return result.changes > 0;
    }
    /**
     * Retrieves all keys stored in the storage synchronously.
     */
    getAllKeysSync() {
        const db = this.getDbSync();
        const result = db.getAllSync(STATEMENT_GET_ALL_KEYS);
        return result.map(({ key }) => key);
    }
    /**
     * Clears all key-value pairs from the storage synchronously.
     */
    clearSync() {
        const db = this.getDbSync();
        const result = db.runSync(STATEMENT_CLEAR);
        return result.changes > 0;
    }
    /**
     * Closes the database connection synchronously.
     */
    closeSync() {
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
    async getItem(key) {
        return this.getItemAsync(key);
    }
    /**
     * Alias for [`setItemAsync()`](#setitemasynckey-value).
     */
    async setItem(key, value) {
        await this.setItemAsync(key, value);
    }
    /**
     * Alias for [`removeItemAsync()`](#removeitemasynckey) method.
     */
    async removeItem(key) {
        await this.removeItemAsync(key);
    }
    /**
     * Alias for [`getAllKeysAsync()`](#getallkeysasync) method.
     */
    async getAllKeys() {
        return this.getAllKeysAsync();
    }
    /**
     * Alias for [`clearAsync()`](#clearasync) method.
     */
    async clear() {
        await this.clearAsync();
    }
    /**
     * Merges the given value with the existing value for the given key asynchronously.
     * If the existing value is a JSON object, performs a deep merge.
     */
    async mergeItem(key, value) {
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
    async multiGet(keys) {
        return Promise.all(keys.map(async (key) => {
            checkValidInput(key);
            return [key, await this.getItemAsync(key)];
        }));
    }
    /**
     * Sets multiple key-value pairs asynchronously.
     */
    async multiSet(keyValuePairs) {
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
    async multiRemove(keys) {
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
    async multiMerge(keyValuePairs) {
        const db = this.getDbSync();
        await db.withExclusiveTransactionAsync(async (tx) => {
            for (const [key, value] of keyValuePairs) {
                checkValidInput(key, value);
                const prevValue = await tx.getFirstAsync(STATEMENT_GET, key);
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
    async close() {
        await this.closeAsync();
    }
    //#endregion
    //#region Internals
    getDbSync() {
        if (!this.db) {
            const db = openDatabaseSync(this.databaseName);
            this.maybeMigrateDbSync(db);
            this.db = db;
        }
        return this.db;
    }
    maybeMigrateDbSync(db) {
        db.withTransactionSync(() => {
            const result = db.getFirstSync('PRAGMA user_version');
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
    static mergeDeep(target, source) {
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
            }
            else if (typeof source[key] === 'object') {
                output[key] = this.mergeDeep(target[key], source[key]);
            }
            else {
                output[key] = source[key];
            }
        }
        return output;
    }
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
//# sourceMappingURL=Storage.js.map