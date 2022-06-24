import { ExpoConfig } from '@expo/config-types';
import { InfoPlist, InterfaceOrientation } from './IosConfig.types';
export declare const withOrientation: import("..").ConfigPlugin<void>;
export declare function getOrientation(config: Pick<ExpoConfig, 'orientation'>): "default" | "portrait" | "landscape" | null;
export declare const PORTRAIT_ORIENTATIONS: InterfaceOrientation[];
export declare const LANDSCAPE_ORIENTATIONS: InterfaceOrientation[];
export declare function setOrientation(config: Pick<ExpoConfig, 'orientation'>, infoPlist: InfoPlist): InfoPlist;
