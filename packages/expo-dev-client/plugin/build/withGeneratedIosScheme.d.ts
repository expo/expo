import type { ExpoConfig } from 'expo/config';
import { type ConfigPlugin, type InfoPlist, IOSConfig } from 'expo/config-plugins';
export declare const withGeneratedIosScheme: ConfigPlugin;
export declare function setGeneratedIosScheme(config: Pick<ExpoConfig, 'scheme' | 'slug'>, infoPlist: InfoPlist): IOSConfig.InfoPlist;
