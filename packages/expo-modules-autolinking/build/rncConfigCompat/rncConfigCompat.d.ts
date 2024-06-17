import type { RncConfigCompatDependencyConfig, RncConfigCompatOptions, RncConfigCompatReactNativeProjectConfig, RncConfigCompatResult } from './rncConfigCompat.types';
import type { SupportedPlatform } from '../types';
/**
 * Create @react-native-community/cli compatible config for autolinking.
 */
export declare function createRncConfigCompatAsync({ platform, projectRoot, searchPaths, }: RncConfigCompatOptions): Promise<RncConfigCompatResult>;
/**
 * Find all dependencies and their directories from the project.
 */
export declare function findDependencyRootsAsync(projectRoot: string, searchPaths: string[]): Promise<Record<string, string>>;
export declare function resolveDependencyConfigAsync(platform: SupportedPlatform, name: string, packageRoot: string, projectConfig: RncConfigCompatReactNativeProjectConfig | null): Promise<RncConfigCompatDependencyConfig | null>;
