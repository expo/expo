import { AppManifest } from 'expo-constants';
export declare const IS_MANAGED_ENV = true;
export declare function getManifest(): AppManifest;
export declare const manifestBaseUrl: string | null;
export declare function downloadAsync(uri: any, hash: any, type: any, name: any): Promise<string>;
