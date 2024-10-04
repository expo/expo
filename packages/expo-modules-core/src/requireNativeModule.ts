import { NativeModules } from 'react-native';

import NativeModulesProxy from './NativeModulesProxy';

type ExpoObject = {
  modules:
    | undefined
    | {
        [key: string]: any;
      };
  uuidv4: () => string;
  uuidv5: (name: string, namespace: string) => string;
};

declare global {
  // eslint-disable-next-line no-var
  var expo: ExpoObject | undefined;

  /**
   * @deprecated `global.ExpoModules` is deprecated, use `global.expo.modules` instead.
   */
  // eslint-disable-next-line no-var
  var ExpoModules:
    | undefined
    | {
        [key: string]: any;
      };
}

/**
 * Imports the native module registered with given name. In the first place it tries to load
 * the module installed through the JSI host object and then falls back to the bridge proxy module.
 * Notice that the modules loaded from the proxy may not support some features like synchronous functions.
 *
 * @param moduleName Name of the requested native module.
 * @returns Object representing the native module.
 * @throws Error when there is no native module with given name.
 */
export function requireNativeModule<ModuleType = any>(moduleName: string): ModuleType {
  const nativeModule = requireOptionalNativeModule<ModuleType>(moduleName);

  if (!nativeModule) {
    throw new Error(`Cannot find native module '${moduleName}'`);
  }
  return nativeModule;
}

/**
 * Imports the native module registered with the given name. The same as `requireNativeModule`,
 * but returns `null` when the module cannot be found instead of throwing an error.
 *
 * @param moduleName Name of the requested native module.
 * @returns Object representing the native module or `null` when it cannot be found.
 */
export function requireOptionalNativeModule<ModuleType = any>(
  moduleName: string
): ModuleType | null {
  ensureNativeModulesAreInstalled();

  return (
    globalThis.expo?.modules?.[moduleName] ??
    globalThis.ExpoModules?.[moduleName] ??
    NativeModulesProxy[moduleName] ??
    null
  );
}

/**
 * Ensures that the native modules are installed in the current runtime.
 * Otherwise, it synchronously calls a native function that installs them.
 */
function ensureNativeModulesAreInstalled(): void {
  if (globalThis.expo) {
    return;
  }
  try {
    // TODO: ExpoModulesCore shouldn't be optional here,
    // but to keep backwards compatibility let's just ignore it in SDK 50.
    // In most cases the modules were already installed from the native side.
    NativeModules.ExpoModulesCore?.installModules();
  } catch (error) {
    console.error(`Unable to install Expo modules: ${error}`);
  }
}
