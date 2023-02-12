import { AndroidConfig, ConfigPlugin } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
export declare const withAndroidBranch: ConfigPlugin;
export declare function getBranchApiKey(config: ExpoConfig): string | null;
export declare function setBranchApiKey(config: ExpoConfig, androidManifest: AndroidConfig.Manifest.AndroidManifest): AndroidConfig.Manifest.AndroidManifest;
