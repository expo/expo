import { SharedObject } from 'expo';
import ImageManipulatorImageRef from './ImageManipulatorImageRef.web';
import { ActionCrop, ActionExtent, FlipType } from '../ImageManipulator.types';
type ContextLoader = () => HTMLCanvasElement | Promise<HTMLCanvasElement>;
export default class ImageManipulatorContext extends SharedObject {
    private loader;
    private currentTask;
    constructor(loader?: ContextLoader);
    resize(size: {
        width: number;
        height: number;
    }): ImageManipulatorContext;
    rotate(degrees: number): ImageManipulatorContext;
    flip(flipType: FlipType): ImageManipulatorContext;
    crop(rect: ActionCrop['crop']): ImageManipulatorContext;
    extent(options: ActionExtent['extent']): ImageManipulatorContext;
    reset(): ImageManipulatorContext;
    renderAsync(): Promise<ImageManipulatorImageRef>;
    private addTask;
}
export {};
//# sourceMappingURL=ImageManipulatorContext.web.d.ts.map