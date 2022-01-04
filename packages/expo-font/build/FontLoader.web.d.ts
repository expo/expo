import { Asset } from 'expo-asset';
import { FontResource, FontSource } from './Font.types';
export declare function fontFamilyNeedsScoping(name: string): boolean;
export declare function getAssetForSource(source: FontSource): Asset | FontResource;
export declare function loadSingleFontAsync(name: string, input: Asset | FontResource): Promise<void>;
export declare function getNativeFontName(name: string): string;
//# sourceMappingURL=FontLoader.web.d.ts.map