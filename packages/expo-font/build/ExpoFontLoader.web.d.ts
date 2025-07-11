import { NativeModule } from 'expo-modules-core';
import { ExpoFontLoaderModule } from './ExpoFontLoader';
import { UnloadFontOptions } from './Font';
import { FontResource } from './Font.types';
declare class ExpoFontLoader extends NativeModule implements ExpoFontLoaderModule {
    unloadAllAsync(): Promise<void>;
    unloadAsync(fontFamilyName: string, options?: UnloadFontOptions): Promise<void>;
    getServerResources(): string[];
    resetServerContext(): void;
    getLoadedFonts(): string[];
    isLoaded(fontFamilyName: string, resource?: UnloadFontOptions): boolean;
    loadAsync(fontFamilyName: string, resource: FontResource): Promise<void>;
}
declare const _default: typeof ExpoFontLoader;
export default _default;
export declare function _createWebFontTemplate(fontFamily: string, resource: FontResource): string;
//# sourceMappingURL=ExpoFontLoader.web.d.ts.map