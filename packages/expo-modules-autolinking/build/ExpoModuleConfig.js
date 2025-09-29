"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.discoverExpoModuleConfigAsync = exports.ExpoModuleConfig = exports.ExpoAndroidProjectConfig = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const utils_1 = require("./utils");
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
        if (platform === 'web') {
            // Web platform is implicitly supported for autolinking resolution but has no special behavior
            return true;
        }
        else if (platform === 'apple') {
            // Apple platform is supported when any of iOS, macOS and tvOS is supported.
            return supportedPlatforms.some((supportedPlatform) => {
                return ['apple', 'ios', 'macos', 'tvos'].includes(supportedPlatform);
            });
        }
        switch (platform) {
            case 'ios':
            case 'macos':
            case 'tvos':
                // ios|macos|tvos are supported when the module supports "apple" as a platform in general
                return supportedPlatforms.includes(platform) || supportedPlatforms.includes('apple');
            default:
                return supportedPlatforms.includes(platform);
        }
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
/** Names of Expo Module config files (highest to lowest priority) */
const EXPO_MODULE_CONFIG_FILENAMES = ['expo-module.config.json', 'unimodule.json'];
exports.discoverExpoModuleConfigAsync = (0, utils_1.memoize)(async function discoverExpoModuleConfigAsync(directoryPath) {
    for (let idx = 0; idx < EXPO_MODULE_CONFIG_FILENAMES.length; idx++) {
        // TODO: Validate the raw config against a schema.
        // TODO: Support for `*.js` files, not only static `*.json`.
        const targetPath = path_1.default.join(directoryPath, EXPO_MODULE_CONFIG_FILENAMES[idx]);
        let text;
        try {
            text = await fs_1.default.promises.readFile(targetPath, 'utf8');
        }
        catch {
            // try the next file
            continue;
        }
        return new ExpoModuleConfig(JSON.parse(text));
    }
    return null;
});
//# sourceMappingURL=ExpoModuleConfig.js.map