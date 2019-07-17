import { FontSource, FontResource } from './FontTypes.web';
/**
 * A font source can be a URI, a module ID, or an Expo Asset.
 */
export declare function fontFamilyNeedsScoping(name: string): boolean;
export declare function getAssetForSource(source: FontSource): FontResource;
export declare function loadSingleFontAsync(name: string, asset: FontResource): Promise<void>;
export declare function getNativeFontName(name: string): string;
