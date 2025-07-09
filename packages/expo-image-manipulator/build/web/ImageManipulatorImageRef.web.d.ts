import { SharedRef } from 'expo';
import { ImageResult, SaveOptions } from '../ImageManipulator.types';
export default class ImageManipulatorImageRef extends SharedRef<'image'> {
    readonly nativeRefType: string;
    readonly uri: string;
    readonly canvas: HTMLCanvasElement;
    constructor(uri: string, canvas: HTMLCanvasElement);
    get width(): number;
    get height(): number;
    saveAsync(options?: SaveOptions): Promise<ImageResult>;
}
//# sourceMappingURL=ImageManipulatorImageRef.web.d.ts.map