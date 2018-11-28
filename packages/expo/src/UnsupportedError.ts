import { Platform } from 'expo-core';

export default class UnsupportedError extends Error {
  constructor(moduleName, methodName) {
    super(`${moduleName}.${methodName}: is not supported on ${Platform.OS}`);
  }
}
