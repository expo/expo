import { Asset } from 'expo-asset';
import { FontSource, FontResource } from './Font.types';
export declare function fontFamilyNeedsScoping(name: string): boolean;
export declare function getAssetForSource(source: FontSource): FontResource;
export declare function loadSingleFontAsync(name: string, input: Asset | FontResource): Promise<void>;
export declare function getNativeFontName(name: string): string;
