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
     * Returns serializable raw config.
     */
    toJSON(): RawExpoModuleConfig;
}
/**
 * Reads the config at given path and returns the config wrapped by `ExpoModuleConfig` class.
 */
export declare function requireAndResolveExpoModuleConfig(path: string): ExpoModuleConfig;
