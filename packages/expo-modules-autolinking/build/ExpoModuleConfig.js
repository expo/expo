"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAndResolveExpoModuleConfig = exports.ExpoModuleConfig = void 0;
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
        var _a, _b;
        return (_b = (_a = this.rawConfig.platforms) === null || _a === void 0 ? void 0 : _a.includes(platform)) !== null && _b !== void 0 ? _b : false;
    }
    /**
     * Returns a list of names of Swift native modules classes to put to the generated modules provider file.
     */
    iosModules() {
        var _a, _b;
        const iosConfig = this.rawConfig.ios;
        // `modulesClassNames` is a legacy name for the same config.
        return (_b = (_a = iosConfig === null || iosConfig === void 0 ? void 0 : iosConfig.modules) !== null && _a !== void 0 ? _a : iosConfig === null || iosConfig === void 0 ? void 0 : iosConfig.modulesClassNames) !== null && _b !== void 0 ? _b : [];
    }
    /**
     * Returns a list of names of Swift classes that receives AppDelegate life-cycle events.
     */
    iosAppDelegateSubscribers() {
        var _a, _b;
        return (_b = (_a = this.rawConfig.ios) === null || _a === void 0 ? void 0 : _a.appDelegateSubscribers) !== null && _b !== void 0 ? _b : [];
    }
    /**
     * Returns a list of names of Swift classes that implement `ExpoReactDelegateHandler`.
     */
    iosReactDelegateHandlers() {
        var _a, _b;
        return (_b = (_a = this.rawConfig.ios) === null || _a === void 0 ? void 0 : _a.reactDelegateHandlers) !== null && _b !== void 0 ? _b : [];
    }
    /**
     * Returns podspec paths defined by the module author.
     */
    iosPodspecPath() {
        var _a;
        return (_a = this.rawConfig.ios) === null || _a === void 0 ? void 0 : _a.podspecPath;
    }
    /**
     * Returns the product module names, if defined by the module author.
     */
    iosSwiftModuleName() {
        var _a;
        return (_a = this.rawConfig.ios) === null || _a === void 0 ? void 0 : _a.swiftModuleName;
    }
    /**
     * Returns a list of names of Kotlin native modules classes to put to the generated package provider file.
     */
    androidModules() {
        var _a, _b;
        const androidConfig = this.rawConfig.android;
        // `modulesClassNames` is a legacy name for the same config.
        return (_b = (_a = androidConfig === null || androidConfig === void 0 ? void 0 : androidConfig.modules) !== null && _a !== void 0 ? _a : androidConfig === null || androidConfig === void 0 ? void 0 : androidConfig.modulesClassNames) !== null && _b !== void 0 ? _b : [];
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