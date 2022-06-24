import { ExpoConfig } from '@expo/config-types';
import { AndroidManifest } from './Manifest';
export declare const withAllowBackup: import("..").ConfigPlugin<void>;
export declare function getAllowBackup(config: Pick<ExpoConfig, 'android'>): boolean;
export declare function setAllowBackup(config: Pick<ExpoConfig, 'android'>, androidManifest: AndroidManifest): AndroidManifest;
export declare function getAllowBackupFromManifest(androidManifest: AndroidManifest): boolean | null;
