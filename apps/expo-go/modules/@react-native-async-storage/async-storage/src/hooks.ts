import AsyncStorage from "./AsyncStorage";
import type { AsyncStorageHook } from "./types";

export function useAsyncStorage(key: string): AsyncStorageHook {
  return {
    getItem: (...args) => AsyncStorage.getItem(key, ...args),
    setItem: (...args) => AsyncStorage.setItem(key, ...args),
    mergeItem: (...args) => AsyncStorage.mergeItem(key, ...args),
    removeItem: (...args) => AsyncStorage.removeItem(key, ...args),
  };
}
