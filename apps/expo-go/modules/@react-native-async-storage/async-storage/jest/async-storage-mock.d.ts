import type {
  AsyncStorageHook,
  AsyncStorageStatic,
} from "../lib/typescript/types";

export function useAsyncStorage(key: string): AsyncStorageHook;

declare const AsyncStorage: AsyncStorageStatic;
export default AsyncStorage;
