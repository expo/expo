import { type NativeModule } from 'expo';
import { type ImageRef, type ImageSource } from './Image.types';
declare class ImageModule extends NativeModule {
    Image: typeof ImageRef;
    loadAsync(source: ImageSource): Promise<ImageRef>;
}
declare const _default: ImageModule;
export default _default;
//# sourceMappingURL=ImageModule.d.ts.map