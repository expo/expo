import { AndroidGradlePluginDescriptor, RawExpoModuleConfig, RawModuleConfigApple, SupportedPlatform } from './types';
/**
 * A class that wraps the raw config (`expo-module.json` or `unimodule.json`).
 */
export declare class ExpoModuleConfig {
    readonly rawConfig: RawExpoModuleConfig;
    constructor(rawConfig: RawExpoModuleConfig);
    /**
     * Whether the module supports given platform.
     */
    supportsPlatform(platform: SupportedPlatform): boolean;
    /**
     * Returns the generic config for all Apple platforms with a fallback to the legacy iOS config.
     */
    getAppleConfig(): RawModuleConfigApple | null;
    /**
     * Returns a list of names of Swift native modules classes to put to the generated modules provider file.
     */
    appleModules(): string[];
    /**
     * Returns a list of names of Swift classes that receives AppDelegate life-cycle events.
     */
    appleAppDelegateSubscribers(): string[];
    /**
     * Returns a list of names of Swift classes that implement `ExpoReactDelegateHandler`.
     */
    appleReactDelegateHandlers(): string[];
    /**
     * Returns podspec paths defined by the module author.
     */
    applePodspecPaths(): string[];
    /**
     * Returns the product module names, if defined by the module author.
     */
    appleSwiftModuleNames(): string[];
    /**
     * Returns whether this module will be added only to the debug configuration
     */
    appleDebugOnly(): boolean;
    /**
     * Returns a list of names of Kotlin native modules classes to put to the generated package provider file.
     */
    androidModules(): string[];
    /**
     * Returns build.gradle file paths defined by the module author.
     */
    androidGradlePaths(): string[];
    /**
     * Returns gradle plugins descriptors defined by the module author.
     */
    androidGradlePlugins(): AndroidGradlePluginDescriptor[];
    /**
     * Returns serializable raw config.
     */
    toJSON(): RawExpoModuleConfig;
}
/**
 * Reads the config at given path and returns the config wrapped by `ExpoModuleConfig` class.
 */
export declare function requireAndResolveExpoModuleConfig(path: string): ExpoModuleConfig;
