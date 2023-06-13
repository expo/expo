import NativeModulesProxy from './NativeModulesProxy';
/**
 * Imports the native module registered with given name. In the first place it tries to load
 * the module installed through the JSI host object and then falls back to the bridge proxy module.
 * Notice that the modules loaded from the proxy may not support some features like synchronous functions.
 *
 * @param moduleName Name of the requested native module.
 * @returns Object representing the native module.
 * @throws Error when there is no native module with given name.
 */
export function requireNativeModule(moduleName) {
    const nativeModule = globalThis.expo?.modules?.[moduleName] ??
        globalThis.ExpoModules?.[moduleName] ??
        NativeModulesProxy[moduleName];
    if (!nativeModule) {
        throw new Error(`Cannot find native module '${moduleName}'`);
    }
    return nativeModule;
}
//# sourceMappingURL=requireNativeModule.js.map