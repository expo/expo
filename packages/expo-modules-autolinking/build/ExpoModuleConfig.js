"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAndResolveExpoModuleConfig = exports.ExpoModuleConfig = void 0;
function arrayize(value) {
    if (Array.isArray(value)) {
        return value;
    }
    return value != null ? [value] : [];
}
/**
 * A class that wraps the raw config (`expo-module.json` or `unimodule.json`).
 */
class ExpoModuleConfig {
    constructor(rawConfig) {
        this.rawConfig = rawConfig;
    }
    /**
     * Whether the module supports given platform.
     */
    supportsPlatform(platform) {
        return this.rawConfig.platforms?.includes(platform) ?? false;
    }
    /**
     * Returns a list of names of Swift native modules classes to put to the generated modules provider file.
     */
    iosModules() {
        const iosConfig = this.rawConfig.ios;
        // `modulesClassNames` is a legacy name for the same config.
        return iosConfig?.modules ?? iosConfig?.modulesClassNames ?? [];
    }
    /**
     * Returns a list of names of Swift classes that receives AppDelegate life-cycle events.
     */
    iosAppDelegateSubscribers() {
        return this.rawConfig.ios?.appDelegateSubscribers ?? [];
    }
    /**
     * Returns a list of names of Swift classes that implement `ExpoReactDelegateHandler`.
     */
    iosReactDelegateHandlers() {
        return this.rawConfig.ios?.reactDelegateHandlers ?? [];
    }
    /**
     * Returns podspec paths defined by the module author.
     */
    iosPodspecPaths() {
        return arrayize(this.rawConfig.ios?.podspecPath);
    }
    /**
     * Returns the product module names, if defined by the module author.
     */
    iosSwiftModuleNames() {
        return arrayize(this.rawConfig.ios?.swiftModuleName);
    }
    /**
     * Returns whether this module will be added only to the debug configuration
     */
    iosDebugOnly() {
        return this.rawConfig.ios?.debugOnly ?? false;
    }
    /**
     * Returns a list of names of Kotlin native modules classes to put to the generated package provider file.
     */
    androidModules() {
        const androidConfig = this.rawConfig.android;
        // `modulesClassNames` is a legacy name for the same config.
        return androidConfig?.modules ?? androidConfig?.modulesClassNames ?? [];
    }
    /**
     * Returns build.gradle file paths defined by the module author.
     */
    androidGradlePaths() {
        return arrayize(this.rawConfig.android?.gradlePath ?? []);
    }
    /**
     * Returns serializable raw config.
     */
    toJSON() {
        return this.rawConfig;
    }
}
exports.ExpoModuleConfig = ExpoModuleConfig;
/**
 * Reads the config at given path and returns the config wrapped by `ExpoModuleConfig` class.
 */
function requireAndResolveExpoModuleConfig(path) {
    // TODO: Validate the raw config against a schema.
    // TODO: Support for `*.js` files, not only static `*.json`.
    return new ExpoModuleConfig(require(path));
}
exports.requireAndResolveExpoModuleConfig = requireAndResolveExpoModuleConfig;
//# sourceMappingURL=ExpoModuleConfig.js.map