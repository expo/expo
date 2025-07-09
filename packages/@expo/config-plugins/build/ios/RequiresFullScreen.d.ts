import { ExpoConfig } from '@expo/config-types';
import { InfoPlist } from './IosConfig.types';
export declare const withRequiresFullScreen: import("..").ConfigPlugin;
export declare function setRequiresFullScreen(config: Pick<ExpoConfig, 'ios'>, infoPlist: InfoPlist): InfoPlist;
