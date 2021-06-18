import { Action, ImageResult, SaveOptions } from './ImageManipulator.types';
export declare function manipulateAsync(uri: string, actions?: Action[], saveOptions?: SaveOptions): Promise<ImageResult>;
export * from './ImageManipulator.types';
