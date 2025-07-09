import { ExpoConfig } from '@expo/config-types';
import { AndroidManifest } from './Manifest';
export declare const SCREEN_ORIENTATION_ATTRIBUTE = "android:screenOrientation";
export declare const withOrientation: import("..").ConfigPlugin;
export declare function getOrientation(config: Pick<ExpoConfig, 'orientation'>): "default" | "portrait" | "landscape" | null;
export declare function setAndroidOrientation(config: Pick<ExpoConfig, 'orientation'>, androidManifest: AndroidManifest): AndroidManifest;
