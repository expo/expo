import { ConfigPlugin, InfoPlist } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
export declare const withIosRootViewBackgroundColor: ConfigPlugin;
export declare function setRootViewBackgroundColor(config: Pick<ExpoConfig, 'backgroundColor' | 'ios'>, infoPlist: InfoPlist): InfoPlist;
export declare function getRootViewBackgroundColor(config: Pick<ExpoConfig, 'ios' | 'backgroundColor'>): string | null;
