"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpoModuleConfig = exports.ExpoAndroidProjectConfig = void 0;
exports.requireAndResolveExpoModuleConfig = requireAndResolveExpoModuleConfig;
function arrayize(value) {
    if (Array.isArray(value)) {
        return value;
    }
    return value != null ? [value] : [];
}
class ExpoAndroidProjectConfig {
    name;
    path;
    modules;
    publication;
    gradleAarProjects;
    shouldUsePublicationScriptPath;
    isDefault;
    constructor(name, path, modules, publication, gradleAarProjects, shouldUsePublicationScriptPath, 
    /**
     * Whether this project is the root one.
     */
    isDefault = false) {
        this.name = name;
        this.path = path;
        this.modules = modules;
        this.publication = publication;
        this.gradleAarProjects = gradleAarProjects;
        this.shouldUsePublicationScriptPath = shouldUsePublicationScriptPath;
        this.isDefault = isDefault;
    }
}
exports.ExpoAndroidProjectConfig = ExpoAndroidProjectConfig;
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
        return appleConfig?.modules ?? [];
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
     * Returns information about Android projects defined by the module author.
     */
    androidProjects(defaultProjectName) {
        const androidProjects = [];
        // Adding the "root" Android project - it might not be valide.
        androidProjects.push(new ExpoAndroidProjectConfig(this.rawConfig.android?.name ?? defaultProjectName, this.rawConfig.android?.path ?? 'android', this.rawConfig.android?.modules, this.rawConfig.android?.publication, this.rawConfig.android?.gradleAarProjects, this.rawConfig.android?.shouldUsePublicationScriptPath, !this.rawConfig.android?.path // it's default project because path is not defined
        ));
        this.rawConfig.android?.projects?.forEach((project) => {
            androidProjects.push(new ExpoAndroidProjectConfig(project.name, project.path, project.modules, project.publication, project.gradleAarProjects, project.shouldUsePublicationScriptPath));
        });
        return androidProjects;
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
     * Returns the publication config for Android.
     */
    androidPublication() {
        return this.rawConfig.android?.publication;
    }
    /**
     * Returns core features required by the module author.
     */
    coreFeatures() {
        return arrayize(this.rawConfig.coreFeatures ?? []);
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
//# sourceMappingURL=ExpoModuleConfig.js.map