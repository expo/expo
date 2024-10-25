import { SharedRef } from 'expo';

import type { ImageResult, SaveOptions } from './ImageManipulator.types';
import ExpoImageManipulator from './NativeImageManipulatorModule';

/**
 * A reference to a native instance of the image.
 */
export declare class ImageRef extends SharedRef<'image'> {
  /**
   * Width of the image.
   */
  width: number;

  /**
   * Height of the image.
   */
  height: number;

  /**
   * Saves the image to the file system in the cache directory.
   * @param options A map defining how modified image should be saved.
   */
  saveAsync(options?: SaveOptions): Promise<ImageResult>;
}

export default ExpoImageManipulator.ImageRef as typeof ImageRef;
