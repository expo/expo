import { Asset } from 'expo-asset';
import { FontSource } from './FontTypes';
/**
 * A font source can be a URI, a module ID, or an Expo Asset.
 */
export declare type FontSource = string | number | Asset;
export declare function fontFamilyNeedsScoping(name: string): boolean;
export declare function getAssetForSource(source: FontSource): Asset;
export declare function loadSingleFontAsync(name: string, asset: Asset): Promise<void>;
export declare function getNativeFontName(name: string): string;
