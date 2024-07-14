import { ExpoConfig } from '@expo/config-types';
import { InfoPlist } from './AppleConfig.types';
export declare const withVersion: (applePlatform: 'ios' | 'macos') => import("..").ConfigPlugin;
export declare const withBuildNumber: (applePlatform: 'ios' | 'macos') => import("..").ConfigPlugin;
export declare function getVersion(config: Pick<ExpoConfig, 'version'>): string;
export declare function setVersion(config: Pick<ExpoConfig, 'version'>, infoPlist: InfoPlist): InfoPlist;
export declare function getBuildNumber(applePlatform: 'ios' | 'macos', config: Pick<ExpoConfig, typeof applePlatform>): string | undefined;
export declare function setBuildNumber(applePlatform: 'ios' | 'macos', config: Pick<ExpoConfig, typeof applePlatform>, infoPlist: InfoPlist): InfoPlist;
