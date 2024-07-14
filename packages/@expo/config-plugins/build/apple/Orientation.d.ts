import { ExpoConfig } from '@expo/config-types';
import { InfoPlist, InterfaceOrientation } from './AppleConfig.types';
export declare const withOrientation: (applePlatform: 'ios' | 'macos') => import("..").ConfigPlugin;
export declare function getOrientation(config: Pick<ExpoConfig, 'orientation'>): "default" | "portrait" | "landscape" | null;
export declare const PORTRAIT_ORIENTATIONS: InterfaceOrientation[];
export declare const LANDSCAPE_ORIENTATIONS: InterfaceOrientation[];
export declare function setOrientation(config: Pick<ExpoConfig, 'orientation'>, infoPlist: InfoPlist): InfoPlist;
