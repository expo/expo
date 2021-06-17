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
        return this.rawConfig.platforms?.includes(platform) ?? false;
    }
    /**
     * Returns a list of names of Swift native modules classes to put to the generated modules provider file.
     */
    iosModulesClassNames() {
        return this.rawConfig.ios?.modulesClassNames ?? [];
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
    return new ExpoModuleConfig(require(path));
}
exports.requireAndResolveExpoModuleConfig = requireAndResolveExpoModuleConfig;
//# sourceMappingURL=ExpoModuleConfig.js.map