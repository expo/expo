import { ExpoConfig } from 'expo/config';
import { InfoPlist, ConfigPlugin } from 'expo/config-plugins';
export declare const withIosUserInterfaceStyle: ConfigPlugin;
export declare function getUserInterfaceStyle(config: Pick<ExpoConfig, 'ios' | 'userInterfaceStyle'>): string;
export declare function setUserInterfaceStyle(config: Pick<ExpoConfig, 'ios' | 'userInterfaceStyle'>, { UIUserInterfaceStyle, ...infoPlist }: InfoPlist): InfoPlist;
