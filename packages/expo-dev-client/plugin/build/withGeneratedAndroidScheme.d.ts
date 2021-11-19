import { AndroidManifest, ConfigPlugin } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
export declare const withGeneratedAndroidScheme: ConfigPlugin;
export declare function setGeneratedAndroidScheme(config: Pick<ExpoConfig, 'scheme' | 'slug'>, androidManifest: AndroidManifest): AndroidManifest;
