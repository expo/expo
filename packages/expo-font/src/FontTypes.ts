import { Asset } from 'expo-asset';

/**
 * A font source can be a URI, a module ID, or an Expo Asset.
 */
export type FontSource = string | number | Asset | FontResource;

// noop: web only
export enum FontDisplay {
    Auto = 'auto',
}
  
export interface FontResource {
    uri: string | number;
    display?: FontDisplay;
}