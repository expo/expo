import type { SupportedPlatform } from '../types';
import type { RNConfigDependency, RNConfigReactNativeAppProjectConfig, RNConfigReactNativeProjectConfig, RNConfigResult } from './reactNativeConfig.types';
import { AutolinkingOptions } from '../commands/autolinkingOptions';
import { DependencyResolution } from '../dependencies';
export declare function resolveReactNativeModule(resolution: DependencyResolution, projectConfig: RNConfigReactNativeProjectConfig | null, platform: SupportedPlatform, excludeNames: Set<string>): Promise<RNConfigDependency | null>;
interface CreateRNConfigParams {
    appRoot: string;
    sourceDir: string | undefined;
    autolinkingOptions: AutolinkingOptions & {
        platform: SupportedPlatform;
    };
}
/**
 * Create config for react-native core autolinking.
 */
export declare function createReactNativeConfigAsync({ appRoot, sourceDir, autolinkingOptions, }: CreateRNConfigParams): Promise<RNConfigResult>;
export declare function resolveAppProjectConfigAsync(projectRoot: string, platform: SupportedPlatform, sourceDir?: string): Promise<RNConfigReactNativeAppProjectConfig>;
export {};
