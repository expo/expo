import { NativeModule } from 'expo-modules-core';
import type { ImageNativeModule, ImageRef, ImageSource } from './Image.types';
declare class ImageModule extends NativeModule implements ImageNativeModule {
    static name: string;
    Image: typeof ImageRef;
    prefetch(urls: string | string[], _: any, __: any): Promise<boolean>;
    clearMemoryCache(): Promise<boolean>;
    clearDiskCache(): Promise<boolean>;
    loadAsync(source: ImageSource): Promise<ImageRef>;
}
declare const _default: typeof ImageModule;
export default _default;
//# sourceMappingURL=ImageModule.web.d.ts.map