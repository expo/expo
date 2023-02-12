import { ExpoConfig } from '@expo/config-types';
import { InfoPlist } from './IosConfig.types';
export declare const withVersion: import("..").ConfigPlugin<void>;
export declare const withBuildNumber: import("..").ConfigPlugin<void>;
export declare function getVersion(config: Pick<ExpoConfig, 'version'>): string;
export declare function setVersion(config: Pick<ExpoConfig, 'version'>, infoPlist: InfoPlist): InfoPlist;
export declare function getBuildNumber(config: Pick<ExpoConfig, 'ios'>): string;
export declare function setBuildNumber(config: Pick<ExpoConfig, 'ios'>, infoPlist: InfoPlist): InfoPlist;
