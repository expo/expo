import { ExpoConfig } from './Config.types';
/**
 * Resolve the Expo SDK Version either from the input Expo config or from the installed
 * version of the `expo` package.
 */
export declare function getExpoSDKVersion(projectRoot: string, exp?: Pick<ExpoConfig, 'sdkVersion'>): string;
