import { Action, ImageResult, SaveOptions } from './ImageManipulator.types';
/**
 * Manipulate the image provided via `uri`. Available modifications are rotating, flipping (mirroring),
 * resizing and cropping. Each invocation results in a new file. With one invocation you can provide
 * a set of actions to perform over the image. Overwriting the source file would not have an effect
 * in displaying the result as images are cached.
 * @param uri URI of the file to manipulate. Should be on the local file system or a base64 data URI.
 * @param actions An array of objects representing manipulation options. Each object should have
 * __only one__ of the keys that corresponds to specific transformation.
 * @param saveOptions A map defining how modified image should be saved.
 * @return Promise which fulfils with [`ImageResult`](#imageresult) object.
 */
export declare function manipulateAsync(uri: string, actions?: Action[], saveOptions?: SaveOptions): Promise<ImageResult>;
export * from './ImageManipulator.types';
//# sourceMappingURL=ImageManipulator.d.ts.map