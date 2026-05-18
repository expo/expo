import type { RNConfigReactNativeConfig } from './reactNativeConfig.types';
type LoadConfigAsync = <T extends RNConfigReactNativeConfig>(packageRoot: string) => Promise<T | null>;
/**
 * Load the `react-native.config.js` or `react-native.config.ts` from the package.
 */
export declare const loadConfigAsync: LoadConfigAsync;
export {};
