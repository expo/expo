"use strict";

import AsyncStorage from "./AsyncStorage";
export function useAsyncStorage(key) {
  return {
    getItem: (...args) => AsyncStorage.getItem(key, ...args),
    setItem: (...args) => AsyncStorage.setItem(key, ...args),
    mergeItem: (...args) => AsyncStorage.mergeItem(key, ...args),
    removeItem: (...args) => AsyncStorage.removeItem(key, ...args)
  };
}
//# sourceMappingURL=hooks.js.map