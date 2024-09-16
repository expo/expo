import { Settings } from 'react-native';

// localStorage polyfill. Life's too short to not have some storage API.
if (typeof localStorage === 'undefined') {
  const getKeys = () => {
    const value = Settings.get('__local_storage_keys');
    if (value) {
      return JSON.parse(value) as string[];
    }
    return [];
  };
  const setKeys = (keys: string[]) => {
    Settings.set({ __local_storage_keys: JSON.stringify(keys) });
  };
  const ensureKey = (key: string) => {
    const keys = getKeys();
    if (!keys.includes(key)) {
      keys.push(key);
      setKeys(keys);
    }
  };
  const removeKey = (key: string) => {
    const keys = getKeys();
    const index = keys.indexOf(key);
    if (index !== -1) {
      keys.splice(index, 1);
      setKeys(keys);
    }
  };

  class StoragePolyfill {
    /**
     * Returns the number of key/value pairs.
     *
     * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Storage/length)
     */
    get length(): number {
      return getKeys().length;
    }
    /**
     * Removes all key/value pairs, if there are any.
     *
     * Dispatches a storage event on Window objects holding an equivalent Storage object.
     *
     * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Storage/clear)
     */
    clear(): void {
      const keys = getKeys();
      Settings.set(Object.fromEntries(keys.map((key) => [key, undefined])));
      Settings.set({ __local_storage_keys: JSON.stringify([]) });
    }
    /**
     * Returns the current value associated with the given key, or null if the given key does not exist.
     *
     * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Storage/getItem)
     */
    getItem(key: string): string | null {
      return Settings.get(key) ?? null;
    }
    /**
     * Returns the name of the nth key, or null if n is greater than or equal to the number of key/value pairs.
     *
     * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Storage/key)
     */
    key(index: number): string | null {
      return getKeys()[index] ?? null;
    }
    /**
     * Removes the key/value pair with the given key, if a key/value pair with the given key exists.
     *
     * Dispatches a storage event on Window objects holding an equivalent Storage object.
     *
     * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Storage/removeItem)
     */
    removeItem(key: string): void {
      removeKey(key);
      Settings.set({ [key]: undefined });
    }
    /**
     * Sets the value of the pair identified by key to value, creating a new key/value pair if none existed for key previously.
     *
     * Throws a "QuotaExceededError" DOMException exception if the new value couldn't be set. (Setting could fail if, e.g., the user has disabled storage for the site, or if the quota has been exceeded.)
     *
     * Dispatches a storage event on Window objects holding an equivalent Storage object.
     *
     * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Storage/setItem)
     */
    setItem(key: string, value: string): void {
      ensureKey(key);
      Settings.set({ [key]: value });
    }
    // [name: string]: any;
  }

  const localStoragePolyfill = new StoragePolyfill();

  Object.defineProperty(global, 'localStorage', {
    value: localStoragePolyfill,
  });
}
