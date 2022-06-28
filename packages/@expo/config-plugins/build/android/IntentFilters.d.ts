import { Android, ExpoConfig } from '@expo/config-types';
import { AndroidManifest, ManifestIntentFilter } from './Manifest';
declare type AndroidIntentFilters = NonNullable<Android['intentFilters']>;
export declare const withAndroidIntentFilters: import("..").ConfigPlugin<void>;
export declare function getIntentFilters(config: Pick<ExpoConfig, 'android'>): AndroidIntentFilters;
export declare function setAndroidIntentFilters(config: Pick<ExpoConfig, 'android'>, androidManifest: AndroidManifest): AndroidManifest;
export default function renderIntentFilters(intentFilters: AndroidIntentFilters): ManifestIntentFilter[];
export {};
