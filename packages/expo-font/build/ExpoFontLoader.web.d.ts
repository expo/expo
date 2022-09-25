import { UnloadFontOptions } from './Font';
import { FontResource } from './Font.types';
declare const _default: {
    readonly name: string;
    unloadAllAsync(): Promise<void>;
    unloadAsync(fontFamilyName: string, options?: UnloadFontOptions | undefined): Promise<void>;
    loadAsync(fontFamilyName: string, resource: FontResource): Promise<void>;
};
export default _default;
//# sourceMappingURL=ExpoFontLoader.web.d.ts.map