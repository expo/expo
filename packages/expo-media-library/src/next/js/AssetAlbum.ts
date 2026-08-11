import { UnavailabilityError } from 'expo';
import { Platform } from 'react-native';

import { NativeAsset, NativeAlbum } from '../native';
import type { AlbumType, AssetInfo, Location, MediaSubtype, MediaType, Shape } from '../types';

// Asset and Album construct each other, so their implementations live together to avoid Metro require-cycle warnings

/**
 * Represents a media asset in the device media library.
 */
export class Asset {
  /**
   * Asset identifier.
   * Can be used to re-instantiate an [`Asset`](#asset) later.
   */
  readonly id: string;
  private readonly nativeAsset: InstanceType<typeof NativeAsset>;

  /**
   * Creates an Asset instance from its ID.
   * @param id - The asset identifier. On Android, this is a `content://` URI. On iOS, this is a `PHAsset` local identifier URI.
   */
  constructor(id: string) {
    this.id = id;
    this.nativeAsset = new NativeAsset(id);
  }

  /**
   * Gets the asset creation time.
   * @returns A promise resolving to a timestamp in seconds, or `null` when the value is unavailable.
   */
  getCreationTime(): Promise<number | null> {
    return this.nativeAsset.getCreationTime();
  }

  /**
   * Gets the asset duration.
   * @returns A promise resolving to the duration in seconds, or `null` when the value is unavailable.
   */
  getDuration(): Promise<number | null> {
    return this.nativeAsset.getDuration();
  }

  /**
   * Gets the asset filename.
   * @returns A promise resolving to the asset filename.
   */
  getFilename(): Promise<string> {
    return this.nativeAsset.getFilename();
  }

  /**
   * Gets the asset height.
   * @returns A promise resolving to the asset height in pixels.
   */
  getHeight(): Promise<number> {
    return this.nativeAsset.getHeight();
  }

  /**
   * Gets the asset media type.
   * @returns A promise resolving to the asset media type.
   */
  getMediaType(): Promise<MediaType> {
    return this.nativeAsset.getMediaType();
  }

  /**
   * Gets the asset modification time.
   * @returns A promise resolving to a timestamp in seconds, or `null` when the value is unavailable.
   */
  getModificationTime(): Promise<number | null> {
    return this.nativeAsset.getModificationTime();
  }

  /**
   * Gets the asset dimensions.
   * @returns A promise resolving to the asset shape, or `null` when the value is unavailable.
   */
  getShape(): Promise<Shape | null> {
    return this.nativeAsset.getShape();
  }

  /**
   * Gets the asset URI.
   * @returns A promise resolving to the asset URI.
   */
  getUri(): Promise<string> {
    return this.nativeAsset.getUri();
  }

  /**
   * Gets the asset width.
   * @returns A promise resolving to the asset width in pixels.
   */
  getWidth(): Promise<number> {
    return this.nativeAsset.getWidth();
  }

  /**
   * Gets complete information about the asset.
   * @returns A promise resolving to an [`AssetInfo`](#assetinfo) object.
   *
   * > On Android, the `isFavorite` field reflects the MediaStore `IS_FAVORITE` column,
   * > which some third-party gallery apps may not use for their own favorites.
   */
  getInfo(): Promise<AssetInfo> {
    return this.nativeAsset.getInfo();
  }

  /**
   * Gets the asset location.
   * @returns A promise resolving to the asset location, or `null` when location is unavailable.
   */
  getLocation(): Promise<Location | null> {
    return this.nativeAsset.getLocation();
  }

  /**
   * Gets the asset EXIF metadata.
   * @returns A promise resolving to a map of EXIF tags.
   */
  getExif(): Promise<{ [key: string]: any }> {
    return this.nativeAsset.getExif();
  }

  /**
   * Deletes the asset from the media library.
   * @returns A promise resolving once the deletion has completed.
   */
  delete(): Promise<void> {
    return this.nativeAsset.delete();
  }

  /**
   * Gets albums that contain the asset.
   * @returns A promise resolving to an array of [`Album`](#album) objects.
   */
  async getAlbums(): Promise<Album[]> {
    const natives = await this.nativeAsset.getAlbums();
    return natives.map((a) => new Album(a.id));
  }

  /**
   * Creates an asset from a local file path.
   * @param filePath - Local file URI of the asset to create.
   * @param album - Optional album to add the created asset to.
   * @returns A promise resolving to the created [`Asset`](#asset).
   */
  static async create(filePath: string, album?: Album): Promise<Asset> {
    const native = await NativeAsset.create(
      filePath,
      album ? new NativeAlbum(album.id) : undefined
    );
    return new Asset(native.id);
  }

  /**
   * Deletes multiple assets from the media library.
   * @param assets - Assets to delete.
   * @returns A promise resolving once deletion has completed.
   */
  static async delete(assets: Asset[]): Promise<void> {
    return NativeAsset.delete(assets.map((a) => new NativeAsset(a.id)));
  }

  /**
   * Gets whether the asset is marked as a favorite.
   * On iOS, this checks if the asset is part of the system "Favorites" smart album.
   * On Android, this reads the `IS_FAVORITE` column from MediaStore. It requires Android 10+
   * and always returns `false` on older versions.
   * @returns A promise resolving to `true` if the asset is a favorite, otherwise `false`.
   */
  getFavorite(): Promise<boolean> {
    return this.nativeAsset.getFavorite();
  }

  /**
   * Marks or unmarks the asset as a favorite.
   * On iOS, this adds or removes the asset from the system "Favorites" smart album.
   * On Android, this updates the `IS_FAVORITE` column in MediaStore. It requires Android 10+
   * and is a no-op on older versions.
   * @param isFavorite - Whether the asset should be marked as favorite.
   * @returns A promise that resolves once the favorite state has been updated.
   *
   * > On Android, some third-party gallery apps maintain their own favorites list and may not
   * > reflect changes made through this method.
   */
  setFavorite(isFavorite: boolean): Promise<void> {
    return this.nativeAsset.setFavorite(isFavorite);
  }

  /**
   * Gets the media subtypes of the asset, describing specific variations such as Live Photo, panorama, HDR, etc.
   * @returns A promise resolving to an array of [`MediaSubtype`](#mediasubtype) values.
   * @platform ios
   */
  getMediaSubtypes(): Promise<MediaSubtype[]> {
    if (Platform.OS !== 'ios') {
      throw new UnavailabilityError('MediaLibrary', 'getMediaSubtypes is only available on iOS');
    }
    return this.nativeAsset.getMediaSubtypes();
  }

  /**
   * Gets the URI of the paired video for a Live Photo asset.
   * The video is extracted to a temporary file.
   * @returns A promise resolving to the paired video URI, or `null` if the asset is not a Live Photo or no paired video is available.
   * @platform ios
   */
  getLivePhotoVideoUri(): Promise<string | null> {
    if (Platform.OS !== 'ios') {
      throw new UnavailabilityError(
        'MediaLibrary',
        'getLivePhotoVideoUri is only available on iOS'
      );
    }
    return this.nativeAsset.getLivePhotoVideoUri();
  }

  /**
   * Gets whether the asset is stored in iCloud and not available locally.
   * This does not trigger a download of the asset.
   * @returns A promise resolving to `true` if the asset is stored in iCloud and unavailable locally, otherwise `false`.
   * @platform ios
   */
  getIsInCloud(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      throw new UnavailabilityError('MediaLibrary', 'getIsInCloud is only available on iOS');
    }
    return this.nativeAsset.getIsInCloud();
  }

  /**
   * Gets the EXIF display orientation of the asset.
   * Only applicable for assets with media type `MediaType.IMAGE`.
   * @returns A promise resolving to the EXIF orientation value, or `null` when unavailable.
   * @platform ios
   */
  getOrientation(): Promise<number | null> {
    if (Platform.OS !== 'ios') {
      throw new UnavailabilityError('MediaLibrary', 'getOrientation is only available on iOS');
    }
    return this.nativeAsset.getOrientation();
  }
}

/**
 * Represents a media album (collection of assets) on the device.
 *
 * An [`Album`](#album) groups together media assets (images, videos, or audio files).
 * To create a new album, use `Album.create()`.
 * To fetch an existing album, use `Album.get()`.
 */
export class Album {
  /**
   * Unique identifier of the album.
   * Can be used to re-instantiate an [`Album`](#album) later.
   */
  readonly id: string;
  private readonly nativeAlbum: InstanceType<typeof NativeAlbum>;

  /**
   * Creates an Album instance from its ID.
   * @param id - The unique identifier of the album.
   */
  constructor(id: string) {
    this.id = id;
    this.nativeAlbum = new NativeAlbum(id);
  }

  /**
   * Retrieves all assets contained in the album.
   * @returns A promise resolving to an array of [`Asset`](#asset) objects.
   *
   * @example
   * ```ts
   * const assets = await album.getAssets();
   * console.log(assets.length);
   * ```
   */
  async getAssets(): Promise<Asset[]> {
    const natives = await this.nativeAlbum.getAssets();
    return natives.map((a) => new Asset(a.id));
  }

  /**
   * Gets the display title (name) of the album.
   * Note that album titles are not guaranteed to be unique.
   * @returns A promise resolving to the album's title string.
   *
   * @example
   * ```ts
   * const title = await album.getTitle();
   * console.log(title); // "Camera"
   * ```
   */
  getTitle(): Promise<string> {
    return this.nativeAlbum.getTitle();
  }

  /**
   * Gets the album's type — whether it is a regular or a smart album.
   * @returns A promise resolving to an [`AlbumType`](#albumtype).
   * @platform ios
   *
   * @example
   * ```ts
   * const type = await album.getType(); // AlbumType.ALBUM
   * ```
   */
  getType(): Promise<AlbumType> {
    if (Platform.OS !== 'ios') {
      throw new UnavailabilityError('MediaLibrary', 'getType is only available on iOS');
    }
    return this.nativeAlbum.getType();
  }

  /**
   * Permanently deletes the album from the device.
   * On Android, it deletes the album and all its assets.
   * On iOS, it deletes the album but keeps the assets in the main library.
   * @returns A promise that resolves once the deletion has completed.
   * @throws An exception if the deletion fails or the album could not be found.
   *
   * @example
   * ```ts
   * await album.delete();
   * ```
   */
  delete(): Promise<void> {
    return this.nativeAlbum.delete();
  }

  /**
   * Adds one or more assets to the album.
   * @param assets - The [`Asset`](#asset) or list of [`Asset`](#asset) objects to add.
   * @returns A promise that resolves once the assets have been added.
   *
   * @example
   * ```ts
   * const asset = await Asset.create("file:///path/to/photo.png");
   * await album.add(asset);
   * ```
   *
   * @example
   * ```ts
   * await album.add([asset1, asset2]);
   * ```
   */
  add(assets: Asset | Asset[]): Promise<void> {
    const nativeAssets = Array.isArray(assets)
      ? assets.map((a) => new NativeAsset(a.id))
      : new NativeAsset(assets.id);
    return this.nativeAlbum.add(nativeAssets);
  }

  /**
   * Removes assets from the album without deleting them from the library.
   * This is supported only on iOS.
   *
   * On Android, an asset can belong to only one album. To remove it from an album,
   * delete it or add it to another album.
   * @platform ios
   * @param assets - An array of [`Asset`](#asset) objects to remove from the album.
   * @returns A promise that resolves once the assets have been removed.
   *
   * @example
   * ```ts
   * const assets = await album.getAssets();
   * await album.removeAssets(assets.slice(0, 2));
   * ```
   */
  removeAssets(assets: Asset[]): Promise<void> {
    return this.nativeAlbum.removeAssets(assets.map((a) => new NativeAsset(a.id)));
  }

  /**
   * A static function. Creates a new album with a given name and assets.
   * On Android, if assets are provided and `moveAssets` is true, the assets will be moved into the new album. If false or not supported, the assets will be copied.
   *
   * @param name - Name of the new album.
   * @param assetsRefs - List of [`Asset`](#asset) objects or file paths (file:///...) to include.
   * @param moveAssets - On Android, whether to move assets into the album. Defaults to `true`.
   * @returns A promise resolving to the created [`Album`](#album).
   *
   * @example
   * ```ts
   * const album = await Album.create("My Album", [asset]);
   * console.log(await album.getTitle()); // "My Album"
   * ```
   */
  static async create(
    name: string,
    assetsRefs: string[] | Asset[],
    moveAssets?: boolean
  ): Promise<Album> {
    const nativeRefs =
      assetsRefs.length === 0 || typeof (assetsRefs as string[])[0] === 'string'
        ? (assetsRefs as string[])
        : (assetsRefs as Asset[]).map((a) => new NativeAsset(a.id));
    const native = await NativeAlbum.create(name, nativeRefs, moveAssets);
    return new Album(native.id);
  }

  /**
   * A static function. Deletes multiple albums at once.
   * On Android, assets are always deleted along with the album regardless of `deleteAssets`.
   * @param albums - An array of [`Album`](#album) instances to delete.
   * @param deleteAssets - On iOS, whether to delete the assets in the albums as well. Defaults to `false`.
   * @returns A promise that resolves once the albums have been deleted.
   *
   * @example
   * ```ts
   * const album = await Album.create("My Album", [asset]);
   * await Album.delete([album]);
   * ```
   */
  static async delete(albums: Album[], deleteAssets?: boolean): Promise<void> {
    return NativeAlbum.delete(
      albums.map((a) => new NativeAlbum(a.id)),
      deleteAssets
    );
  }

  /**
   * A static function. Retrieves an album by its title.
   * @param title - The title of the album to retrieve.
   * @return A promise resolving to the [`Album`](#album) if found, or `null` if not found.
   *
   * @example
   * ```ts
   * const album = await Album.get("Camera");
   * if (album) {
   *   console.log(await album.getTitle()); // "Camera"
   * }
   * ```
   */
  static async get(title: string): Promise<Album | null> {
    const native = await NativeAlbum.get(title);
    return native ? new Album(native.id) : null;
  }

  /**
   * A static function. Retrieves albums from the device library.
   * @returns A promise resolving to an array of [`Album`](#album) objects.
   *
   * @example
   * ```ts
   * const albums = await Album.getAll();
   * ```
   */
  static async getAll(): Promise<Album[]> {
    const natives = await NativeAlbum.getAll();
    return natives.map((a) => new Album(a.id));
  }

  /**
   * A static function. Retrieves system smart albums (for example Favorites, Videos, or Screenshots).
   * @returns A promise resolving to an array of [`Album`](#album) objects.
   *
   * @example
   * ```ts
   * const smartAlbums = await Album.getSmartAlbums();
   * ```
   * @platform ios
   */
  static async getSmartAlbums(): Promise<Album[]> {
    if (Platform.OS !== 'ios') {
      throw new UnavailabilityError('MediaLibrary', 'getSmartAlbums');
    }
    const natives = await NativeAlbum.getSmartAlbums();
    return natives.map((a) => new Album(a.id));
  }
}
