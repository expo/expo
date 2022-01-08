import NativeModulesProxy from './NativeModulesProxy';
/**
 * Imports the object representing the module with given name. In the first place it tries to load
 * the module installed through the JSI and if it wasn't found then from the bridge proxy module.
 * Notice that the modules loaded from the proxy may not support some features like synchronous functions.
 */
export function requireNativeModule(moduleName) {
    return global.ExpoModules?.[moduleName] ?? NativeModulesProxy[moduleName] ?? {};
}
//# sourceMappingURL=requireNativeModule.js.map