import { Asset } from 'expo-asset';
/**
 * A font source can be a URI, a module ID, or an Expo Asset.
 */
declare type FontSource = string | number | Asset;
/**
 * Used to transform font family names to the scoped name. This does not need to
 * be called in standalone or bare apps but it will return unscoped font family
 * names if it is called in those contexts.
 * note(brentvatne): at some point we may want to warn if this is called
 * outside of a managed app.
 */
export declare function processFontFamily(name: string | null): string | null;
export declare function isLoaded(name: string): boolean;
export declare function isLoading(name: string): boolean;
export declare function loadAsync(nameOrMap: string | {
    [name: string]: FontSource;
}, source?: FontSource): Promise<void>;
export {};
