/**
 * The type of an album. Maps to [`PHAssetCollectionType`](https://developer.apple.com/documentation/photokit/phassetcollectiontype).
 * @platform ios
 */
export enum AlbumType {
  ALBUM = 'album',
  SMART_ALBUM = 'smartAlbum',
}

/**
 * Lightweight metadata for a single album, returned by [`Album.getAlbumsMetadata`](#albumgetalbumsmetadata).
 *
 * Contains fields that can be read cheaply from the media store, without instantiating an
 * [`Album`](#album) per entry. Use an [`Album`](#album) instance when you need heavier data such as
 * its assets or asset count.
 *
 * > `type` is only available on iOS; it is `null` on Android.
 */
export type AlbumMetadata = {
  id: string;
  title: string;
  type: AlbumType | null;
};
