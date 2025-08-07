import type { RNConfigDependencyIos, RNConfigReactNativePlatformsConfigIos } from './reactNativeConfig.types';
export declare function resolveDependencyConfigImplIosAsync(resolution: {
    path: string;
    version: string;
}, reactNativeConfig: RNConfigReactNativePlatformsConfigIos | null | undefined): Promise<RNConfigDependencyIos | null>;
