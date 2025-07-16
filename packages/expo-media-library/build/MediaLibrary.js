import { PermissionStatus, createPermissionHook, UnavailabilityError, } from 'expo-modules-core';
import { Platform } from 'react-native';
import MediaLibrary from './ExpoMediaLibrary';
const isExpoGo = typeof expo !== 'undefined' && globalThis.expo?.modules?.ExpoGo;
let loggedExpoGoWarning = false;
if (isExpoGo && !loggedExpoGoWarning) {
    console.warn('Due to changes in Androids permission requirements, Expo Go can no longer provide full access to the media library. To test the full functionality of this module, you can create a development build. https://docs.expo.dev/develop/development-builds/create-a-build');
    loggedExpoGoWarning = true;
}
export { PermissionStatus, };
function arrayize(item) {
    if (Array.isArray(item)) {
        return item;
    }
    return item ? [item] : [];
}
function getId(ref) {
    if (typeof ref === 'string') {
        return ref;
    }
    return ref ? ref.id : undefined;
}
function checkAssetIds(assetIds) {
    if (assetIds.some((id) => !id || typeof id !== 'string')) {
        throw new Error('Asset ID must be a string!');
    }
}
function checkAlbumIds(albumIds) {
    if (albumIds.some((id) => !id || typeof id !== 'string')) {
        throw new Error('Album ID must be a string!');
    }
}
function checkMediaType(mediaType) {
    if (Object.values(MediaType).indexOf(mediaType) === -1) {
        throw new Error(`Invalid mediaType: ${mediaType}`);
    }
}
function checkSortBy(sortBy) {
    if (Array.isArray(sortBy)) {
        checkSortByKey(sortBy[0]);
        if (typeof sortBy[1] !== 'boolean') {
            throw new Error('Invalid sortBy array argument. Second item must be a boolean!');
        }
    }
    else {
        checkSortByKey(sortBy);
    }
}
function checkSortByKey(sortBy) {
    if (Object.values(SortBy).indexOf(sortBy) === -1) {
        throw new Error(`Invalid sortBy key: ${sortBy}`);
    }
}
function sortByOptionToString(sortBy) {
    checkSortBy(sortBy);
    if (Array.isArray(sortBy)) {
        return `${sortBy[0]} ${sortBy[1] ? 'ASC' : 'DESC'}`;
    }
    return `${sortBy} DESC`;
}
function dateToNumber(value) {
    return value instanceof Date ? value.getTime() : value;
}
// @needsAudit
/**
 * Possible media types.
 */
export const MediaType = MediaLibrary.MediaType;
// @needsAudit
/**
 * Supported keys that can be used to sort `getAssetsAsync` results.
 */
export const SortBy = MediaLibrary.SortBy;
// @needsAudit
/**
 * Returns whether the Media Library API is enabled on the current device.
 * @return A promise which fulfils with a `boolean`, indicating whether the Media Library API is
 * available on the current device.
 */
export async function isAvailableAsync() {
    return !!MediaLibrary && 'getAssetsAsync' in MediaLibrary;
}
// @needsAudit @docsMissing
/**
 * Asks the user to grant permissions for accessing media in user's media library.
 * @param writeOnly
 * @param granularPermissions - A list of [`GranularPermission`](#granularpermission) values. This parameter has an
 * effect only on Android 13 and newer. By default, `expo-media-library` will ask for all possible permissions.
 *
 * > When using granular permissions with a custom config plugin configuration, make sure that all the requested permissions are included in the plugin.
 * @return A promise that fulfils with [`PermissionResponse`](#permissionresponse) object.
 */
export async function requestPermissionsAsync(writeOnly = false, granularPermissions) {
    if (!MediaLibrary.requestPermissionsAsync) {
        throw new UnavailabilityError('MediaLibrary', 'requestPermissionsAsync');
    }
    if (Platform.OS === 'android') {
        return await MediaLibrary.requestPermissionsAsync(writeOnly, granularPermissions);
    }
    return await MediaLibrary.requestPermissionsAsync(writeOnly);
}
// @needsAudit @docsMissing
/**
 * Checks user's permissions for accessing media library.
 * @param writeOnly
 * @param granularPermissions - A list of [`GranularPermission`](#granularpermission) values. This parameter has
 * an effect only on Android 13 and newer. By default, `expo-media-library` will ask for all possible permissions.
 * @return A promise that fulfils with [`PermissionResponse`](#permissionresponse) object.
 */
export async function getPermissionsAsync(writeOnly = false, granularPermissions) {
    if (!MediaLibrary.getPermissionsAsync) {
        throw new UnavailabilityError('MediaLibrary', 'getPermissionsAsync');
    }
    if (Platform.OS === 'android') {
        return await MediaLibrary.getPermissionsAsync(writeOnly, granularPermissions);
    }
    return await MediaLibrary.getPermissionsAsync(writeOnly);
}
// @needsAudit
/**
 * Check or request permissions to access the media library.
 * This uses both `requestPermissionsAsync` and `getPermissionsAsync` to interact with the permissions.
 *
 * @example
 * ```ts
 * const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();
 * ```
 */
export const usePermissions = createPermissionHook({
    // TODO(cedric): permission requesters should have an options param or a different requester
    getMethod: (options) => getPermissionsAsync(options?.writeOnly, options?.granularPermissions),
    requestMethod: (options) => requestPermissionsAsync(options?.writeOnly, options?.granularPermissions),
});
// @needsAudit
/**
 * Allows the user to update the assets that your app has access to.
 * The system modal is only displayed if the user originally allowed only `limited` access to their
 * media library, otherwise this method is a no-op.
 * @param mediaTypes Limits the type(s) of media that the user will be granting access to. By default, a list that shows both photos and videos is presented.
 *
 * @return A promise that either rejects if the method is unavailable, or resolves to `void`.
 * > __Note:__ This method doesn't inform you if the user changes which assets your app has access to.
 * That information is only exposed by iOS, and to obtain it, you need to subscribe for updates to the user's media library using [`addListener()`](#medialibraryaddlistenerlistener).
 * If `hasIncrementalChanges` is `false`, the user changed their permissions.
 *
 * @platform android 14+
 * @platform ios
 */
export async function presentPermissionsPickerAsync(mediaTypes = ['photo', 'video']) {
    if (Platform.OS === 'android' && isExpoGo) {
        throw new UnavailabilityError('MediaLibrary', 'presentPermissionsPickerAsync is unavailable in Expo Go');
    }
    if (Platform.OS === 'android' && Platform.Version >= 34) {
        await MediaLibrary.requestPermissionsAsync(false, mediaTypes);
        return;
    }
    if (!MediaLibrary.presentPermissionsPickerAsync) {
        throw new UnavailabilityError('MediaLibrary', 'presentPermissionsPickerAsync');
    }
    return await MediaLibrary.presentPermissionsPickerAsync();
}
// @needsAudit
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
 *
 * @param album An [Album](#album) or its ID. If provided, the asset will be added to this album upon creation, otherwise it will be added to the default album for the media type.
 * The album has exist.
 * @return A promise which fulfils with an object representing an [`Asset`](#asset).
 */
export async function createAssetAsync(localUri, album) {
    if (!MediaLibrary.createAssetAsync) {
        throw new UnavailabilityError('MediaLibrary', 'createAssetAsync');
    }
    const albumId = getId(album);
    if (!localUri || typeof localUri !== 'string') {
        throw new Error('Invalid argument "localUri". It must be a string!');
    }
    const asset = await MediaLibrary.createAssetAsync(localUri, albumId);
    if (Array.isArray(asset)) {
        // Android returns an array with asset, we need to pick the first item
        return asset[0];
    }
    return asset;
}
// @needsAudit
/**
 * Saves the file at given `localUri` to the user's media library. Unlike [`createAssetAsync()`](#medialibrarycreateassetasynclocaluri),
 * This method doesn't return created asset.
 * On __iOS 11+__, it's possible to use this method without asking for `CAMERA_ROLL` permission,
 * however then yours `Info.plist` should have `NSPhotoLibraryAddUsageDescription` key.
 * @param localUri A URI to the image or video file. It must contain an extension. On Android it
 * must be a local path, so it must start with `file:///`.
 */
export async function saveToLibraryAsync(localUri) {
    if (!MediaLibrary.saveToLibraryAsync) {
        throw new UnavailabilityError('MediaLibrary', 'saveToLibraryAsync');
    }
    return await MediaLibrary.saveToLibraryAsync(localUri);
}
// @needsAudit
/**
 * Adds array of assets to the album.
 *
 * On Android, by default it copies assets from the current album to provided one, however it's also
 * possible to move them by passing `false` as `copyAssets` argument. In case they're copied you
 * should keep in mind that `getAssetsAsync` will return duplicated assets.
 * @param assets An array of [Asset](#asset) or their IDs.
 * @param album An [Album](#album) or its ID.
 * @param copy __Android only.__ Whether to copy assets to the new album instead of move them.
 * Defaults to `true`.
 * @return Returns promise which fulfils with `true` if the assets were successfully added to
 * the album.
 */
export async function addAssetsToAlbumAsync(assets, album, copy = true) {
    if (!MediaLibrary.addAssetsToAlbumAsync) {
        throw new UnavailabilityError('MediaLibrary', 'addAssetsToAlbumAsync');
    }
    const assetIds = arrayize(assets).map(getId);
    const albumId = getId(album);
    checkAssetIds(assetIds);
    if (!albumId || typeof albumId !== 'string') {
        throw new Error('Invalid album ID. It must be a string!');
    }
    if (Platform.OS === 'ios') {
        return await MediaLibrary.addAssetsToAlbumAsync(assetIds, albumId);
    }
    return await MediaLibrary.addAssetsToAlbumAsync(assetIds, albumId, !!copy);
}
// @needsAudit
/**
 * Removes given assets from album.
 *
 * On Android, album will be automatically deleted if there are no more assets inside.
 * @param assets An array of [Asset](#asset) or their IDs.
 * @param album An [Album](#album) or its ID.
 * @return Returns promise which fulfils with `true` if the assets were successfully removed from
 * the album.
 */
export async function removeAssetsFromAlbumAsync(assets, album) {
    if (!MediaLibrary.removeAssetsFromAlbumAsync) {
        throw new UnavailabilityError('MediaLibrary', 'removeAssetsFromAlbumAsync');
    }
    const assetIds = arrayize(assets).map(getId);
    const albumId = getId(album);
    checkAssetIds(assetIds);
    return await MediaLibrary.removeAssetsFromAlbumAsync(assetIds, albumId);
}
// @needsAudit
/**
 * Deletes assets from the library. On iOS it deletes assets from all albums they belong to, while
 * on Android it keeps all copies of them (album is strictly connected to the asset). Also, there is
 * additional dialog on iOS that requires user to confirm this action.
 * @param assets An array of [Asset](#asset) or their IDs.
 * @return Returns promise which fulfils with `true` if the assets were successfully deleted.
 */
export async function deleteAssetsAsync(assets) {
    if (!MediaLibrary.deleteAssetsAsync) {
        throw new UnavailabilityError('MediaLibrary', 'deleteAssetsAsync');
    }
    const assetIds = arrayize(assets).map(getId);
    checkAssetIds(assetIds);
    return await MediaLibrary.deleteAssetsAsync(assetIds);
}
// @needsAudit
/**
 * Provides more information about an asset, including GPS location, local URI and EXIF metadata.
 * @param asset An [Asset](#asset) or its ID.
 * @param options
 * @return An [AssetInfo](#assetinfo) object, which is an `Asset` extended by an additional fields.
 */
export async function getAssetInfoAsync(asset, options = { shouldDownloadFromNetwork: true }) {
    if (!MediaLibrary.getAssetInfoAsync) {
        throw new UnavailabilityError('MediaLibrary', 'getAssetInfoAsync');
    }
    const assetId = getId(asset);
    checkAssetIds([assetId]);
    const assetInfo = await MediaLibrary.getAssetInfoAsync(assetId, options);
    if (Array.isArray(assetInfo)) {
        // Android returns an array with asset info, we need to pick the first item
        return assetInfo[0];
    }
    return assetInfo;
}
// @needsAudit
/**
 * Queries for user-created albums in media gallery.
 * @return A promise which fulfils with an array of [`Album`](#asset)s. Depending on Android version,
 * root directory of your storage may be listed as album titled `"0"` or unlisted at all.
 */
export async function getAlbumsAsync({ includeSmartAlbums = false } = {}) {
    if (!MediaLibrary.getAlbumsAsync) {
        throw new UnavailabilityError('MediaLibrary', 'getAlbumsAsync');
    }
    return await MediaLibrary.getAlbumsAsync({ includeSmartAlbums });
}
// @needsAudit
/**
 * Queries for an album with a specific name.
 * @param title Name of the album to look for.
 * @return An object representing an [`Album`](#album), if album with given name exists, otherwise
 * returns `null`.
 */
export async function getAlbumAsync(title) {
    if (!MediaLibrary.getAlbumAsync) {
        throw new UnavailabilityError('MediaLibrary', 'getAlbumAsync');
    }
    if (typeof title !== 'string') {
        throw new Error('Album title must be a string!');
    }
    return await MediaLibrary.getAlbumAsync(title);
}
// @needsAudit
/**
 * Creates an album with given name and initial asset. The asset parameter is required on Android,
 * since it's not possible to create empty album on this platform. On Android, by default it copies
 * given asset from the current album to the new one, however it's also possible to move it by
 * passing `false` as `copyAsset` argument.
 * In case it's copied you should keep in mind that `getAssetsAsync` will return duplicated asset.
 * > On Android, it's not possible to create an empty album. You must provide an existing asset to copy or move into the album or an uri of a local file, which will be used to create an initial asset for the album.
 * @param albumName Name of the album to create.
 * @param asset An [Asset](#asset) or its ID. On Android you either need to provide an asset or a localUri.
 * @param initialAssetLocalUri A URI to the local media file, which will be used to create the initial asset inside the album. It must contain an extension. On Android it
 * must be a local path, so it must start with `file:///`. If the `asset` was provided, this parameter will be ignored.
 * @param copyAsset __Android Only.__ Whether to copy asset to the new album instead of move it. This parameter is ignored if `asset` was not provided.
 * Defaults to `true`.
 * @return Newly created [`Album`](#album).
 */
export async function createAlbumAsync(albumName, asset, copyAsset = true, initialAssetLocalUri) {
    if (!MediaLibrary.createAlbumAsync) {
        throw new UnavailabilityError('MediaLibrary', 'createAlbumAsync');
    }
    const assetId = getId(asset);
    if (Platform.OS === 'android' &&
        (typeof assetId !== 'string' || assetId.length === 0) &&
        !initialAssetLocalUri) {
        // it's not possible to create empty album on Android, so initial asset must be provided
        throw new Error('MediaLibrary.createAlbumAsync must be called with an asset or a localUri on Android.');
    }
    if (!albumName || typeof albumName !== 'string') {
        throw new Error('Invalid argument "albumName". It must be a string!');
    }
    if (assetId != null && typeof assetId !== 'string') {
        throw new Error('Asset ID must be a string!');
    }
    if (Platform.OS === 'ios') {
        return await MediaLibrary.createAlbumAsync(albumName, assetId, initialAssetLocalUri);
    }
    return await MediaLibrary.createAlbumAsync(albumName, assetId, !!copyAsset, initialAssetLocalUri);
}
// @needsAudit
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
export async function deleteAlbumsAsync(albums, assetRemove = false) {
    if (!MediaLibrary.deleteAlbumsAsync) {
        throw new UnavailabilityError('MediaLibrary', 'deleteAlbumsAsync');
    }
    const albumIds = arrayize(albums).map(getId);
    checkAlbumIds(albumIds);
    if (Platform.OS === 'android') {
        return await MediaLibrary.deleteAlbumsAsync(albumIds);
    }
    return await MediaLibrary.deleteAlbumsAsync(albumIds, !!assetRemove);
}
// @needsAudit
/**
 * Fetches a page of assets matching the provided criteria.
 * @param assetsOptions
 * @return A promise that fulfils with to [`PagedInfo`](#pagedinfo) object with array of [`Asset`](#asset)s.
 */
export async function getAssetsAsync(assetsOptions = {}) {
    if (!MediaLibrary.getAssetsAsync) {
        throw new UnavailabilityError('MediaLibrary', 'getAssetsAsync');
    }
    const { first, after, album, sortBy, mediaType, createdAfter, createdBefore, mediaSubtypes, resolveWithFullInfo, } = assetsOptions;
    const options = {
        first: first == null ? 20 : first,
        after: getId(after),
        album: getId(album),
        sortBy: arrayize(sortBy),
        mediaType: arrayize(mediaType || [MediaType.photo]),
        mediaSubtypes: arrayize(mediaSubtypes),
        createdAfter: dateToNumber(createdAfter),
        createdBefore: dateToNumber(createdBefore),
        resolveWithFullInfo: resolveWithFullInfo ?? false,
    };
    if (first != null && typeof options.first !== 'number') {
        throw new Error('Option "first" must be a number!');
    }
    if (after != null && typeof options.after !== 'string') {
        throw new Error('Option "after" must be a string!');
    }
    if (album != null && typeof options.album !== 'string') {
        throw new Error('Option "album" must be a string!');
    }
    if (after != null && Platform.OS === 'android' && isNaN(parseInt(getId(after), 10))) {
        throw new Error('Option "after" must be a valid ID!');
    }
    if (first != null && first < 0) {
        throw new Error('Option "first" must be a positive integer!');
    }
    options.mediaType.forEach(checkMediaType);
    // TODO(@kitten): Add expected native types for `MediaLibrary`
    return await MediaLibrary.getAssetsAsync({
        ...options,
        sortBy: options.sortBy.map(sortByOptionToString),
    });
}
// @needsAudit
/**
 * Subscribes for updates in user's media library.
 * @param listener A callback that is fired when any assets have been inserted or deleted from the
 * library. On Android it's invoked with an empty object. On iOS, it's invoked with [`MediaLibraryAssetsChangeEvent`](#medialibraryassetschangeevent)
 * object.
 *
 * Additionally, only on iOS, the listener is also invoked when the user changes access to individual assets in the media library
 * using `presentPermissionsPickerAsync()`.
 * @return An [`Subscription`](#subscription) object that you can call `remove()` on when you would
 * like to unsubscribe the listener.
 */
export function addListener(listener) {
    return MediaLibrary.addListener(MediaLibrary.CHANGE_LISTENER_NAME, listener);
}
// @docsMissing
export function removeSubscription(subscription) {
    subscription.remove();
}
// @needsAudit
/**
 * Removes all listeners.
 */
export function removeAllListeners() {
    MediaLibrary.removeAllListeners(MediaLibrary.CHANGE_LISTENER_NAME);
}
// @needsAudit
/**
 * Fetches a list of moments, which is a group of assets taken around the same place
 * and time.
 * @return An array of [albums](#album) whose type is `moment`.
 * @platform ios
 */
export async function getMomentsAsync() {
    if (!MediaLibrary.getMomentsAsync) {
        throw new UnavailabilityError('MediaLibrary', 'getMomentsAsync');
    }
    return await MediaLibrary.getMomentsAsync();
}
// @needsAudit
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
 * If automatic migration isn't possible, the function rejects.
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
export async function migrateAlbumIfNeededAsync(album) {
    if (!MediaLibrary.migrateAlbumIfNeededAsync) {
        return;
    }
    return await MediaLibrary.migrateAlbumIfNeededAsync(getId(album));
}
// @needsAudit
/**
 * Checks if the album should be migrated to a different location. In other words, it checks if the
 * application has the write permission to the album folder. If not, it returns `true`, otherwise `false`.
 * > Note: For **Android below R**, **web** or **iOS**, this function always returns `false`.
 * @param album An [Album](#album) or its ID.
 * @return Returns a promise which fulfils with `true` if the album should be migrated.
 */
export async function albumNeedsMigrationAsync(album) {
    if (!MediaLibrary.albumNeedsMigrationAsync) {
        return false;
    }
    return await MediaLibrary.albumNeedsMigrationAsync(getId(album));
}
//# sourceMappingURL=MediaLibrary.js.map