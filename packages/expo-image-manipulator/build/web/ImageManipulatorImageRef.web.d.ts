import { SharedRef } from 'expo';
import { ImageResult, SaveOptions } from '../ImageManipulator.types';
export default class ImageManipulatorImageRef extends SharedRef<'image'> {
    private canvas;
    readonly width: number;
    readonly height: number;
    constructor(canvas: HTMLCanvasElement);
    saveAsync(options?: SaveOptions): Promise<ImageResult>;
}
//# sourceMappingURL=ImageManipulatorImageRef.web.d.ts.map