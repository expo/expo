import { ExpoConfig } from 'expo/config';
import { AndroidConfig, ConfigPlugin } from 'expo/config-plugins';
export declare const withBranchAndroid: ConfigPlugin;
export declare function getBranchApiKey(config: ExpoConfig): string | null;
export declare function setBranchApiKey(config: ExpoConfig, androidManifest: AndroidConfig.Manifest.AndroidManifest): AndroidConfig.Manifest.AndroidManifest;
