// It is a no-op function that returns the module implementation.

import type { NativeModule } from './ts-declarations/NativeModule';

// Actual implementation is located in `createWebModule.web.ts`.
export function registerWebModule<ModuleType extends typeof NativeModule>(
  _moduleName: string,
  moduleImplementation: ModuleType
): ModuleType {
  return moduleImplementation;
}
