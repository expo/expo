import type { ExpoModuleConfig } from '../ExpoModuleConfig';
import type { RNConfigReactNativePlatformsConfig, RNConfigDependencyWeb } from './reactNativeConfig.types';
export declare function checkDependencyWebAsync(resolution: {
    path: string;
    version: string;
}, reactNativeConfig: RNConfigReactNativePlatformsConfig | null | undefined, expoModuleConfig?: ExpoModuleConfig | null): Promise<RNConfigDependencyWeb | null>;
