export declare function checkValidInput(...input: unknown[]): void;
/**
 * Update function for the [`setItemAsync()`](#setitemasynckey-value) or [`setItemSync()`](#setitemsynckey-value) method. It computes the new value based on the previous value. The function returns the new value to set for the key.
 * @param prevValue The previous value associated with the key, or `null` if the key was not set.
 * @returns The new value to set for the key.
 */
export type SQLiteStorageSetItemUpdateFunction = (prevValue: string | null) => string;
/**
 * Key-value store backed by SQLite. This class accepts a `databaseName` parameter in its constructor, which is the name of the database file to use for the storage.
 */
export declare class SQLiteStorage {
    private readonly databaseName;
    private db;
    constructor(databaseName: string);
    /**
     * Retrieves the value associated with the given key asynchronously.
     */
    getItemAsync(key: string): Promise<string | null>;
    /**
     * Sets the value for the given key asynchronously.
     * If a function is provided, it computes the new value based on the previous value.
     */
    setItemAsync(key: string, value: string | SQLiteStorageSetItemUpdateFunction): Promise<void>;
    /**
     * Removes the value associated with the given key asynchronously.
     */
    removeItemAsync(key: string): Promise<boolean>;
    /**
     * Retrieves all keys stored in the storage asynchronously.
     */
    getAllKeysAsync(): Promise<string[]>;
    /**
     * Clears all key-value pairs from the storage asynchronously.
     */
    clearAsync(): Promise<boolean>;
    /**
     * Closes the database connection asynchronously.
     */
    closeAsync(): Promise<void>;
    /**
     * Retrieves the value associated with the given key synchronously.
     */
    getItemSync(key: string): string | null;
    /**
     * Sets the value for the given key synchronously.
     * If a function is provided, it computes the new value based on the previous value.
     */
    setItemSync(key: string, value: string | SQLiteStorageSetItemUpdateFunction): void;
    /**
     * Removes the value associated with the given key synchronously.
     */
    removeItemSync(key: string): boolean;
    /**
     * Retrieves all keys stored in the storage synchronously.
     */
    getAllKeysSync(): string[];
    /**
     * Clears all key-value pairs from the storage synchronously.
     */
    clearSync(): boolean;
    /**
     * Closes the database connection synchronously.
     */
    closeSync(): void;
    /**
     * Alias for [`getItemAsync()`](#getitemasynckey) method.
     */
    getItem(key: string): Promise<string | null>;
    /**
     * Alias for [`setItemAsync()`](#setitemasynckey-value).
     */
    setItem(key: string, value: string | SQLiteStorageSetItemUpdateFunction): Promise<void>;
    /**
     * Alias for [`removeItemAsync()`](#removeitemasynckey) method.
     */
    removeItem(key: string): Promise<void>;
    /**
     * Alias for [`getAllKeysAsync()`](#getallkeysasync) method.
     */
    getAllKeys(): Promise<string[]>;
    /**
     * Alias for [`clearAsync()`](#clearasync) method.
     */
    clear(): Promise<void>;
    /**
     * Merges the given value with the existing value for the given key asynchronously.
     * If the existing value is a JSON object, performs a deep merge.
     */
    mergeItem(key: string, value: string): Promise<void>;
    /**
     * Retrieves the values associated with the given keys asynchronously.
     */
    multiGet(keys: string[]): Promise<[string, string | null][]>;
    /**
     * Sets multiple key-value pairs asynchronously.
     */
    multiSet(keyValuePairs: [string, string][]): Promise<void>;
    /**
     * Removes the values associated with the given keys asynchronously.
     */
    multiRemove(keys: string[]): Promise<void>;
    /**
     * Merges multiple key-value pairs asynchronously.
     * If existing values are JSON objects, performs a deep merge.
     */
    multiMerge(keyValuePairs: [string, string][]): Promise<void>;
    /**
     * Alias for [`closeAsync()`](#closeasync-1) method.
     */
    close(): Promise<void>;
    private getDbSync;
    private maybeMigrateDbSync;
    /**
     * Recursively merge two JSON objects.
     */
    private static mergeDeep;
}
/**
 * This default instance of the [`SQLiteStorage`](#sqlitestorage-1) class is used as a drop-in replacement for the `AsyncStorage` module from [`@react-native-async-storage/async-storage`](https://github.com/react-native-async-storage/async-storage).
 */
export declare const AsyncStorage: SQLiteStorage;
export default AsyncStorage;
/**
 * Alias for [`AsyncStorage`](#sqliteasyncstorage), given the storage not only offers asynchronous methods.
 */
export declare const Storage: SQLiteStorage;
//# sourceMappingURL=Storage.d.ts.map