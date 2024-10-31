import { NativeModule } from 'expo';
import { SharedRef } from 'expo-modules-core/types';
import ImageManipulatorContext from './web/ImageManipulatorContext.web';
import ImageManipulatorImageRef from './web/ImageManipulatorImageRef.web';
declare class ImageManipulator extends NativeModule {
    Context: typeof ImageManipulatorContext;
    Image: typeof ImageManipulatorImageRef;
    manipulate(source: string | SharedRef<'image'>): ImageManipulatorContext;
}
declare const _default: typeof ImageManipulator;
export default _default;
//# sourceMappingURL=NativeImageManipulatorModule.web.d.ts.map