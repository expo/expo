import type { ExpoConfig } from 'expo/config';
import type { HashSource, NormalizedOptions } from '../Fingerprint.types';
export declare function getExpoConfigSourcesAsync(projectRoot: string, options: NormalizedOptions): Promise<HashSource[]>;
export declare function getEasBuildSourcesAsync(projectRoot: string, options: NormalizedOptions): Promise<HashSource[]>;
export declare function getExpoAutolinkingAndroidSourcesAsync(projectRoot: string, options: NormalizedOptions, expoAutolinkingVersion: string): Promise<HashSource[]>;
/**
 * Gets the patch sources for the `patch-project`.
 */
export declare function getExpoCNGPatchSourcesAsync(projectRoot: string, options: NormalizedOptions): Promise<HashSource[]>;
export declare function getExpoAutolinkingIosSourcesAsync(projectRoot: string, options: NormalizedOptions, expoAutolinkingVersion: string): Promise<HashSource[]>;
/**
 * Sort the expo-modules-autolinking android config to make it stable from hashing.
 */
export declare function sortExpoAutolinkingAndroidConfig(config: Record<string, any>): Record<string, any>;
/**
 * Get the props for a config-plugin
 */
export declare function getConfigPluginProps<Props>(config: ExpoConfig, pluginName: string): Props | null;
