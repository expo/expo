import type { Asset } from './Asset';

/**
 * Represents a media album (collection of assets) on the device.
 *
 * An {@link Album} groups together media assets (images, videos, or audio files).
 * To create a new album, use {@link Album.create}.
 * To fetch an existing album, use {@link Album.get}.
 */
export declare class Album {
  /**
   * Reinitialize an instance of an album with a given ID.
   * @param id - The unique identifier of the album.
   */
  constructor(id: string);

  /**
   * Unique identifier of the album.
   * Can be used to re-instantiate an {@link Album} later.
   */
  id: string;

  /**
   * Retrieves all assets contained in the album.
   * @returns A promise resolving to an array of {@link Asset} objects.
   *
   * @example
   * ```ts
   * const assets = await album.getAssets();
   * console.log(assets.length);
   * ```
   */
  getAssets(): Promise<Asset[]>;

  /**
   * Gets the display title (name) of the album.
   * Note that album titles are not guaranteed to be unique.
   * @returns A promise resolving to the album’s title string.
   *
   * @example
   * ```ts
   * const title = await album.getTitle();
   * console.log(title); // "Camera"
   * ```
   */
  getTitle(): Promise<string>;

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
  delete(): Promise<void>;

  /**
   * Adds one or more assets to the album.
   * @param assets - The {@link Asset} or list of {@link Asset} objects to add.
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
  add(assets: Asset | Asset[]): Promise<void>;

  /**
   * Removes assets from the album without deleting them from the library.
   * This is supported only on iOS.
   *
   * On Android, an asset can belong to only one album. To remove it from an album,
   * delete it or add it to another album.
   * @platform ios
   * @param assets - An array of {@link Asset} objects to remove from the album.
   * @returns A promise that resolves once the assets have been removed.
   *
   * @example
   * ```ts
   * const assets = await album.getAssets();
   * await album.removeAssets(assets.slice(0, 2));
   * ```
   */
  removeAssets(assets: Asset[]): Promise<void>;

  /**
   * A static function. Creates a new album with a given name and assets.
   * On Android, if assets are provided and `moveAssets` is true, the assets will be moved into the new album. If false or not supported, the assets will be copied.
   *
   * @param name - Name of the new album.
   * @param assetsRefs - List of {@link Asset} objects or file paths (file:///...) to include.
   * @param moveAssets - On Android, whether to move assets into the album. Defaults to `true`.
   * @returns A promise resolving to the created {@link Album}.
   *
   * @example
   * ```ts
   * const album = await Album.create("My Album", [asset]);
   * console.log(await album.getTitle()); // "My Album"
   * ```
   */
  static create(name: string, assetsRefs: string[] | Asset[], moveAssets?: boolean): Promise<Album>;

  /**
   * A static function. Deletes multiple albums at once.
   * On Android, assets are always deleted along with the album regardless of `deleteAssets`.
   * @param albums - An array of {@link Album} instances to delete.
   * @param deleteAssets - On iOS, whether to delete the assets in the albums as well. Defaults to `false`.
   * @returns A promise that resolves once the albums have been deleted.
   *
   * @example
   * ```ts
   * const album = await Album.create("My Album", [asset]);
   * await Album.delete([album]);
   * ```
   */
  static delete(albums: Album[], deleteAssets?: boolean): Promise<void>;

  /**
   * A static function. Retrieves an album by its title.
   * @param title - The title of the album to retrieve.
   * @return A promise resolving to the {@link Album} if found, or `null` if not found.
   *
   * @example
   * ```ts
   * const album = await Album.get("Camera");
   * if (album) {
   *   console.log(await album.getTitle()); // "Camera"
   * }
   * ```
   */
  static get(title: string): Promise<Album | null>;

  /**
   * A static function. Retrieves all albums on the device.
   * @returns A promise resolving to an array of {@link Album} objects.
   *
   * @example
   * ```ts
   * const albums = await Album.getAll();
   * ```
   */
  static getAll(): Promise<Album[]>;
}
