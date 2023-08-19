import { UnloadFontOptions } from './Font';
import { FontResource } from './Font.types';
declare const _default: {
    readonly name: string;
    unloadAllAsync(): Promise<void>;
    unloadAsync(fontFamilyName: string, options?: UnloadFontOptions): Promise<void>;
    getServerResources(): string[];
    resetServerContext(): void;
    isLoaded(fontFamilyName: string, resource?: UnloadFontOptions): boolean;
    loadAsync(fontFamilyName: string, resource: FontResource): Promise<void>;
};
export default _default;
export declare function _createWebFontTemplate(fontFamily: string, resource: FontResource): string;
//# sourceMappingURL=ExpoFontLoader.web.d.ts.map