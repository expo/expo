import { ExpoConfig } from '@expo/config-types';
import { AndroidManifest } from './Manifest';
export type IntentFilterProps = {
    actions: string[];
    categories: string[];
    data: {
        scheme: string;
        host?: string;
    }[];
};
export declare const withScheme: import("..").ConfigPlugin<void>;
export declare function getScheme(config: {
    scheme?: string | string[];
}): string[];
export declare function setScheme(config: Pick<ExpoConfig, 'scheme' | 'android'>, androidManifest: AndroidManifest): AndroidManifest;
export declare function getSchemesFromManifest(androidManifest: AndroidManifest, requestedHost?: string | null): string[];
export declare function ensureManifestHasValidIntentFilter(androidManifest: AndroidManifest): boolean;
export declare function hasScheme(scheme: string, androidManifest: AndroidManifest): boolean;
export declare function appendScheme(scheme: string, androidManifest: AndroidManifest): AndroidManifest;
export declare function removeScheme(scheme: string, androidManifest: AndroidManifest): AndroidManifest;
