import { SharedRef } from 'expo';

import NativeVideoModule from './NativeVideoModule';

/**
 * Represents a video thumbnail that references a native image.
 * Instances of this class can be passed as a source to the `Image` component from `expo-image`.
 * On web, the thumbnail also exposes a `uri` containing a JPEG data URL.
 * @platform android
 * @platform ios
 * @platform web
 */
export declare class VideoThumbnail extends SharedRef<'image'> {
  /**
   * URI of the generated thumbnail image.
   * @platform web
   */
  uri?: string | null;
  /**
   * Width of the created thumbnail.
   */
  width: number;
  /**
   * Height of the created thumbnail.
   */
  height: number;
  /**
   * The time in seconds at which the thumbnail was to be created.
   */
  requestedTime: number;
  /**
   * The time in seconds at which the thumbnail was actually generated.
   * @platform android
   * @platform ios
   * @platform web
   */
  actualTime: number;
}

export default NativeVideoModule.VideoThumbnail;
