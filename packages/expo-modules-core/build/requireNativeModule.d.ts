declare global {
    var ExpoModules: undefined | {
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
export declare function requireNativeModule<ModuleType = any>(moduleName: string): ModuleType;
//# sourceMappingURL=requireNativeModule.d.ts.map