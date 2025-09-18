import { Asset } from './Asset';
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
     * Adds an asset to the album.
     * @param asset - The {@link Asset} to add.
     * @returns A promise that resolves once the asset has been added.
     *
     * @example
     * ```ts
     * const asset = await Asset.create("file:///path/to/photo.png");
     * await album.add(asset);
     * ```
     */
    add(asset: Asset): Promise<void>;
    /**
     * A static function. Creates a new album with a given name and assets.
     * On Android, if assets are provided and `moveAssets` is true, the assets will be moved into the new album. If false or not supported, the assets will be copied.
     *
     * @param name - Name of the new album.
     * @param assetsRefs - List of {@link Asset} objects or file paths (file:///...) to include.
     * @param moveAssets - On Android, whether to move assets into the album.
     * @returns A promise resolving to the created {@link Album}.
     *
     * @example
     * ```ts
     * const album = await Album.create("My Album", [asset]);
     * console.log(await album.getTitle()); // "My Album"
     * ```
     */
    static create(name: string, assetsRefs: string[] | Asset[], moveAssets: boolean): Promise<Album>;
    /**
     * A static function. Deletes multiple albums at once.
     * @param albums - An array of {@link Album} instances to delete.
     * @param deleteAssets - Whether to delete the assets in the albums as well.
     * @returns A promise that resolves once the albums have been deleted.
     *
     * @example
     * ```ts
     * const album = await Album.create("My Album", [asset]);
     * await Album.delete([album]);
     * ```
     */
    static delete(albums: Album[], deleteAssets: boolean): Promise<void>;
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
}
//# sourceMappingURL=Album.d.ts.map