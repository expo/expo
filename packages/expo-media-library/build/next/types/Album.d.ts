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
}
//# sourceMappingURL=Album.d.ts.map