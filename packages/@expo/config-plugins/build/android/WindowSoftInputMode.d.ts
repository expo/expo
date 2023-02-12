import { ExpoConfig } from '@expo/config-types';
import { ConfigPlugin } from '../Plugin.types';
import { AndroidManifest } from './Manifest';
export declare const withWindowSoftInputMode: ConfigPlugin;
export declare function setWindowSoftInputModeMode(config: Pick<ExpoConfig, 'android' | 'userInterfaceStyle'>, androidManifest: AndroidManifest): AndroidManifest;
export declare function getWindowSoftInputModeMode(config: Pick<ExpoConfig, 'android'>): string;
