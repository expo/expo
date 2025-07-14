import { SharedObject } from 'expo';
import { ActionCrop, ActionExtent, FlipType } from '../ImageManipulator.types';
import ImageManipulatorImageRef from './ImageManipulatorImageRef.web';
type ContextLoader = () => HTMLCanvasElement | Promise<HTMLCanvasElement>;
export default class ImageManipulatorContext extends SharedObject {
    private loader;
    private _currentTask;
    get currentTask(): Promise<HTMLCanvasElement>;
    set currentTask(task: Promise<HTMLCanvasElement>);
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