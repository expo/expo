import type { RNConfigDependencyIos, RNConfigReactNativePlatformsConfigIos } from './reactNativeConfig.types';
import type { ExpoModuleConfig } from '../ExpoModuleConfig';
export declare function resolveDependencyConfigImplIosAsync(resolution: {
    path: string;
    version: string;
}, reactNativeConfig: RNConfigReactNativePlatformsConfigIos | null | undefined, expoModuleConfig?: ExpoModuleConfig | null): Promise<RNConfigDependencyIos | null>;
