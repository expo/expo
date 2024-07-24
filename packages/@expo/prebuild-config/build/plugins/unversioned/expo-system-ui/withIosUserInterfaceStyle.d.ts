import { InfoPlist } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
export declare const withIosUserInterfaceStyle: import("@expo/config-plugins").ConfigPlugin;
export declare function getUserInterfaceStyle(config: Pick<ExpoConfig, 'ios' | 'userInterfaceStyle'>): string;
export declare function setUserInterfaceStyle(config: Pick<ExpoConfig, 'ios' | 'userInterfaceStyle'>, { UIUserInterfaceStyle, ...infoPlist }: InfoPlist): InfoPlist;
