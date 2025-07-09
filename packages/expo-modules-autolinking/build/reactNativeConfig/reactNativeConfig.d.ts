import type { SupportedPlatform } from '../types';
import type { RNConfigCommandOptions, RNConfigDependency, RNConfigReactNativeAppProjectConfig, RNConfigReactNativeProjectConfig, RNConfigResult } from './reactNativeConfig.types';
/**
 * Create config for react-native core autolinking.
 */
export declare function createReactNativeConfigAsync({ platform, projectRoot, searchPaths, transitiveLinkingDependencies, }: RNConfigCommandOptions): Promise<RNConfigResult>;
/**
 * Find all dependencies and their directories from the project.
 */
export declare function findDependencyRootsAsync(projectRoot: string, searchPaths: string[]): Promise<Record<string, string>>;
export declare function resolveDependencyConfigAsync(platform: SupportedPlatform, name: string, packageRoot: string, projectConfig: RNConfigReactNativeProjectConfig | null): Promise<RNConfigDependency | null>;
export declare function resolveEdgeToEdgeDependencyRoot(projectRoot: string): string | null;
export declare function resolveAppProjectConfigAsync(projectRoot: string, platform: SupportedPlatform): Promise<RNConfigReactNativeAppProjectConfig>;
