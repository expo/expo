import { ConfigPlugin, InfoPlist } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
import { IOSSplashConfig } from './getIosSplashConfig';
export declare const withIosSplashInfoPlist: ConfigPlugin<IOSSplashConfig>;
export declare function setSplashInfoPlist(config: ExpoConfig, infoPlist: InfoPlist, splash: IOSSplashConfig): InfoPlist;
