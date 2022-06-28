import { AndroidConfig, ConfigPlugin } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
export declare const withAndroidAdMob: ConfigPlugin;
export declare function getGoogleMobileAdsAppId(config: Pick<ExpoConfig, 'android'>): string | null;
export declare function getGoogleMobileAdsAutoInit(config: Pick<ExpoConfig, 'android'>): boolean;
export declare function setAdMobConfig(config: Pick<ExpoConfig, 'android'>, androidManifest: AndroidConfig.Manifest.AndroidManifest): AndroidConfig.Manifest.AndroidManifest;
