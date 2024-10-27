import { ImageResult, SaveOptions } from '../ImageManipulator.types';
export declare function getContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D;
export declare function getResults(canvas: HTMLCanvasElement, options?: SaveOptions): ImageResult;
export declare function loadImageAsync(uri: string): Promise<HTMLCanvasElement>;
//# sourceMappingURL=utils.web.d.ts.map