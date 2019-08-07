import { Asset } from 'expo-asset';
/**
 * A font source can be a URI, a module ID, or an Expo Asset.
 */
export declare type FontSource = string | number | Asset | FontResource;
export declare enum FontDisplay {
    AUTO = "auto",
    BLOCK = "block",
    SWAP = "swap",
    FALLBACK = "fallback",
    OPTIONAL = "optional"
}
export interface FontResource {
    uri: string | number;
    display?: FontDisplay;
}
