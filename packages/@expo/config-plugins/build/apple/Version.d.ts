import { ExpoConfig } from '@expo/config-types';
import { InfoPlist } from './AppleConfig.types';
export declare const withVersion: (applePlatform: 'ios' | 'macos') => import("..").ConfigPlugin;
export declare const withBuildNumber: (applePlatform: 'ios' | 'macos') => import("..").ConfigPlugin;
export declare function getVersion(config: Pick<ExpoConfig, 'version'>): string;
export declare function setVersion(config: Pick<ExpoConfig, 'version'>, infoPlist: InfoPlist): InfoPlist;
export declare const getBuildNumber: (applePlatform: 'ios' | 'macos') => (config: Pick<ExpoConfig, "ios" | "macos">) => string | undefined;
export declare const setBuildNumber: (applePlatform: 'ios' | 'macos') => (config: Pick<ExpoConfig, "ios" | "macos">, infoPlist: InfoPlist) => InfoPlist;
