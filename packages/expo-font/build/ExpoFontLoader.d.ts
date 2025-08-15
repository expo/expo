import { UnloadFontOptions } from './Font.types';
export type ExpoFontLoaderModule = {
    getLoadedFonts: () => string[];
    loadAsync: (fontFamilyName: string, localUriOrWebAsset: any) => Promise<void>;
    unloadAllAsync?: () => Promise<void>;
    unloadAsync?: (fontFamilyName: string, options?: UnloadFontOptions) => Promise<void>;
    isLoaded?: (fontFamilyName: string, options?: UnloadFontOptions) => boolean;
    getServerResources?: () => string[];
    resetServerContext?: () => void;
};
declare const m: ExpoFontLoaderModule;
export default m;
//# sourceMappingURL=ExpoFontLoader.d.ts.map