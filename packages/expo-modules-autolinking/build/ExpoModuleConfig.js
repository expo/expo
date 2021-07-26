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
    iosModulesClassNames() {
        var _a, _b;
        return (_b = (_a = this.rawConfig.ios) === null || _a === void 0 ? void 0 : _a.modulesClassNames) !== null && _b !== void 0 ? _b : [];
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