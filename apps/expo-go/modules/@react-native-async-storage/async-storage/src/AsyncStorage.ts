/**
 * Copyright (c) Nicolas Gallagher.
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import mergeOptions from "merge-options";
import type {
  AsyncStorageStatic,
  MultiCallback,
  MultiGetCallback,
} from "./types";

// eslint-disable-next-line @typescript-eslint/ban-types
type OnMultiResult = Function;
// eslint-disable-next-line @typescript-eslint/ban-types
type OnResult = Function;

const merge = mergeOptions.bind({
  concatArrays: true,
  ignoreUndefined: true,
});

function mergeLocalStorageItem(key: string, value: string) {
  const oldValue = window.localStorage.getItem(key);
  if (oldValue) {
    const oldObject = JSON.parse(oldValue);
    const newObject = JSON.parse(value);
    const nextValue = JSON.stringify(merge(oldObject, newObject));
    window.localStorage.setItem(key, nextValue);
  } else {
    window.localStorage.setItem(key, value);
  }
}

function createPromise<Result, Callback extends OnResult>(
  getValue: () => Result,
  callback?: Callback
): Promise<Result> {
  return new Promise((resolve, reject) => {
    try {
      const value = getValue();
      callback?.(null, value);
      resolve(value);
    } catch (err) {
      callback?.(err);
      reject(err);
    }
  });
}

function createPromiseAll<
  ReturnType,
  Result,
  ResultProcessor extends OnMultiResult
>(
  promises: Promise<Result>[],
  callback?: MultiCallback | MultiGetCallback,
  processResult?: ResultProcessor
): Promise<ReturnType> {
  return Promise.all(promises).then(
    (result) => {
      const value = processResult?.(result) ?? null;
      callback?.(null, value);
      return Promise.resolve(value);
    },
    (errors) => {
      callback?.(errors);
      return Promise.reject(errors);
    }
  );
}

const AsyncStorage: AsyncStorageStatic = {
  /**
   * Fetches `key` value.
   */
  getItem: (key, callback) => {
    return createPromise(() => window.localStorage.getItem(key), callback);
  },

  /**
   * Sets `value` for `key`.
   */
  setItem: (key, value, callback) => {
    return createPromise(
      () => window.localStorage.setItem(key, value),
      callback
    );
  },

  /**
   * Removes a `key`
   */
  removeItem: (key, callback) => {
    return createPromise(() => window.localStorage.removeItem(key), callback);
  },

  /**
   * Merges existing value with input value, assuming they are stringified JSON.
   */
  mergeItem: (key, value, callback) => {
    return createPromise(() => mergeLocalStorageItem(key, value), callback);
  },

  /**
   * Erases *all* AsyncStorage for the domain.
   */
  clear: (callback) => {
    return createPromise(() => window.localStorage.clear(), callback);
  },

  /**
   * Gets *all* keys known to the app, for all callers, libraries, etc.
   */
  getAllKeys: (callback) => {
    return createPromise(() => {
      const numberOfKeys = window.localStorage.length;
      const keys: string[] = [];
      for (let i = 0; i < numberOfKeys; i += 1) {
        const key = window.localStorage.key(i) || "";
        keys.push(key);
      }
      return keys;
    }, callback);
  },

  /**
   * (stub) Flushes any pending requests using a single batch call to get the data.
   */
  flushGetRequests: () => undefined,

  /**
   * multiGet resolves to an array of key-value pair arrays that matches the
   * input format of multiSet.
   *
   *   multiGet(['k1', 'k2']) -> [['k1', 'val1'], ['k2', 'val2']]
   */
  multiGet: (keys, callback) => {
    const promises = keys.map((key) => AsyncStorage.getItem(key));
    const processResult = (result: string[]) =>
      result.map((value, i) => [keys[i], value]);
    return createPromiseAll(promises, callback, processResult);
  },

  /**
   * Takes an array of key-value array pairs.
   *   multiSet([['k1', 'val1'], ['k2', 'val2']])
   */
  multiSet: (keyValuePairs, callback) => {
    const promises = keyValuePairs.map((item) =>
      AsyncStorage.setItem(item[0], item[1])
    );
    return createPromiseAll(promises, callback);
  },

  /**
   * Delete all the keys in the `keys` array.
   */
  multiRemove: (keys, callback) => {
    const promises = keys.map((key) => AsyncStorage.removeItem(key));
    return createPromiseAll(promises, callback);
  },

  /**
   * Takes an array of key-value array pairs and merges them with existing
   * values, assuming they are stringified JSON.
   *
   *   multiMerge([['k1', 'val1'], ['k2', 'val2']])
   */
  multiMerge: (keyValuePairs, callback) => {
    const promises = keyValuePairs.map((item) =>
      AsyncStorage.mergeItem(item[0], item[1])
    );
    return createPromiseAll(promises, callback);
  },
};

export default AsyncStorage;
