import { SharedRef } from 'expo';
import { ImageResult, SaveOptions } from '../ImageManipulator.types';
export default class ImageManipulatorImageRef extends SharedRef<'image'> {
    readonly nativeRefType: string;
    readonly uri: string;
    readonly width: number;
    readonly height: number;
    constructor(uri: string, width: number, height: number);
    saveAsync(options?: SaveOptions): Promise<ImageResult>;
}
//# sourceMappingURL=ImageManipulatorImageRef.web.d.ts.map