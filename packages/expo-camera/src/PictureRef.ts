import { SharedRef } from 'expo';

import type { PhotoResult, SavePictureOptions } from './Camera.types';
import CameraManager from './ExpoCameraManager';

/**
 * A reference to a native instance of the image.
 */
export declare class PictureRef extends SharedRef<'image'> {
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
  savePictureAsync(options?: SavePictureOptions): Promise<PhotoResult>;
}

export default CameraManager.Picture as typeof PictureRef;
