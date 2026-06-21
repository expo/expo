import type { EventSubscription } from 'expo-modules-core';

import type {
  Album,
  AlbumRef,
  AlbumsOptions,
  Asset,
  AssetInfo,
  AssetRef,
  AssetsOptions,
  MediaLibraryAssetInfoQueryOptions,
  MediaTypeFilter,
  PagedInfo,
} from './legacy/MediaLibrary';

function errorOnLegacyMethodUse(methodName: string): Error {
  const message = `Method ${methodName} imported from "expo-media-library" is deprecated.\nImport the legacy API from "expo-media-library/legacy" or migrate to the new class-based API from "expo-media-library".\nAPI reference and migration examples are available in the media library docs: https://docs.expo.dev/versions/latest/sdk/media-library/`;
  console.warn(message);
  return new Error(message);
}

/**
 * @deprecated Import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export async function isAvailableAsync(): Promise<boolean> {
  throw errorOnLegacyMethodUse('isAvailableAsync');
}

/**
 * @deprecated Use `presentPermissionsPicker()` or import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export async function presentPermissionsPickerAsync(mediaTypes?: MediaTypeFilter[]): Promise<void> {
  throw errorOnLegacyMethodUse('presentPermissionsPickerAsync');
}

/**
 * @deprecated Use `Asset.create()` or import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export async function createAssetAsync(localUri: string, album?: AlbumRef): Promise<Asset> {
  throw errorOnLegacyMethodUse('createAssetAsync');
}

/**
 * @deprecated Use `Asset.create()` or import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export async function saveToLibraryAsync(localUri: string): Promise<void> {
  throw errorOnLegacyMethodUse('saveToLibraryAsync');
}

/**
 * @deprecated Use `album.add()` or import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export async function addAssetsToAlbumAsync(
  assets: AssetRef[] | AssetRef,
  album: AlbumRef,
  copy?: boolean
): Promise<boolean> {
  throw errorOnLegacyMethodUse('addAssetsToAlbumAsync');
}

/**
 * @deprecated Use `album.removeAssets()` or import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export async function removeAssetsFromAlbumAsync(
  assets: AssetRef[] | AssetRef,
  album: AlbumRef
): Promise<boolean> {
  throw errorOnLegacyMethodUse('removeAssetsFromAlbumAsync');
}

/**
 * @deprecated Use `asset.delete()` or `Asset.delete()` or import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export async function deleteAssetsAsync(assets: AssetRef[] | AssetRef): Promise<boolean> {
  throw errorOnLegacyMethodUse('deleteAssetsAsync');
}

/**
 * @deprecated Use `asset.getInfo()` or import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export async function getAssetInfoAsync(
  asset: AssetRef,
  options?: MediaLibraryAssetInfoQueryOptions
): Promise<AssetInfo> {
  throw errorOnLegacyMethodUse('getAssetInfoAsync');
}

/**
 * @deprecated Use `Album.getAll()` or import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export async function getAlbumsAsync(options?: AlbumsOptions): Promise<Album[]> {
  throw errorOnLegacyMethodUse('getAlbumsAsync');
}

/**
 * @deprecated Use `Album.get(title)` or import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export async function getAlbumAsync(title: string): Promise<Album> {
  throw errorOnLegacyMethodUse('getAlbumAsync');
}

/**
 * @deprecated Use `Album.create()` or import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export async function createAlbumAsync(
  albumName: string,
  asset?: AssetRef,
  copyAsset?: boolean,
  initialAssetLocalUri?: string
): Promise<Album> {
  throw errorOnLegacyMethodUse('createAlbumAsync');
}

/**
 * @deprecated Use `album.delete()` or `Album.delete()` or import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export async function deleteAlbumsAsync(
  albums: AlbumRef[] | AlbumRef,
  assetRemove?: boolean
): Promise<boolean> {
  throw errorOnLegacyMethodUse('deleteAlbumsAsync');
}

/**
 * @deprecated Use the `Query` class or import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export async function getAssetsAsync(assetsOptions: AssetsOptions = {}): Promise<PagedInfo<Asset>> {
  throw errorOnLegacyMethodUse('getAssetsAsync');
}

/**
 * @deprecated Use `subscription.remove()` or import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export function removeSubscription(subscription: EventSubscription): void {
  throw errorOnLegacyMethodUse('removeSubscription');
}

/**
 * @deprecated Import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export async function getMomentsAsync(): Promise<Album[]> {
  throw errorOnLegacyMethodUse('getMomentsAsync');
}

/**
 * @deprecated Import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export async function migrateAlbumIfNeededAsync(album: AlbumRef): Promise<void> {
  throw errorOnLegacyMethodUse('migrateAlbumIfNeededAsync');
}

/**
 * @deprecated Import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export async function albumNeedsMigrationAsync(album: AlbumRef): Promise<boolean> {
  throw errorOnLegacyMethodUse('albumNeedsMigrationAsync');
}

/**
 * @deprecated Use `asset.setFavorite()` or import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export async function setAssetFavoriteAsync(
  asset: AssetRef,
  isFavorite: boolean
): Promise<boolean> {
  throw errorOnLegacyMethodUse('setAssetFavoriteAsync');
}

/**
 * @deprecated Import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export async function getAssetContentUriAsync(asset: AssetRef): Promise<string> {
  throw errorOnLegacyMethodUse('getAssetContentUriAsync');
}
