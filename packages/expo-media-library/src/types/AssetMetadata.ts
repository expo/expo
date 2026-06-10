import type { MediaType } from './MediaType';

/**
 * Lightweight metadata for a single asset, returned by [Query.exeForMetadata](#exeformetadata).
 *
 * Contains fields that can be read cheaply from the media store, without resolving file paths or
 * decoding files. Use [Asset](#asset) getters when you need heavier fields such as URI or EXIF data.
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
