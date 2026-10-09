export enum MediaType {
  UNKNOWN = 'unknown',
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
}

/**
 * Describes specific variations of asset media. Maps to [`PHAssetMediaSubtype`](https://developer.apple.com/documentation/photokit/phassetmediasubtype).
 * @platform ios
 */
export enum MediaSubtype {
  DEPTH_EFFECT = 'depthEffect',
  HDR = 'hdr',
  HIGH_FRAME_RATE = 'highFrameRate',
  LIVE_PHOTO = 'livePhoto',
  PANORAMA = 'panorama',
  SCREENSHOT = 'screenshot',
  STREAM = 'stream',
  TIME_LAPSE = 'timelapse',
  SPATIAL_MEDIA = 'spatialMedia',
  VIDEO_CINEMATIC = 'videoCinematic',
}

/**
 * Selects which version of an asset to resolve.
 * @platform ios
 */
export enum AssetUriVersion {
  /**
   * The asset as it currently appears in the Photos app, including any edits applied to it.
   */
  CURRENT = 'current',
  /**
   * The asset the edits were applied to. For an asset that was never edited this is the same
   * file as `CURRENT`.
   */
  ORIGINAL = 'original',
}

/**
 * @platform ios
 */
export type AssetUriOptions = {
  /**
   * Which version of the asset to resolve.
   * @default AssetUriVersion.CURRENT
   */
  version?: AssetUriVersion;
};

export type Location = {
  latitude: number;
  longitude: number;
};

export type Shape = {
  width: number;
  height: number;
};

export type AssetInfo = {
  id: string;
  filename: string;
  uri: string;
  mediaType: MediaType;
  width: number;
  height: number;
  duration: number | null;
  creationTime: number | null;
  modificationTime: number | null;
  isFavorite?: boolean;
};

/**
 * Lightweight metadata for a single asset, returned by [`Query.exeForMetadata`](#exeformetadata).
 *
 * Contains fields that can be read cheaply from the media store, without resolving file paths or
 * decoding files. Use [`Asset`](#asset) getters when you need heavier fields such as URI or EXIF data.
 *
 * > On Android, `width` and `height` may be `null` when the media store does not record them.
 */
export type AssetMetadata = {
  id: string;
  filename: string | null;
  mediaType: MediaType;
  width: number | null;
  height: number | null;
  duration: number | null;
  creationTime: number | null;
  modificationTime: number | null;
  isFavorite: boolean;
};
