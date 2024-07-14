import { ExpoConfig } from '@expo/config-types';
import { InfoPlist } from './AppleConfig.types';
export declare const withRequiresFullScreen: (applePlatform: 'ios' | 'macos') => import("..").ConfigPlugin;
export declare function getRequiresFullScreen(applePlatform: 'ios' | 'macos', config: Pick<ExpoConfig, typeof applePlatform | 'sdkVersion'>): boolean;
export declare function setRequiresFullScreen(applePlatform: 'ios' | 'macos', config: Pick<ExpoConfig, typeof applePlatform>, infoPlist: InfoPlist): InfoPlist;
