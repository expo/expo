import { ExpoConfig } from 'expo/config';
import { ConfigPlugin, InfoPlist } from 'expo/config-plugins';
export declare const withIosRootViewBackgroundColor: ConfigPlugin;
export declare function setRootViewBackgroundColor(config: Pick<ExpoConfig, 'backgroundColor' | 'ios'>, infoPlist: InfoPlist): InfoPlist;
export declare function getRootViewBackgroundColor(config: Pick<ExpoConfig, 'ios' | 'backgroundColor'>): string | null;
