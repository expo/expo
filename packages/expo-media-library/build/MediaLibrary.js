import { EventEmitter, UnavailabilityError } from '@unimodules/core';
import { PermissionStatus, } from 'expo-modules-core';
import { Platform } from 'react-native';
import MediaLibrary from './ExponentMediaLibrary';
const eventEmitter = new EventEmitter(MediaLibrary);
export { PermissionStatus };
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
    if (assetIds.some(id => !id || typeof id !== 'string')) {
        throw new Error('Asset ID must be a string!');
    }
}
function checkAlbumIds(albumIds) {
    if (albumIds.some(id => !id || typeof id !== 'string')) {
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
function dateToNumber(value) {
    return value instanceof Date ? value.getTime() : value;
}
// export constants
export const MediaType = MediaLibrary.MediaType;
export const SortBy = MediaLibrary.SortBy;
export async function requestPermissionsAsync(writeOnly = false) {
    if (!MediaLibrary.requestPermissionsAsync) {
        throw new UnavailabilityError('MediaLibrary', 'requestPermissionsAsync');
    }
    return await MediaLibrary.requestPermissionsAsync(writeOnly);
}
export async function getPermissionsAsync(writeOnly = false) {
    if (!MediaLibrary.getPermissionsAsync) {
        throw new UnavailabilityError('MediaLibrary', 'getPermissionsAsync');
    }
    return await MediaLibrary.getPermissionsAsync(writeOnly);
}
/**
 * @iOS-only
 * @throws Will throw an error if called on platform that doesn't support this functionality (eg. iOS < 14, Android, etc.).
 */
export async function presentPermissionsPickerAsync() {
    if (!MediaLibrary.presentPermissionsPickerAsync) {
        throw new UnavailabilityError('MediaLibrary', 'presentPermissionsPickerAsync');
    }
    return await MediaLibrary.presentPermissionsPickerAsync();
}
export async function createAssetAsync(localUri) {
    if (!MediaLibrary.createAssetAsync) {
        throw new UnavailabilityError('MediaLibrary', 'createAssetAsync');
    }
    if (!localUri || typeof localUri !== 'string') {
        throw new Error('Invalid argument "localUri". It must be a string!');
    }
    const asset = await MediaLibrary.createAssetAsync(localUri);
    if (Array.isArray(asset)) {
        // Android returns an array with asset, we need to pick the first item
        return asset[0];
    }
    return asset;
}
export async function saveToLibraryAsync(localUri) {
    if (!MediaLibrary.saveToLibraryAsync) {
        throw new UnavailabilityError('MediaLibrary', 'saveToLibraryAsync');
    }
    return await MediaLibrary.saveToLibraryAsync(localUri);
}
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
export async function removeAssetsFromAlbumAsync(assets, album) {
    if (!MediaLibrary.removeAssetsFromAlbumAsync) {
        throw new UnavailabilityError('MediaLibrary', 'removeAssetsFromAlbumAsync');
    }
    const assetIds = arrayize(assets).map(getId);
    const albumId = getId(album);
    checkAssetIds(assetIds);
    return await MediaLibrary.removeAssetsFromAlbumAsync(assetIds, albumId);
}
export async function deleteAssetsAsync(assets) {
    if (!MediaLibrary.deleteAssetsAsync) {
        throw new UnavailabilityError('MediaLibrary', 'deleteAssetsAsync');
    }
    const assetIds = arrayize(assets).map(getId);
    checkAssetIds(assetIds);
    return await MediaLibrary.deleteAssetsAsync(assetIds);
}
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
export async function getAlbumsAsync({ includeSmartAlbums = false } = {}) {
    if (!MediaLibrary.getAlbumsAsync) {
        throw new UnavailabilityError('MediaLibrary', 'getAlbumsAsync');
    }
    return await MediaLibrary.getAlbumsAsync({ includeSmartAlbums });
}
export async function getAlbumAsync(title) {
    if (!MediaLibrary.getAlbumAsync) {
        throw new UnavailabilityError('MediaLibrary', 'getAlbumAsync');
    }
    if (typeof title !== 'string') {
        throw new Error('Album title must be a string!');
    }
    return await MediaLibrary.getAlbumAsync(title);
}
export async function createAlbumAsync(albumName, asset, copyAsset = true) {
    if (!MediaLibrary.createAlbumAsync) {
        throw new UnavailabilityError('MediaLibrary', 'createAlbumAsync');
    }
    const assetId = getId(asset);
    if (Platform.OS === 'android' && (typeof assetId !== 'string' || assetId.length === 0)) {
        // it's not possible to create empty album on Android, so initial asset must be provided
        throw new Error('MediaLibrary.createAlbumAsync must be called with an asset on Android.');
    }
    if (!albumName || typeof albumName !== 'string') {
        throw new Error('Invalid argument "albumName". It must be a string!');
    }
    if (assetId != null && typeof assetId !== 'string') {
        throw new Error('Asset ID must be a string!');
    }
    if (Platform.OS === 'ios') {
        return await MediaLibrary.createAlbumAsync(albumName, assetId);
    }
    return await MediaLibrary.createAlbumAsync(albumName, assetId, !!copyAsset);
}
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
export async function getAssetsAsync(assetsOptions = {}) {
    if (!MediaLibrary.getAssetsAsync) {
        throw new UnavailabilityError('MediaLibrary', 'getAssetsAsync');
    }
    const { first, after, album, sortBy, mediaType, createdAfter, createdBefore } = assetsOptions;
    const options = {
        first: first == null ? 20 : first,
        after: getId(after),
        album: getId(album),
        sortBy: arrayize(sortBy),
        mediaType: arrayize(mediaType || [MediaType.photo]),
        createdAfter: dateToNumber(createdAfter),
        createdBefore: dateToNumber(createdBefore),
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
    options.sortBy.forEach(checkSortBy);
    options.mediaType.forEach(checkMediaType);
    return await MediaLibrary.getAssetsAsync(options);
}
export function addListener(listener) {
    const subscription = eventEmitter.addListener(MediaLibrary.CHANGE_LISTENER_NAME, listener);
    return subscription;
}
export function removeSubscription(subscription) {
    subscription.remove();
}
export function removeAllListeners() {
    eventEmitter.removeAllListeners(MediaLibrary.CHANGE_LISTENER_NAME);
}
// iOS only
export async function getMomentsAsync() {
    if (!MediaLibrary.getMomentsAsync) {
        throw new UnavailabilityError('MediaLibrary', 'getMomentsAsync');
    }
    return await MediaLibrary.getMomentsAsync();
}
// Android only
/**
 * Moves content of provided album to the special media directories on **Android R** or **above** if needed.
 *
 * This method won't do anything if:
 * - app is running on **iOS**, **web** or **Android below R**
 * - app has **write permission** to the album folder
 *
 * The migration is possible when the album contains only compatible files types.
 * For instance, movies and pictures are compatible with each other, but music and pictures are not.
 * If automatic migration isn't possible, the function will be rejected.
 * In that case, you can use methods from the `expo-file-system` to migrate all your files manually.
 *
 * @param album
 */
export async function migrateAlbumIfNeededAsync(album) {
    if (!MediaLibrary.migrateAlbumIfNeededAsync) {
        return;
    }
    return await MediaLibrary.migrateAlbumIfNeededAsync(getId(album));
}
// Android only
/**
 * Checks if provided album should be migrated.
 * In other words, it checks if the application has the write permission to the album folder.
 *
 * This method always returns **false** for all android versions **below Android R**, **iOS** or **web**.
 *
 * @param album
 */
export async function albumNeedsMigrationAsync(album) {
    if (!MediaLibrary.albumNeedsMigrationAsync) {
        return false;
    }
    return await MediaLibrary.albumNeedsMigrationAsync(getId(album));
}
//# sourceMappingURL=MediaLibrary.js.map