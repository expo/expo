import { IOSConfig, InfoPlist, ConfigPlugin } from '@expo/config-plugins';
import { ExpoConfig } from 'expo/config';
export declare const withGeneratedIosScheme: ConfigPlugin;
export declare function setGeneratedIosScheme(config: Pick<ExpoConfig, 'scheme' | 'slug'>, infoPlist: InfoPlist): IOSConfig.InfoPlist;
