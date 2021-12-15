import { RawExpoModuleConfig, SupportedPlatform } from './types';
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
     * Returns a list of names of Swift native modules classes to put to the generated modules provider file.
     */
    iosModulesClassNames(): string[];
    /**
     * Returns a list of names of Swift classes that receives AppDelegate life-cycle events.
     */
    iosAppDelegateSubscribers(): string[];
    /**
     * Returns a list of names of Swift classes that implement `ExpoReactDelegateHandler`.
     */
    iosReactDelegateHandlers(): string[];
    /**
     * Returns a podspec path defined by the module author.
     */
    iosPodspecPath(): string | undefined;
    /**
     * Returns a list of names of Kotlin native modules classes to put to the generated package provider file.
     */
    androidModulesClassNames(): string[];
    /**
     * Returns serializable raw config.
     */
    toJSON(): RawExpoModuleConfig;
}
/**
 * Reads the config at given path and returns the config wrapped by `ExpoModuleConfig` class.
 */
export declare function requireAndResolveExpoModuleConfig(path: string): ExpoModuleConfig;
