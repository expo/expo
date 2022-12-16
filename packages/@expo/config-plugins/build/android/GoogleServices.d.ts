import { ExpoConfig } from '@expo/config-types';
import { ConfigPlugin } from '../Plugin.types';
export declare const withClassPath: ConfigPlugin;
export declare const withApplyPlugin: ConfigPlugin;
/**
 * Add `google-services.json` to project
 */
export declare const withGoogleServicesFile: ConfigPlugin;
export declare function getGoogleServicesFilePath(config: Pick<ExpoConfig, 'android'>): string | null;
export declare function setGoogleServicesFile(config: Pick<ExpoConfig, 'android'>, projectRoot: string, targetPath?: string): Promise<boolean>;
/**
 * Adding the Google Services plugin
 * NOTE(brentvatne): string replacement is a fragile approach! we need a
 * better solution than this.
 */
export declare function setClassPath(config: Pick<ExpoConfig, 'android'>, buildGradle: string): string;
export declare function applyPlugin(config: Pick<ExpoConfig, 'android'>, appBuildGradle: string): string;
