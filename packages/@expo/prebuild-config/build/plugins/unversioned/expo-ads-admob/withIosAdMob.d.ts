import { ConfigPlugin, InfoPlist } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
export declare const withIosAdMob: ConfigPlugin;
export declare function getGoogleMobileAdsAppId(config: Pick<ExpoConfig, 'ios'>): string | null;
export declare function setGoogleMobileAdsAppId(config: Pick<ExpoConfig, 'ios'>, { GADApplicationIdentifier, ...infoPlist }: InfoPlist): InfoPlist;
