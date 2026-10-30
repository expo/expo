import { TurboModuleRegistry } from 'react-native';

import NativeModulesProxy from './NativeModulesProxy';
import { createTurboModuleToExpoProxy } from './TurboModuleToExpoModuleProxy';
import { ensureNativeModulesAreInstalled } from './ensureNativeModulesAreInstalled';

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

  try {
    return (
      globalThis.expo?.modules?.[moduleName] ??
      NativeModulesProxy[moduleName] ??
      createTurboModuleToExpoProxy(TurboModuleRegistry.get(moduleName) ?? null, moduleName) ??
      null
    );
  } catch (e) {
    const error = e as Error;
    console.warn(`An error occurred while requiring the '${moduleName}' module: ${error.message}`);
    return null;
  }
}

/**
 * Imports the native modules and shared object classes of the npm package with the given name,
 * installed as `expo.packages[packageName]`. Modules from the app's `modules` directory and inline
 * modules are in the `$local` package.
 *
 * @param packageName Name of the npm package that provides the native modules, or `$local`.
 * @returns Object with the package's native modules and shared object classes, keyed by their names.
 * @throws Error when the package has no native modules.
 */
export function requireNative<PackageType = any>(packageName: string): PackageType {
  const nativePackage = requireOptionalNative<PackageType>(packageName);

  if (!nativePackage) {
    throw new Error(
      `Cannot find native modules of the '${packageName}' package. ` +
        `Make sure the package is installed and rebuild the app, because native code changes require a new build.`
    );
  }
  return nativePackage;
}

/**
 * Imports the native modules and shared object classes of the npm package with the given name.
 * The same as `requireNative`, but returns `null` when the package has no native modules instead of throwing an error.
 *
 * @param packageName Name of the npm package that provides the native modules, or `$local`.
 * @returns Object with the package's native modules and shared object classes, or `null` when it cannot be found.
 */
export function requireOptionalNative<PackageType = any>(packageName: string): PackageType | null {
  ensureNativeModulesAreInstalled();
  return globalThis.expo?.packages?.[packageName] ?? null;
}
