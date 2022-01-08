import NativeModulesProxy from './NativeModulesProxy';

declare global {
  // eslint-disable-next-line no-var
  var ExpoModules:
    | undefined
    | {
        [key: string]: any;
      };
}

/**
 * Imports the object representing the module with given name. In the first place it tries to load
 * the module installed through the JSI and if it wasn't found then from the bridge proxy module.
 * Notice that the modules loaded from the proxy may not support some features like synchronous functions.
 */
export function requireNativeModule<ModuleType = any>(moduleName: string): ModuleType {
  return global.ExpoModules?.[moduleName] ?? NativeModulesProxy[moduleName] ?? {};
}
