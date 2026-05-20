function errorOnLegacyMethodUse(methodName) {
    const message = `Method ${methodName} imported from "expo-media-library" is deprecated.\nImport the legacy API from "expo-media-library/legacy" or migrate to the new class-based API from "expo-media-library".\nAPI reference and migration examples are available in the media library docs: https://docs.expo.dev/versions/latest/sdk/media-library/`;
    console.warn(message);
    return new Error(message);
}
/**
 * @deprecated Import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export async function isAvailableAsync() {
    throw errorOnLegacyMethodUse('isAvailableAsync');
}
/**
 * @deprecated Use `presentPermissionsPicker()` or import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export async function presentPermissionsPickerAsync(mediaTypes) {
    throw errorOnLegacyMethodUse('presentPermissionsPickerAsync');
}
/**
 * @deprecated Use `Asset.create()` or import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export async function createAssetAsync(localUri, album) {
    throw errorOnLegacyMethodUse('createAssetAsync');
}
/**
 * @deprecated Use `Asset.create()` or import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export async function saveToLibraryAsync(localUri) {
    throw errorOnLegacyMethodUse('saveToLibraryAsync');
}
/**
 * @deprecated Use `album.add()` or import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export async function addAssetsToAlbumAsync(assets, album, copy) {
    throw errorOnLegacyMethodUse('addAssetsToAlbumAsync');
}
/**
 * @deprecated Use `album.removeAssets()` or import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export async function removeAssetsFromAlbumAsync(assets, album) {
    throw errorOnLegacyMethodUse('removeAssetsFromAlbumAsync');
}
/**
 * @deprecated Use `asset.delete()` or `Asset.delete()` or import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export async function deleteAssetsAsync(assets) {
    throw errorOnLegacyMethodUse('deleteAssetsAsync');
}
/**
 * @deprecated Use `asset.getInfo()` or import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export async function getAssetInfoAsync(asset, options) {
    throw errorOnLegacyMethodUse('getAssetInfoAsync');
}
/**
 * @deprecated Use `Album.getAll()` or import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export async function getAlbumsAsync(options) {
    throw errorOnLegacyMethodUse('getAlbumsAsync');
}
/**
 * @deprecated Use `Album.get(title)` or import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export async function getAlbumAsync(title) {
    throw errorOnLegacyMethodUse('getAlbumAsync');
}
/**
 * @deprecated Use `Album.create()` or import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export async function createAlbumAsync(albumName, asset, copyAsset, initialAssetLocalUri) {
    throw errorOnLegacyMethodUse('createAlbumAsync');
}
/**
 * @deprecated Use `album.delete()` or `Album.delete()` or import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export async function deleteAlbumsAsync(albums, assetRemove) {
    throw errorOnLegacyMethodUse('deleteAlbumsAsync');
}
/**
 * @deprecated Use the `Query` class or import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export async function getAssetsAsync(assetsOptions = {}) {
    throw errorOnLegacyMethodUse('getAssetsAsync');
}
/**
 * @deprecated Use `subscription.remove()` or import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export function removeSubscription(subscription) {
    throw errorOnLegacyMethodUse('removeSubscription');
}
/**
 * @deprecated Import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export async function getMomentsAsync() {
    throw errorOnLegacyMethodUse('getMomentsAsync');
}
/**
 * @deprecated Import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export async function migrateAlbumIfNeededAsync(album) {
    throw errorOnLegacyMethodUse('migrateAlbumIfNeededAsync');
}
/**
 * @deprecated Import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export async function albumNeedsMigrationAsync(album) {
    throw errorOnLegacyMethodUse('albumNeedsMigrationAsync');
}
/**
 * @deprecated Use `asset.setFavorite()` or import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export async function setAssetFavoriteAsync(asset, isFavorite) {
    throw errorOnLegacyMethodUse('setAssetFavoriteAsync');
}
//# sourceMappingURL=legacyWarnings.js.map