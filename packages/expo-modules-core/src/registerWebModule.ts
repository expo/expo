import { ensureNativeModulesAreInstalled } from './ensureNativeModulesAreInstalled';
import type { NativeModule } from './ts-declarations/NativeModule';

/**
 * Registers a web module.
 * @param moduleImplementation A class that extends `NativeModule`. The class is registered under `globalThis.expo.modules[className]`.
 * @param moduleName – a name to register the module under `globalThis.expo.modules[className]`.
 * @returns A singleton instance of the class passed into arguments.
 */

export function registerWebModule<
  EventsMap extends Record<never, never>,
  ModuleType extends typeof NativeModule<EventsMap>,
>(moduleImplementation: ModuleType, moduleName: string): ModuleType {
  ensureNativeModulesAreInstalled();

  moduleName = moduleName ?? moduleImplementation.name;
  if (!moduleName) {
    throw new Error(
      'Web module implementation is missing a name - it is either not a class or has been minified. Pass the name as a second argument to the `registerWebModule` function.'
    );
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
