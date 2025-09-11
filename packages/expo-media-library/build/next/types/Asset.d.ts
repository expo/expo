import { Album } from './Album';
import { MediaType } from './MediaType';
/**
 * Represents a single media asset on the device (image, video, or audio).
 *
 * An `Asset` instance corresponds to an entry in the device's media store.
 * It exposes metadata (such as filename, dimensions, or creation time) and utility methods (like deleting).
 *
 * To create a new asset, use {@link Asset.create}.
 */
export declare class Asset {
    /**
     * Reinitialize an instance of an asset with a given content URI.
     * @param contentUri - The content URI of the asset in MediaStore.
     */
    constructor(contentUri: string);
    /**
     * ID of the asset.
     * Can be used to re-instantiate an `Asset` later.
     * For android it is a contentUri and PHAsset localIdentifier for iOS.
     */
    id: string;
    /**
     * Gets the creation time of the asset.
     * @returns A promise resolving to the UNIX timestamp in milliseconds, or `null` if unavailable.
     */
    getCreationTime(): Promise<number | null>;
    /**
     * Gets the duration of the asset.
     * Applies only to media types like video or audio.
     * @returns A promise resolving to the duration in milliseconds, or `null` if not applicable.
     */
    getDuration(): Promise<number | null>;
    /**
     * Gets the filename of the asset, including its extension.
     * @returns A promise resolving to the filename string.
     * @throws AssetPropertyNotFoundException if the name cannot be retrieved (e.g. asset deleted).
     */
    getFilename(): Promise<string>;
    /**
     * Gets the height of the asset in pixels.
     * Only applicable for image and video assets.
     * @returns A promise resolving to the height in pixels.
     */
    getHeight(): Promise<number>;
    /**
     * Gets the media type of the asset.
     * @returns A promise resolving to a numeric media type (e.g., image, video, audio).
     */
    getMediaType(): Promise<MediaType>;
    /**
     * Gets the last modification time of the asset.
     * @returns A promise resolving to the UNIX timestamp in milliseconds, or `null` if unavailable.
     */
    getModificationTime(): Promise<number | null>;
    /**
     * Gets the URI pointing to the asset’s location in the system (e.g. `content://` on Android).
     * @returns A promise resolving to the string URI.
     */
    getUri(): Promise<string>;
    /**
     * Gets the width of the asset in pixels.
     * Only applicable for image and video assets.
     * @returns A promise resolving to the width in pixels.
     */
    getWidth(): Promise<number>;
    /**
     * Deletes the asset from the device’s media store.
     * @returns A promise that resolves once the deletion has completed.
     * @example
     * ```ts
     * await asset.delete();
     * ```
     */
    delete(): Promise<void>;
    /**
     * Creates a new asset from a given file path.
     * Optionally associates the asset with an album.
     *
     * @param filePath - Local filesystem path (e.g., `file:///...`) of the file to import.
     * @param album - Optional `Album` instance to place the asset in.
     * @returns A promise resolving to the created `Asset`.
     *
     * @example
     * ```ts
     * const asset = await Asset.create("file:///path/to/photo.png");
     * console.log(await asset.getFilename()); // "photo.png"
     * ```
     */
    static create(filePath: string, album?: Album): Promise<Asset>;
}
//# sourceMappingURL=Asset.d.ts.map