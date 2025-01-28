"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _helpers = require("./helpers");
var _RCTAsyncStorage = _interopRequireDefault(require("./RCTAsyncStorage"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

if (!_RCTAsyncStorage.default) {
  throw new Error(`[@RNC/AsyncStorage]: NativeModule: AsyncStorage is null.

To fix this issue try these steps:

  • Uninstall, rebuild and restart the app.

  • Run the packager with \`--reset-cache\` flag.

  • If you are using CocoaPods on iOS, run \`pod install\` in the \`ios\` directory, then rebuild and re-run the app.

  • Make sure your project's \`package.json\` depends on \`@react-native-async-storage/async-storage\`, even if you only depend on it indirectly through other dependencies. CLI only autolinks native modules found in your \`package.json\`.

  • If this happens while testing with Jest, check out how to integrate AsyncStorage here: https://react-native-async-storage.github.io/async-storage/docs/advanced/jest

If none of these fix the issue, please open an issue on the GitHub repository: https://github.com/react-native-async-storage/async-storage/issues
`);
}

/**
 * `AsyncStorage` is a simple, unencrypted, asynchronous, persistent, key-value
 * storage system that is global to the app. It should be used instead of
 * LocalStorage.
 *
 * See https://react-native-async-storage.github.io/async-storage/docs/api
 */
const AsyncStorage = (() => {
  let _getRequests = [];
  let _getKeys = [];
  let _immediate = null;
  return {
    /**
     * Fetches an item for a `key` and invokes a callback upon completion.
     *
     * See https://react-native-async-storage.github.io/async-storage/docs/api#getitem
     */
    getItem: (key, callback) => {
      return new Promise((resolve, reject) => {
        (0, _helpers.checkValidInput)(key);
        _RCTAsyncStorage.default.multiGet([key], (errors, result) => {
          var _result$;
          // Unpack result to get value from [[key,value]]
          const value = result !== null && result !== void 0 && (_result$ = result[0]) !== null && _result$ !== void 0 && _result$[1] ? result[0][1] : null;
          const errs = (0, _helpers.convertErrors)(errors);
          callback === null || callback === void 0 ? void 0 : callback(errs === null || errs === void 0 ? void 0 : errs[0], value);
          if (errs) {
            reject(errs[0]);
          } else {
            resolve(value);
          }
        });
      });
    },
    /**
     * Sets the value for a `key` and invokes a callback upon completion.
     *
     * See https://react-native-async-storage.github.io/async-storage/docs/api#setitem
     */
    setItem: (key, value, callback) => {
      return new Promise((resolve, reject) => {
        (0, _helpers.checkValidInput)(key, value);
        _RCTAsyncStorage.default.multiSet([[key, value]], errors => {
          const errs = (0, _helpers.convertErrors)(errors);
          callback === null || callback === void 0 ? void 0 : callback(errs === null || errs === void 0 ? void 0 : errs[0]);
          if (errs) {
            reject(errs[0]);
          } else {
            resolve();
          }
        });
      });
    },
    /**
     * Removes an item for a `key` and invokes a callback upon completion.
     *
     * See https://react-native-async-storage.github.io/async-storage/docs/api#removeitem
     */
    removeItem: (key, callback) => {
      return new Promise((resolve, reject) => {
        (0, _helpers.checkValidInput)(key);
        _RCTAsyncStorage.default.multiRemove([key], errors => {
          const errs = (0, _helpers.convertErrors)(errors);
          callback === null || callback === void 0 ? void 0 : callback(errs === null || errs === void 0 ? void 0 : errs[0]);
          if (errs) {
            reject(errs[0]);
          } else {
            resolve();
          }
        });
      });
    },
    /**
     * Merges an existing `key` value with an input value, assuming both values
     * are stringified JSON.
     *
     * See https://react-native-async-storage.github.io/async-storage/docs/api#mergeitem
     */
    mergeItem: (key, value, callback) => {
      return new Promise((resolve, reject) => {
        (0, _helpers.checkValidInput)(key, value);
        _RCTAsyncStorage.default.multiMerge([[key, value]], errors => {
          const errs = (0, _helpers.convertErrors)(errors);
          callback === null || callback === void 0 ? void 0 : callback(errs === null || errs === void 0 ? void 0 : errs[0]);
          if (errs) {
            reject(errs[0]);
          } else {
            resolve();
          }
        });
      });
    },
    /**
     * Erases *all* `AsyncStorage` for all clients, libraries, etc. You probably
     * don't want to call this; use `removeItem` or `multiRemove` to clear only
     * your app's keys.
     *
     * See https://react-native-async-storage.github.io/async-storage/docs/api#clear
     */
    clear: callback => {
      return new Promise((resolve, reject) => {
        _RCTAsyncStorage.default.clear(error => {
          const err = (0, _helpers.convertError)(error);
          callback === null || callback === void 0 ? void 0 : callback(err);
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    },
    /**
     * Gets *all* keys known to your app; for all callers, libraries, etc.
     *
     * See https://react-native-async-storage.github.io/async-storage/docs/api#getallkeys
     */
    getAllKeys: callback => {
      return new Promise((resolve, reject) => {
        _RCTAsyncStorage.default.getAllKeys((error, keys) => {
          const err = (0, _helpers.convertError)(error);
          callback === null || callback === void 0 ? void 0 : callback(err, keys);
          if (keys) {
            resolve(keys);
          } else {
            reject(err);
          }
        });
      });
    },
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
    flushGetRequests: () => {
      const getRequests = _getRequests;
      const getKeys = _getKeys;
      _getRequests = [];
      _getKeys = [];
      _RCTAsyncStorage.default.multiGet(getKeys, (errors, result) => {
        // Even though the runtime complexity of this is theoretically worse vs if we used a map,
        // it's much, much faster in practice for the data sets we deal with (we avoid
        // allocating result pair arrays). This was heavily benchmarked.
        //
        // Is there a way to avoid using the map but fix the bug in this breaking test?
        // https://github.com/facebook/react-native/commit/8dd8ad76579d7feef34c014d387bf02065692264
        const map = {};
        result === null || result === void 0 ? void 0 : result.forEach(([key, value]) => {
          map[key] = value;
          return value;
        });
        const reqLength = getRequests.length;

        /**
         * As mentioned few lines above, this method could be called with the array of potential error,
         * in case of anything goes wrong. The problem is, if any of the batched calls fails
         * the rest of them would fail too, but the error would be consumed by just one. The rest
         * would simply return `undefined` as their result, rendering false negatives.
         *
         * In order to avoid this situation, in case of any call failing,
         * the rest of them will be rejected as well (with the same error).
         */
        const errorList = (0, _helpers.convertErrors)(errors);
        const error = errorList !== null && errorList !== void 0 && errorList.length ? errorList[0] : null;
        for (let i = 0; i < reqLength; i++) {
          var _request$callback2, _request$resolve;
          const request = getRequests[i];
          if (error) {
            var _request$callback, _request$reject;
            (_request$callback = request.callback) === null || _request$callback === void 0 ? void 0 : _request$callback.call(request, errorList);
            (_request$reject = request.reject) === null || _request$reject === void 0 ? void 0 : _request$reject.call(request, error);
            continue;
          }
          const requestResult = request.keys.map(key => [key, map[key]]);
          (_request$callback2 = request.callback) === null || _request$callback2 === void 0 ? void 0 : _request$callback2.call(request, null, requestResult);
          (_request$resolve = request.resolve) === null || _request$resolve === void 0 ? void 0 : _request$resolve.call(request, requestResult);
        }
      });
    },
    /**
     * This allows you to batch the fetching of items given an array of `key`
     * inputs. Your callback will be invoked with an array of corresponding
     * key-value pairs found.
     *
     * See https://react-native-async-storage.github.io/async-storage/docs/api#multiget
     */
    multiGet: (keys, callback) => {
      if (!_immediate) {
        _immediate = setImmediate(() => {
          _immediate = null;
          AsyncStorage.flushGetRequests();
        });
      }
      const getRequest = {
        keys: keys,
        callback: callback,
        // do we need this?
        keyIndex: _getKeys.length
      };
      const promiseResult = new Promise((resolve, reject) => {
        getRequest.resolve = resolve;
        getRequest.reject = reject;
      });
      _getRequests.push(getRequest);
      // avoid fetching duplicates
      keys.forEach(key => {
        if (_getKeys.indexOf(key) === -1) {
          _getKeys.push(key);
        }
      });
      return promiseResult;
    },
    /**
     * Use this as a batch operation for storing multiple key-value pairs. When
     * the operation completes you'll get a single callback with any errors.
     *
     * See https://react-native-async-storage.github.io/async-storage/docs/api#multiset
     */
    multiSet: (keyValuePairs, callback) => {
      (0, _helpers.checkValidArgs)(keyValuePairs, callback);
      return new Promise((resolve, reject) => {
        keyValuePairs.forEach(([key, value]) => {
          (0, _helpers.checkValidInput)(key, value);
        });
        _RCTAsyncStorage.default.multiSet(keyValuePairs, errors => {
          const error = (0, _helpers.convertErrors)(errors);
          callback === null || callback === void 0 ? void 0 : callback(error);
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    },
    /**
     * Call this to batch the deletion of all keys in the `keys` array.
     *
     * See https://react-native-async-storage.github.io/async-storage/docs/api#multiremove
     */
    multiRemove: (keys, callback) => {
      return new Promise((resolve, reject) => {
        keys.forEach(key => (0, _helpers.checkValidInput)(key));
        _RCTAsyncStorage.default.multiRemove(keys, errors => {
          const error = (0, _helpers.convertErrors)(errors);
          callback === null || callback === void 0 ? void 0 : callback(error);
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    },
    /**
     * Batch operation to merge in existing and new values for a given set of
     * keys. This assumes that the values are stringified JSON.
     *
     * See https://react-native-async-storage.github.io/async-storage/docs/api#multimerge
     */
    multiMerge: (keyValuePairs, callback) => {
      return new Promise((resolve, reject) => {
        _RCTAsyncStorage.default.multiMerge(keyValuePairs, errors => {
          const error = (0, _helpers.convertErrors)(errors);
          callback === null || callback === void 0 ? void 0 : callback(error);
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    }
  };
})();
var _default = AsyncStorage;
exports.default = _default;
//# sourceMappingURL=AsyncStorage.native.js.map