import { ensureNativeModulesAreInstalled } from './ensureNativeModulesAreInstalled';
import type { NativeModule } from './ts-declarations/NativeModule';

/**
 * Registers a web module.
 * @param moduleImplementation – a class that extends `NativeModule`. The class is registered under `globalThis.expo.modules[className]`.
 * @returns A singleton instance of the class passed into arguments.
 */

export function registerWebModule<
  EventsMap extends Record<never, never>,
  ModuleType extends typeof NativeModule<EventsMap>,
>(moduleImplementation: ModuleType): ModuleType {
  ensureNativeModulesAreInstalled();

  const moduleName = moduleImplementation.name;
  if (!moduleName) {
    throw new Error('Module implementation must be a class');
  }
  if (!globalThis?.expo?.modules) {
    globalThis.expo.modules = {};
  }
  if (globalThis.expo.modules[moduleName]) {
    return globalThis.expo.modules[moduleName];
  }
  globalThis.expo.modules[moduleName] = new moduleImplementation();
  return globalThis.expo.modules[moduleName];
}
