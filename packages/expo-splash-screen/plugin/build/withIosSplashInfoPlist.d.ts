import { ExpoConfig } from 'expo/config';
import { ConfigPlugin, InfoPlist } from 'expo/config-plugins';
import { IOSSplashConfig } from './types';
export declare const withIosSplashInfoPlist: ConfigPlugin<IOSSplashConfig>;
export declare function setSplashInfoPlist(config: ExpoConfig, infoPlist: InfoPlist, splash: IOSSplashConfig): InfoPlist;
