import { Action, ImageResult, SaveOptions } from './ImageManipulator.types';
export declare function manipulateAsync(uri: string, actions?: Action[], { format, ...rest }?: SaveOptions): Promise<ImageResult>;
export * from './ImageManipulator.types';
