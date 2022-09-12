export declare function createProxyForNativeModules(NativeModules: any): any;
/**
 * Disable the error thrown when trying to access a native module that doesn't exist in the host
 * runtime. If a module name or array of module names is provided, this method disables the error
 * for only those modules, erasing a previous setting if one exists. If no parameter is provided,
 * this method disables the error for all modules.
 *
 * @param moduleNames Name of module or modules for which to disable the missing native module
 * error. If this parameter is omitted, the error will be disabled globally.
 */
export declare function disableMissingNativeModuleErrors(moduleNames?: string[] | string): void;
/**
 * Access a native module without throwing an error if it doesn't exist.
 *
 * @param moduleName Name of module to access
 * @returns Corresponding native module object, or null if it doesn't exist
 */
export declare function getNativeModuleIfExists(moduleName: string): any;
//# sourceMappingURL=NativeModules.d.ts.map