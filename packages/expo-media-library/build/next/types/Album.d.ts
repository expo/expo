import { Asset } from './Asset';
/**
 * Represents a media album (collection of assets) on the device.
 *
 * An `Album` groups together media assets (images, videos, or audio files).
 * Albums typically correspond to folders in the device’s gallery or media store.
 *
 * To create a new album, use {@link Album.create}.
 */
export declare class Album {
    /**
     * Reinitialize an instance of an album with a given ID.
     * @param id - The unique identifier of the album.
     */
    constructor(id: string);
    /**
     * Unique identifier of the album.
     * Can be used to re-instantiate an `Album` later or to query related objects.
     */
    id: string;
    /**
     * Retrieves all assets contained in this album.
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
     * Depending on platform and options, this may also delete contained assets.
     *
     * @returns A promise that resolves once the deletion has completed.
     *
     * @example
     * ```ts
     * await album.delete();
     * ```
     */
    delete(): Promise<void>;
    /**
     * Adds a given asset to this album.
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
     * Creates a new album with a given name and optional assets.
     * If an album with the same name already exists, behavior may depend on the platform.
     *
     * @param title - Name of the new album.
     * @param assetsOrPaths - Optional list of {@link Asset} objects or file paths to include.
     * @param deleteOriginalAsset - Whether to copy assets into the album (if supported). Defaults to `false`.
     * @returns A promise resolving to the created {@link Album}.
     *
     * @example
     * ```ts
     * const album = await Album.create("My Album", [asset]);
     * console.log(await album.getTitle()); // "My Album"
     * ```
     */
    static create(title: string, assetsOrPaths?: (Asset | string)[], deleteOriginalAsset?: boolean): Promise<Album>;
    /**
     * Deletes multiple albums at once.
     * @param albums - An array of {@link Album} instances to delete.
     * @param deleteAssets - If `true`, also deletes assets contained in these albums (if supported).
     * @returns A promise that resolves once the albums have been deleted.
     */
    static deleteMany(albums: Album[], deleteAssets?: boolean): Promise<void>;
}
//# sourceMappingURL=Album.d.ts.map