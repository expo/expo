import { Album } from './Album';
import { Location } from './Location';
import { MediaType } from './MediaType';

/**
 * Represents a single media asset on the device (image, video, or audio).
 *
 * An {@link Asset} instance corresponds to an entry in the device's media store.
 * It exposes metadata (such as filename, dimensions, or creation time) and utility methods (like deleting).
 *
 * To create a new asset, use {@link Asset.create}, if you already have an asset ID, you can instantiate it directly using the constructor.
 */
export declare class Asset {
  /**
   * Reinitialize an instance of an asset with a given ID.
   * @param id - For Android, it is a `contentUri` (content://media/external/images/media/12345) and for iOS, it is `PHAsset` localIdentifier URI.
   */
  constructor(id: string);

  /**
   * ID of the asset.
   * Can be used to re-instantiate an {@link Asset} later.
   * For android it is a contentUri and PHAsset localIdentifier URI for iOS.
   */
  id: string;

  /**
   * Gets the creation time of the asset.
   * @returns A promise resolving to the UNIX timestamp in milliseconds, or `null` if unavailable.
   * @throws An exception if the asset could not be found.
   */
  getCreationTime(): Promise<number | null>;

  /**
   * Gets the duration of the asset.
   * Applies only to assets with media type {@link MediaType.audio} or {@link MediaType.video}.
   * For other media types, it returns `null`.
   * @returns A promise resolving to the duration in milliseconds, or `null` if not applicable.
   * @throws An exception if the asset could not be found.
   */
  getDuration(): Promise<number | null>;

  /**
   * Gets the filename of the asset, including its extension.
   * @returns A promise resolving to the filename string.
   * @throws An exception if the asset could not be found.
   */
  getFilename(): Promise<string>;

  /**
   * Gets the height of the asset in pixels.
   * Only applicable for image and video assets.
   * @returns A promise resolving to the height in pixels.
   * @throws An exception if the filename cannot be found.
   */
  getHeight(): Promise<number>;

  /**
   * Gets the media type of the asset (image, video, audio or unknown).
   * @returns A promise resolving to a {@link MediaType} enum value.
   * @throws An exception if the asset could not be found.
   */
  getMediaType(): Promise<MediaType>;

  /**
   * Gets the last modification time of the asset.
   * @returns A promise resolving to the UNIX timestamp in milliseconds, or `null` if unavailable.
   * @throws An exception if the asset could not be found.
   */
  getModificationTime(): Promise<number | null>;

  /**
   * Gets the URI pointing to the asset’s location in the system.
   * Example, for Android: `file:///storage/emulated/0/DCIM/Camera/IMG_20230915_123456.jpg`.
   * @returns A promise resolving to the string URI.
   * @throws An exception if the asset could not be found.
   */
  getUri(): Promise<string>;

  /**
   * Gets the width of the asset in pixels.
   * Only applicable for image and video assets.
   * @returns A promise resolving to the width in pixels.
   * @throws An exception if the asset could not be found.
   */
  getWidth(): Promise<number>;

  /**
   * Gets the location of the asset.
   * On Android, this method requires the `ACCESS_MEDIA_LOCATION` permission to access location metadata.
   * @returns A promise resolving to the {@link Location} object or `null` if the location data is unavailable.
   * @throws An exception if the asset could not be found, or if the permission is not granted on Android.
   */
  getLocation(): Promise<Location | null>;

  /**
   * Gets the exif data of the {@link MediaType.image} asset.
   * On Android, this method requires the `ACCESS_MEDIA_LOCATION` permission to access location metadata.
   * @returns A promise resolving to the exif data object or an empty object if the exif data is unavailable.
   * @throws An exception if the asset could not be found.
   */
  getExif(): Promise<{ [key: string]: any }>;

  /**
   * Deletes the asset from the device’s media store.
   * @returns A promise that resolves once the deletion has completed.
   *
   * @example
   * ```ts
   * await asset.delete();
   * ```
   */
  delete(): Promise<void>;

  /*
   * A static function. Creates a new asset from a given file path.
   * Optionally associates the asset with an album. On Android, if not specified, the asset will be placed in the default "Pictures" directory.
   *
   * @param filePath - Local filesystem path (for example, `file:///...`) of the file to import.
   * @param album - Optional {@link Album} instance to place the asset in.
   * @returns A promise resolving to the created {@link Asset}.
   * @throws An exception if the asset could not be created, for example, if the file does not exist or permission is denied.
   *
   * @example
   * ```ts
   * const asset = await Asset.create("file:///storage/emulated/0/DCIM/Camera/IMG_20230915_123456.jpg");
   * console.log(await asset.getFilename()); // "IMG_20230915_123456.jpg"
   * ```
   */
  static create(filePath: string, album?: Album): Promise<Asset>;
}
