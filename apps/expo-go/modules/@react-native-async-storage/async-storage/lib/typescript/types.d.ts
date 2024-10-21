export type ErrorLike = {
    message: string;
    key?: string;
};
export type Callback = (error?: Error | null) => void;
export type CallbackWithResult<T> = (error?: Error | null, result?: T | null) => void;
export type KeyValuePair = [string, string | null];
export type MultiCallback = (errors?: readonly (Error | null)[] | null) => void;
export type MultiGetCallback = (errors?: readonly (Error | null)[] | null, result?: readonly KeyValuePair[]) => void;
export type MultiRequest = {
    keys: readonly string[];
    callback?: MultiGetCallback;
    keyIndex: number;
    resolve?: (result: readonly KeyValuePair[]) => void;
    reject?: (error?: ErrorLike) => void;
};
export type AsyncStorageHook = {
    getItem: (callback?: CallbackWithResult<string>) => Promise<string | null>;
    setItem: (value: string, callback?: Callback) => Promise<void>;
    mergeItem: (value: string, callback?: Callback) => Promise<void>;
    removeItem: (callback?: Callback) => Promise<void>;
};
/**
 * `AsyncStorage` is a simple, unencrypted, asynchronous, persistent, key-value
 * storage system that is global to the app.  It should be used instead of
 * LocalStorage.
 *
 * See https://react-native-async-storage.github.io/async-storage/docs/api
 */
export type AsyncStorageStatic = {
    /**
     * Fetches an item for a `key` and invokes a callback upon completion.
     *
     * See https://react-native-async-storage.github.io/async-storage/docs/api#getitem
     */
    getItem: (key: string, callback?: CallbackWithResult<string>) => Promise<string | null>;
    /**
     * Sets the value for a `key` and invokes a callback upon completion.
     *
     * See https://react-native-async-storage.github.io/async-storage/docs/api#setitem
     */
    setItem: (key: string, value: string, callback?: Callback) => Promise<void>;
    /**
     * Removes an item for a `key` and invokes a callback upon completion.
     *
     * See https://react-native-async-storage.github.io/async-storage/docs/api#removeitem
     */
    removeItem: (key: string, callback?: Callback) => Promise<void>;
    /**
     * Merges an existing `key` value with an input value, assuming both values
     * are stringified JSON.
     *
     * See https://react-native-async-storage.github.io/async-storage/docs/api#mergeitem
     */
    mergeItem: (key: string, value: string, callback?: Callback) => Promise<void>;
    /**
     * Erases *all* `AsyncStorage` for all clients, libraries, etc. You probably
     * don't want to call this; use `removeItem` or `multiRemove` to clear only
     * your app's keys.
     *
     * See https://react-native-async-storage.github.io/async-storage/docs/api#clear
     */
    clear: (callback?: Callback) => Promise<void>;
    /**
     * Gets *all* keys known to your app; for all callers, libraries, etc.
     *
     * See https://react-native-async-storage.github.io/async-storage/docs/api#getallkeys
     */
    getAllKeys: (callback?: CallbackWithResult<readonly string[]>) => Promise<readonly string[]>;
    /**
     * The following batched functions are useful for executing a lot of
     * operations at once, allowing for native optimizations and provide the
     * convenience of a single callback after all operations are complete.
     *
     * These functions return arrays of errors, potentially one for every key.
     * For key-specific errors, the Error object will have a key property to
     * indicate which key caused the error.
     */
    /**
     * Flushes any pending requests using a single batch call to get the data.
     *
     * See https://react-native-async-storage.github.io/async-storage/docs/api#flushgetrequests
     * */
    flushGetRequests: () => void;
    /**
     * This allows you to batch the fetching of items given an array of `key`
     * inputs. Your callback will be invoked with an array of corresponding
     * key-value pairs found.
     *
     * See https://react-native-async-storage.github.io/async-storage/docs/api#multiget
     */
    multiGet: (keys: readonly string[], callback?: MultiGetCallback) => Promise<readonly KeyValuePair[]>;
    /**
     * Use this as a batch operation for storing multiple key-value pairs. When
     * the operation completes you'll get a single callback with any errors.
     *
     * See https://react-native-async-storage.github.io/async-storage/docs/api#multiset
     */
    multiSet: (keyValuePairs: [string, string][], callback?: MultiCallback) => Promise<void>;
    /**
     * Call this to batch the deletion of all keys in the `keys` array.
     *
     * See https://react-native-async-storage.github.io/async-storage/docs/api#multiremove
     */
    multiRemove: (keys: readonly string[], callback?: MultiCallback) => Promise<void>;
    /**
     * Batch operation to merge in existing and new values for a given set of
     * keys. This assumes that the values are stringified JSON.
     *
     * See https://react-native-async-storage.github.io/async-storage/docs/api#multimerge
     */
    multiMerge: (keyValuePairs: [string, string][], callback?: MultiCallback) => Promise<void>;
};
//# sourceMappingURL=types.d.ts.map