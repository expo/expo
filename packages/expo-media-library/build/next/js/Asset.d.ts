import { Album } from './Album';
import type { AssetInfo, Location, MediaSubtype, MediaType, Shape } from '../types';
/**
 * Represents a media asset in the device media library.
 */
export declare class Asset {
    /**
     * Asset identifier.
     * Can be used to re-instantiate an [`Asset`](#asset) later.
     */
    readonly id: string;
    private readonly nativeAsset;
    /**
     * Creates an Asset instance from its ID.
     * @param id - The asset identifier. On Android, this is a `content://` URI. On iOS, this is a `PHAsset` local identifier URI.
     */
    constructor(id: string);
    /**
     * Gets the asset creation time.
     * @returns A promise resolving to a timestamp in seconds, or `null` when the value is unavailable.
     */
    getCreationTime(): Promise<number | null>;
    /**
     * Gets the asset duration.
     * @returns A promise resolving to the duration in seconds, or `null` when the value is unavailable.
     */
    getDuration(): Promise<number | null>;
    /**
     * Gets the asset filename.
     * @returns A promise resolving to the asset filename.
     */
    getFilename(): Promise<string>;
    /**
     * Gets the asset height.
     * @returns A promise resolving to the asset height in pixels.
     */
    getHeight(): Promise<number>;
    /**
     * Gets the asset media type.
     * @returns A promise resolving to the asset media type.
     */
    getMediaType(): Promise<MediaType>;
    /**
     * Gets the asset modification time.
     * @returns A promise resolving to a timestamp in seconds, or `null` when the value is unavailable.
     */
    getModificationTime(): Promise<number | null>;
    /**
     * Gets the asset dimensions.
     * @returns A promise resolving to the asset shape, or `null` when the value is unavailable.
     */
    getShape(): Promise<Shape | null>;
    /**
     * Gets the asset URI.
     * @returns A promise resolving to the asset URI.
     */
    getUri(): Promise<string>;
    /**
     * Gets the asset width.
     * @returns A promise resolving to the asset width in pixels.
     */
    getWidth(): Promise<number>;
    /**
     * Gets complete information about the asset.
     * @returns A promise resolving to an [`AssetInfo`](#assetinfo) object.
     *
     * > On Android, the `isFavorite` field reflects the MediaStore `IS_FAVORITE` column,
     * > which some third-party gallery apps may not use for their own favorites.
     */
    getInfo(): Promise<AssetInfo>;
    /**
     * Gets the asset location.
     * @returns A promise resolving to the asset location, or `null` when location is unavailable.
     */
    getLocation(): Promise<Location | null>;
    /**
     * Gets the asset EXIF metadata.
     * @returns A promise resolving to a map of EXIF tags.
     */
    getExif(): Promise<{
        [key: string]: any;
    }>;
    /**
     * Deletes the asset from the media library.
     * @returns A promise resolving once the deletion has completed.
     */
    delete(): Promise<void>;
    /**
     * Gets albums that contain the asset.
     * @returns A promise resolving to an array of [`Album`](#album) objects.
     */
    getAlbums(): Promise<Album[]>;
    /**
     * Creates an asset from a local file path.
     * @param filePath - Local file URI of the asset to create.
     * @param album - Optional album to add the created asset to.
     * @returns A promise resolving to the created [`Asset`](#asset).
     */
    static create(filePath: string, album?: Album): Promise<Asset>;
    /**
     * Deletes multiple assets from the media library.
     * @param assets - Assets to delete.
     * @returns A promise resolving once deletion has completed.
     */
    static delete(assets: Asset[]): Promise<void>;
    /**
     * Gets whether the asset is marked as a favorite.
     * On iOS, this checks if the asset is part of the system "Favorites" smart album.
     * On Android, this reads the `IS_FAVORITE` column from MediaStore. It requires Android 10+
     * and always returns `false` on older versions.
     * @returns A promise resolving to `true` if the asset is a favorite, otherwise `false`.
     */
    getFavorite(): Promise<boolean>;
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
    setFavorite(isFavorite: boolean): Promise<void>;
    /**
     * Gets the media subtypes of the asset, describing specific variations such as Live Photo, panorama, HDR, etc.
     * @returns A promise resolving to an array of [`MediaSubtype`](#mediasubtype) values.
     * @platform ios
     */
    getMediaSubtypes(): Promise<MediaSubtype[]>;
    /**
     * Gets the URI of the paired video for a Live Photo asset.
     * The video is extracted to a temporary file.
     * @returns A promise resolving to the paired video URI, or `null` if the asset is not a Live Photo or no paired video is available.
     * @platform ios
     */
    getLivePhotoVideoUri(): Promise<string | null>;
    /**
     * Gets whether the asset is stored in iCloud and not available locally.
     * This does not trigger a download of the asset.
     * @returns A promise resolving to `true` if the asset is stored in iCloud and unavailable locally, otherwise `false`.
     * @platform ios
     */
    getIsInCloud(): Promise<boolean>;
    /**
     * Gets the EXIF display orientation of the asset.
     * Only applicable for assets with media type `MediaType.IMAGE`.
     * @returns A promise resolving to the EXIF orientation value, or `null` when unavailable.
     * @platform ios
     */
    getOrientation(): Promise<number | null>;
}
//# sourceMappingURL=Asset.d.ts.map