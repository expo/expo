import { Asset } from 'expo-asset';
/**
 * A font source can be a URI, a module ID, or an Expo Asset.
 */
declare type FontSource = string | number | Asset;
export declare function processFontFamily(name: string | null): string | null;
export declare function isLoaded(name: string): boolean;
export declare function isLoading(name: string): boolean;
export declare function loadAsync(nameOrMap: string | {
    [name: string]: FontSource;
}, source?: FontSource): Promise<void>;
export {};
