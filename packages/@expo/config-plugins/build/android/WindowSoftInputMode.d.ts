import type { ExpoConfig } from '@expo/config-types';
import type { AndroidManifest } from './Manifest';
import type { ConfigPlugin } from '../Plugin.types';
export declare const withWindowSoftInputMode: ConfigPlugin;
export declare function setWindowSoftInputModeMode(config: Pick<ExpoConfig, 'android' | 'userInterfaceStyle'>, androidManifest: AndroidManifest): AndroidManifest;
export declare function getWindowSoftInputModeMode(config: Pick<ExpoConfig, 'android'>): string;
