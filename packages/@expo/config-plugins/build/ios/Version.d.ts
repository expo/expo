import { ExpoConfig } from '@expo/config-types';
import { InfoPlist } from './IosConfig.types';
export declare const withVersion: import("..").ConfigPlugin;
export declare const withBuildNumber: import("..").ConfigPlugin;
export declare function getVersion(config: Pick<ExpoConfig, 'version' | 'ios'>): string;
export declare function setVersion(config: Pick<ExpoConfig, 'version' | 'ios'>, infoPlist: InfoPlist): InfoPlist;
export declare function getBuildNumber(config: Pick<ExpoConfig, 'ios'>): string;
export declare function setBuildNumber(config: Pick<ExpoConfig, 'ios'>, infoPlist: InfoPlist): InfoPlist;
