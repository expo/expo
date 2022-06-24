import { ExpoConfig } from '@expo/config-types';
import { AndroidManifest } from './Manifest';
export declare const withGoogleMapsApiKey: import("..").ConfigPlugin<void>;
export declare function getGoogleMapsApiKey(config: Pick<ExpoConfig, 'android'>): string | null;
export declare function setGoogleMapsApiKey(config: Pick<ExpoConfig, 'android'>, androidManifest: AndroidManifest): AndroidManifest;
