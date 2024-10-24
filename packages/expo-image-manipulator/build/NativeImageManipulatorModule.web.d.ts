import { NativeModule } from 'expo';
import ImageManipulatorContext from './web/ImageManipulatorContext.web';
import ImageManipulatorImageRef from './web/ImageManipulatorImageRef.web';
declare class ImageManipulator extends NativeModule {
    Context: typeof ImageManipulatorContext;
    Image: typeof ImageManipulatorImageRef;
    manipulate(uri: string): ImageManipulatorContext;
}
declare const _default: typeof ImageManipulator;
export default _default;
//# sourceMappingURL=NativeImageManipulatorModule.web.d.ts.map