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
    rawConfig;
    constructor(rawConfig) {
        this.rawConfig = rawConfig;
    }
    /**
     * Whether the module supports given platform.
     */
    supportsPlatform(platform) {
        const supportedPlatforms = this.rawConfig.platforms ?? [];
        if (platform === 'apple') {
            // Apple platform is supported when any of iOS, macOS and tvOS is supported.
            return supportedPlatforms.some((supportedPlatform) => {
                return ['apple', 'ios', 'macos', 'tvos'].includes(supportedPlatform);
            });
        }
        return supportedPlatforms.includes(platform);
    }
    /**
     * Returns the generic config for all Apple platforms with a fallback to the legacy iOS config.
     */
    getAppleConfig() {
        return this.rawConfig.apple ?? this.rawConfig.ios ?? null;
    }
    /**
     * Returns a list of names of Swift native modules classes to put to the generated modules provider file.
     */
    appleModules() {
        const appleConfig = this.getAppleConfig();
        // `modulesClassNames` is a legacy name for the same config.
        return appleConfig?.modules ?? appleConfig?.modulesClassNames ?? [];
    }
    /**
     * Returns a list of names of Swift classes that receives AppDelegate life-cycle events.
     */
    appleAppDelegateSubscribers() {
        return this.getAppleConfig()?.appDelegateSubscribers ?? [];
    }
    /**
     * Returns a list of names of Swift classes that implement `ExpoReactDelegateHandler`.
     */
    appleReactDelegateHandlers() {
        return this.getAppleConfig()?.reactDelegateHandlers ?? [];
    }
    /**
     * Returns podspec paths defined by the module author.
     */
    applePodspecPaths() {
        return arrayize(this.getAppleConfig()?.podspecPath);
    }
    /**
     * Returns the product module names, if defined by the module author.
     */
    appleSwiftModuleNames() {
        return arrayize(this.getAppleConfig()?.swiftModuleName);
    }
    /**
     * Returns whether this module will be added only to the debug configuration
     */
    appleDebugOnly() {
        return this.getAppleConfig()?.debugOnly ?? false;
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
     * Returns gradle plugins descriptors defined by the module author.
     */
    androidGradlePlugins() {
        return arrayize(this.rawConfig.android?.gradlePlugins ?? []);
    }
    /**
     * Returns gradle projects containing AAR files defined by the module author.
     */
    androidGradleAarProjects() {
        return arrayize(this.rawConfig.android?.gradleAarProjects ?? []);
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