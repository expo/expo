import { NativeModule } from 'expo-modules-core';
import { ImageCacheConfig, type ImageNativeModule, ImageRef, ImageSource } from './Image.types';
declare class ImageModule extends NativeModule implements ImageNativeModule {
    Image: typeof ImageRef;
    prefetch(urls: string | string[], _: unknown, __: unknown): Promise<boolean>;
    clearMemoryCache(): Promise<boolean>;
    clearDiskCache(): Promise<boolean>;
    configureCache(_: ImageCacheConfig): void;
    loadAsync(source: ImageSource): Promise<ImageRef>;
    getCachePathAsync(_: string): Promise<string | null>;
    generateBlurhashAsync(_: string | ImageRef, __: [number, number] | {
        width: number;
        height: number;
    }): Promise<string | null>;
    generateThumbhashAsync(_: string | ImageRef): Promise<string>;
}
declare const _default: typeof ImageModule;
export default _default;
//# sourceMappingURL=ImageModule.web.d.ts.map