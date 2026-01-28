import type { ExpoConfig } from 'expo/config';
/**
 * Tries to find specified plugin in the expo config or package.json dependencies
 */
export declare const checkPlugin: (config: ExpoConfig, pluginName: string) => boolean;
