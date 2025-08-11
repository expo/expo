import type { SupportedPlatform } from '../types';
import type { RNConfigCommandOptions, RNConfigDependency, RNConfigReactNativeAppProjectConfig, RNConfigReactNativeProjectConfig, RNConfigResult } from './reactNativeConfig.types';
import { DependencyResolution } from '../dependencies';
export declare function resolveReactNativeModule(resolution: DependencyResolution, projectConfig: RNConfigReactNativeProjectConfig | null, platform: SupportedPlatform, excludeNames: Set<string>): Promise<RNConfigDependency | null>;
/**
 * Create config for react-native core autolinking.
 */
export declare function createReactNativeConfigAsync(providedOptions: RNConfigCommandOptions): Promise<RNConfigResult>;
export declare function resolveAppProjectConfigAsync(projectRoot: string, platform: SupportedPlatform, sourceDir?: string): Promise<RNConfigReactNativeAppProjectConfig>;
