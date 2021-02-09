import { FontResource } from './Font.types';
declare const _default: {
    readonly name: string;
    unloadAllAsync(): Promise<void>;
    unloadAsync(fontFamilyName: string, options?: Pick<FontResource, "display"> | undefined): Promise<void>;
    loadAsync(fontFamilyName: string, resource: FontResource): Promise<void>;
};
export default _default;
