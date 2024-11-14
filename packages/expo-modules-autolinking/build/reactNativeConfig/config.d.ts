import type { RNConfigReactNativeConfig } from './reactNativeConfig.types';
/**
 * Load the `react-native.config.js` or `react-native.config.ts` from the package.
 */
export declare function loadConfigAsync<T extends RNConfigReactNativeConfig>(packageRoot: string): Promise<T | null>;
