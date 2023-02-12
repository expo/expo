import { PermissionResponse as EXPermissionResponse, PermissionStatus, PermissionExpiration, PermissionHookOptions, Subscription } from 'expo-modules-core';
export type PermissionResponse = EXPermissionResponse & {
    /**
     * Indicates if your app has access to the whole or only part of the photo library. Possible values are:
     * - `'all'` if the user granted your app access to the whole photo library
     * - `'limited'` if the user granted your app access only to selected photos (only available on iOS 14.0+)
     * - `'none'` if user denied or hasn't yet granted the permission
     */
    accessPrivileges?: 'all' | 'limited' | 'none';
};
export type MediaTypeValue = 'audio' | 'photo' | 'video' | 'unknown';
export type SortByKey = 'default' | 'mediaType' | 'width' | 'height' | 'creationTime' | 'modificationTime' | 'duration';
export type SortByValue = [SortByKey, boolean] | SortByKey;
export type MediaTypeObject = {
    audio: 'audio';
    photo: 'photo';
    video: 'video';
    unknown: 'unknown';
};
export type SortByObject = {
    default: 'default';
    mediaType: 'mediaType';
    width: 'width';
    height: 'height';
    creationTime: 'creationTime';
    modificationTime: 'modificationTime';
    duration: 'duration';
};
export type Asset = {
    /**
     * Internal ID that represents an asset.
     */
    id: string;
    /**
     * Filename of the asset.
     */
    filename: string;
    /**
     * URI that points to the asset. `assets://*` (iOS), `file://*` (Android)
     */
    uri: string;
    /**
     * Media type.
     */
    mediaType: MediaTypeValue;
    /**
     * An array of media subtypes.
     * @platform ios
     */
    mediaSubtypes?: MediaSubtype[];
    /**
     * Width of the image or video.
     */
    width: number;
    /**
     * Height of the image or video.
     */
    height: number;
    /**
     * File creation timestamp.
     */
    creationTime: number;
    /**
     * Last modification timestamp.
     */
    modificationTime: number;
    /**
     * Duration of the video or audio asset in seconds.
     */
    duration: number;
    /**
     * Album ID that the asset belongs to.
     * @platform android
     */
    albumId?: string;
};
export type AssetInfo = Asset & {
    /**
     * Local URI for the asset.
     */
    localUri?: string;
    /**
     * GPS location if available.
     */
    location?: Location;
    /**
     * EXIF metadata associated with the image.
     */
    exif?: object;
    /**
     * Whether the asset is marked as favorite.
     * @platform ios
     */
    isFavorite?: boolean;
    /**
     * This field is available only if flag `shouldDownloadFromNetwork` is set to `false`.
     * Whether the asset is stored on the network (iCloud on iOS).
     * @platform ios
     */
    isNetworkAsset?: boolean;
    /**
     * Display orientation of the image. Orientation is available only for assets whose
     * `mediaType` is `MediaType.photo`. Value will range from 1 to 8, see [EXIF orientation specification](http://sylvana.net/jpegcrop/exif_orientation.html)
     * for more details.
     * @platform ios
     */
    orientation?: number;
};
export type MediaSubtype = 'depthEffect' | 'hdr' | 'highFrameRate' | 'livePhoto' | 'panorama' | 'screenshot' | 'stream' | 'timelapse';
export type MediaLibraryAssetInfoQueryOptions = {
    /**
     * Whether allow the asset to be downloaded from network. Only available in iOS with iCloud assets.
     * @default true
     */
    shouldDownloadFromNetwork?: boolean;
};
export type MediaLibraryAssetsChangeEvent = {
    /**
     * Whether the media library's changes could be described as "incremental changes".
     * `true` indicates the changes are described by the `insertedAssets`, `deletedAssets` and
     * `updatedAssets` values. `false` indicates that the scope of changes is too large and you
     * should perform a full assets reload (eg. a user has changed access to individual assets in the
     * media library).
     */
    hasIncrementalChanges: boolean;
    /**
     * Available only if `hasIncrementalChanges` is `true`.
     * Array of [`Asset`](#asset)s that have been inserted to the library.
     */
    insertedAssets?: Asset[];
    /**
     * Available only if `hasIncrementalChanges` is `true`.
     * Array of [`Asset`](#asset)s that have been deleted from the library.
     */
    deletedAssets?: Asset[];
    /**
     * Available only if `hasIncrementalChanges` is `true`.
     * Array of [`Asset`](#asset)s that have been updated or completed downloading from network
     * storage (iCloud on iOS).
     */
    updatedAssets?: Asset[];
};
export type Location = {
    latitude: number;
    longitude: number;
};
export type Album = {
    /**
     * Album ID.
     */
    id: string;
    /**
     * Album title.
     */
    title: string;
    /**
     * Estimated number of assets in the album.
     */
    assetCount: number;
    /**
     * The type of the assets album.
     * @platform ios
     */
    type?: AlbumType;
    /**
     * Apply only to albums whose type is `'moment'`. Earliest creation timestamp of all
     * assets in the moment.
     * @platform ios
     */
    startTime: number;
    /**
     * Apply only to albums whose type is `'moment'`. Latest creation timestamp of all
     * assets in the moment.
     * @platform ios
     */
    endTime: number;
    /**
     * Apply only to albums whose type is `'moment'`. Approximated location of all
     * assets in the moment.
     * @platform ios
     */
    approximateLocation?: Location;
    /**
     * Apply only to albums whose type is `'moment'`. Names of locations grouped
     * in the moment.
     * @platform ios
     */
    locationNames?: string[];
};
export type AlbumType = 'album' | 'moment' | 'smartAlbum';
export type AlbumsOptions = {
    includeSmartAlbums?: boolean;
};
export type AssetsOptions = {
    /**
     * The maximum number of items on a single page.
     * @default 20
     */
    first?: number;
    /**
     * Asset ID of the last item returned on the previous page.
     */
    after?: AssetRef;
    /**
     * [Album](#album) or its ID to get assets from specific album.
     */
    album?: AlbumRef;
    /**
     * An array of [`SortByValue`](#sortbyvalue)s or a single `SortByValue` value. By default, all
     * keys are sorted in descending order, however you can also pass a pair `[key, ascending]` where
     * the second item is a `boolean` value that means whether to use ascending order. Note that if
     * the `SortBy.default` key is used, then `ascending` argument will not matter. Earlier items have
     * higher priority when sorting out the results.
     * If empty, this method will use the default sorting that is provided by the platform.
     */
    sortBy?: SortByValue[] | SortByValue;
    /**
     * An array of [MediaTypeValue](#expomedialibrarymediatypevalue)s or a single `MediaTypeValue`.
     * @default MediaType.photo
     */
    mediaType?: MediaTypeValue[] | MediaTypeValue;
    /**
     * `Date` object or Unix timestamp in milliseconds limiting returned assets only to those that
     * were created after this date.
     */
    createdAfter?: Date | number;
    /**
     * Similarly as `createdAfter`, but limits assets only to those that were created before specified
     * date.
     */
    createdBefore?: Date | number;
};
export type PagedInfo<T> = {
    /**
     * A page of [`Asset`](#asset)s fetched by the query.
     */
    assets: T[];
    /**
     * ID of the last fetched asset. It should be passed as `after` option in order to get the
     * next page.
     */
    endCursor: string;
    /**
     * Whether there are more assets to fetch.
     */
    hasNextPage: boolean;
    /**
     * Estimated total number of assets that match the query.
     */
    totalCount: number;
};
export type AssetRef = Asset | string;
export type AlbumRef = Album | string;
export { PermissionStatus, PermissionExpiration, EXPermissionResponse, PermissionHookOptions, Subscription, };
/**
 * Possible media types.
 */
export declare const MediaType: MediaTypeObject;
/**
 * Supported keys that can be used to sort `getAssetsAsync` results.
 */
export declare const SortBy: SortByObject;
/**
 * Returns whether the Media Library API is enabled on the current device.
 * @return A promise which fulfils with a `boolean`, indicating whether the Media Library API is
 * available on the current device.
 */
export declare function isAvailableAsync(): Promise<boolean>;
/**
 * Asks the user to grant permissions for accessing media in user's media library.
 * @param writeOnly
 * @return A promise that fulfils with [`PermissionResponse`](#permissionresponse) object.
 */
export declare function requestPermissionsAsync(writeOnly?: boolean): Promise<PermissionResponse>;
/**
 * Checks user's permissions for accessing media library.
 * @param writeOnly
 * @return A promise that fulfils with [`PermissionResponse`](#permissionresponse) object.
 */
export declare function getPermissionsAsync(writeOnly?: boolean): Promise<PermissionResponse>;
/**
 * Check or request permissions to access the media library.
 * This uses both `requestPermissionsAsync` and `getPermissionsAsync` to interact with the permissions.
 *
 * @example
 * ```ts
 * const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();
 * ```
 */
export declare const usePermissions: (options?: PermissionHookOptions<{
    writeOnly?: boolean | undefined;
}> | undefined) => [PermissionResponse | null, () => Promise<PermissionResponse>, () => Promise<PermissionResponse>];
/**
 * __Available only on iOS >= 14.__ Allows the user to update the assets that your app has access to.
 * The system modal is only displayed if the user originally allowed only `limited` access to their
 * media library, otherwise this method is a no-op.
 * @return A promise that either rejects if the method is unavailable (meaning the device is not
 * running iOS >= 14), or resolves to `void`.
 * > __Note:__ This method doesn't inform you if the user changes which assets your app has access to.
 * For that information, you need to subscribe for updates to the user's media library using [addListener(listener)](#medialibraryaddlistenerlistener).
 * If `hasIncrementalChanges` is `false`, the user changed their permissions.
 */
export declare function presentPermissionsPickerAsync(): Promise<void>;
/**
 * Creates an asset from existing file. The most common use case is to save a picture taken by [Camera](./camera).
 * This method requires `CAMERA_ROLL` permission.
 *
 * @example
 * ```js
 * const { uri } = await Camera.takePictureAsync();
 * const asset = await MediaLibrary.createAssetAsync(uri);
 * ```
 * @param localUri A URI to the image or video file. It must contain an extension. On Android it
 * must be a local path, so it must start with `file:///`
 * @return A promise which fulfils with an object representing an [`Asset`](#asset).
 */
export declare function createAssetAsync(localUri: string): Promise<Asset>;
/**
 * Saves the file at given `localUri` to the user's media library. Unlike [`createAssetAsync()`](#medialibrarycreateassetasynclocaluri),
 * This method doesn't return created asset.
 * On __iOS 11+__, it's possible to use this method without asking for `CAMERA_ROLL` permission,
 * however then yours `Info.plist` should have `NSPhotoLibraryAddUsageDescription` key.
 * @param localUri A URI to the image or video file. It must contain an extension. On Android it
 * must be a local path, so it must start with `file:///`.
 */
export declare function saveToLibraryAsync(localUri: string): Promise<void>;
/**
 * Adds array of assets to the album.
 *
 * On Android, by default it copies assets from the current album to provided one, however it's also
 * possible to move them by passing `false` as `copyAssets` argument.In case they're copied you
 * should keep in mind that `getAssetsAsync` will return duplicated assets.
 * @param assets An array of [Asset](#asset) or their IDs.
 * @param album An [Album](#album) or its ID.
 * @param copy __Android only.__ Whether to copy assets to the new album instead of move them.
 * Defaults to `true`.
 * @return Returns promise which fulfils with `true` if the assets were successfully added to
 * the album.
 */
export declare function addAssetsToAlbumAsync(assets: AssetRef[] | AssetRef, album: AlbumRef, copy?: boolean): Promise<boolean>;
/**
 * Removes given assets from album.
 *
 * On Android, album will be automatically deleted if there are no more assets inside.
 * @param assets An array of [Asset](#asset) or their IDs.
 * @param album An [Album](#album) or its ID.
 * @return Returns promise which fulfils with `true` if the assets were successfully removed from
 * the album.
 */
export declare function removeAssetsFromAlbumAsync(assets: AssetRef[] | AssetRef, album: AlbumRef): Promise<boolean>;
/**
 * Deletes assets from the library. On iOS it deletes assets from all albums they belong to, while
 * on Android it keeps all copies of them (album is strictly connected to the asset). Also, there is
 * additional dialog on iOS that requires user to confirm this action.
 * @param assets An array of [Asset](#asset) or their IDs.
 * @return Returns promise which fulfils with `true` if the assets were successfully deleted.
 */
export declare function deleteAssetsAsync(assets: AssetRef[] | AssetRef): Promise<boolean>;
/**
 * Provides more information about an asset, including GPS location, local URI and EXIF metadata.
 * @param asset An [Asset](#asset) or its ID.
 * @param options
 * @return An [AssetInfo](#assetinfo) object, which is an `Asset` extended by an additional fields.
 */
export declare function getAssetInfoAsync(asset: AssetRef, options?: MediaLibraryAssetInfoQueryOptions): Promise<AssetInfo>;
/**
 * Queries for user-created albums in media gallery.
 * @return A promise which fulfils with an array of [`Album`](#asset)s. Depending on Android version,
 * root directory of your storage may be listed as album titled `"0"` or unlisted at all.
 */
export declare function getAlbumsAsync({ includeSmartAlbums }?: AlbumsOptions): Promise<Album[]>;
/**
 * Queries for an album with a specific name.
 * @param title Name of the album to look for.
 * @return An object representing an [`Album`](#album), if album with given name exists, otherwise
 * returns `null`.
 */
export declare function getAlbumAsync(title: string): Promise<Album>;
/**
 * Creates an album with given name and initial asset. The asset parameter is required on Android,
 * since it's not possible to create empty album on this platform. On Android, by default it copies
 * given asset from the current album to the new one, however it's also possible to move it by
 * passing `false` as `copyAsset` argument.
 * In case it's copied you should keep in mind that `getAssetsAsync` will return duplicated asset.
 * @param albumName Name of the album to create.
 * @param asset An [Asset](#asset) or its ID (required on Android).
 * @param copyAsset __Android Only.__ Whether to copy asset to the new album instead of move it.
 * Defaults to `true`.
 * @return Newly created [`Album`](#album).
 */
export declare function createAlbumAsync(albumName: string, asset?: AssetRef, copyAsset?: boolean): Promise<Album>;
/**
 * Deletes given albums from the library. On Android by default it deletes assets belonging to given
 * albums from the library. On iOS it doesn't delete these assets, however it's possible to do by
 * passing `true` as `deleteAssets`.
 * @param albums An array of [`Album`](#asset)s or their IDs.
 * @param assetRemove __iOS Only.__ Whether to also delete assets belonging to given albums.
 * Defaults to `false`.
 * @return Returns a promise which fulfils with `true` if the albums were successfully deleted from
 * the library.
 */
export declare function deleteAlbumsAsync(albums: AlbumRef[] | AlbumRef, assetRemove?: boolean): Promise<boolean>;
/**
 * Fetches a page of assets matching the provided criteria.
 * @param assetsOptions
 * @return A promise that fulfils with to [`PagedInfo`](#pagedinfo) object with array of [`Asset`](#asset)s.
 */
export declare function getAssetsAsync(assetsOptions?: AssetsOptions): Promise<PagedInfo<Asset>>;
/**
 * Subscribes for updates in user's media library.
 * @param listener A callback that is fired when any assets have been inserted or deleted from the
 * library, or when the user changes which assets they're allowing access to. On Android it's
 * invoked with an empty object. On iOS it's invoked with [`MediaLibraryAssetsChangeEvent`](#medialibraryassetschangeevent)
 * object.
 * @return An [`Subscription`](#subscription) object that you can call `remove()` on when you would
 * like to unsubscribe the listener.
 */
export declare function addListener(listener: (event: MediaLibraryAssetsChangeEvent) => void): Subscription;
export declare function removeSubscription(subscription: Subscription): void;
/**
 * Removes all listeners.
 */
export declare function removeAllListeners(): void;
/**
 * Fetches a list of moments, which is a group of assets taken around the same place
 * and time.
 * @return An array of [albums](#album) whose type is `moment`.
 * @platform ios
 */
export declare function getMomentsAsync(): Promise<any>;
/**
 * Moves album content to the special media directories on **Android R** or **above** if needed.
 * Those new locations are in line with the Android `scoped storage` - so your application won't
 * lose write permission to those directories in the future.
 *
 * This method does nothing if:
 * - app is running on **iOS**, **web** or **Android below R**
 * - app has **write permission** to the album folder
 *
 * The migration is possible when the album contains only compatible files types.
 * For instance, movies and pictures are compatible with each other, but music and pictures are not.
 * If automatic migration isn't possible, the function will be rejected.
 * In that case, you can use methods from the `expo-file-system` to migrate all your files manually.
 *
 * # Why do you need to migrate files?
 * __Android R__ introduced a lot of changes in the storage system. Now applications can't save
 * anything to the root directory. The only available locations are from the `MediaStore` API.
 * Unfortunately, the media library stored albums in folders for which, because of those changes,
 * the application doesn't have permissions anymore. However, it doesn't mean you need to migrate
 * all your albums. If your application doesn't add assets to albums, you don't have to migrate.
 * Everything will work as it used to. You can read more about scoped storage in [the Android documentation](https://developer.android.com/about/versions/11/privacy/storage).
 *
 * @param album An [Album](#album) or its ID.
 * @return A promise which fulfils to `void`.
 */
export declare function migrateAlbumIfNeededAsync(album: AlbumRef): Promise<void>;
/**
 * Checks if the album should be migrated to a different location. In other words, it checks if the
 * application has the write permission to the album folder. If not, it returns `true`, otherwise `false`.
 * > Note: For **Android below R**, **web** or **iOS**, this function always returns `false`.
 * @param album An [Album](#album) or its ID.
 * @return Returns a promise which fulfils with `true` if the album should be migrated.
 */
export declare function albumNeedsMigrationAsync(album: AlbumRef): Promise<boolean>;
//# sourceMappingURL=MediaLibrary.d.ts.map