// It is a no-op function that returns the module implementation.

import type { NativeModule } from './ts-declarations/NativeModule';

export function registerWebModule<ModuleType extends typeof NativeModule>(
  moduleName: string,
  moduleImplementation: ModuleType
): ModuleType {
  if (globalThis.expo.modules[moduleName]) {
    return globalThis.expo.modules[moduleName];
  }
  globalThis.expo.modules[moduleName] = new moduleImplementation();
  return globalThis.expo.modules[moduleName];
}
