import { ExpoConfig } from '@expo/config-types';
import { InfoPlist } from './AppleConfig.types';
export declare const withRequiresFullScreen: (applePlatform: 'ios' | 'macos') => import("..").ConfigPlugin;
export declare const getRequiresFullScreen: (applePlatform: 'ios' | 'macos') => (config: Pick<ExpoConfig, "ios" | "macos" | "sdkVersion">) => boolean;
export declare const setRequiresFullScreen: (applePlatform: 'ios' | 'macos') => (config: Pick<ExpoConfig, "ios" | "macos">, infoPlist: InfoPlist) => InfoPlist;
