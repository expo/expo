import type { EventSubscription } from 'expo-modules-core';
import type { Album, AlbumRef, AlbumsOptions, Asset, AssetInfo, AssetRef, AssetsOptions, MediaLibraryAssetInfoQueryOptions, MediaTypeFilter, PagedInfo } from './legacy/MediaLibrary';
/**
 * @deprecated Import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export declare function isAvailableAsync(): Promise<boolean>;
/**
 * @deprecated Use `presentPermissionsPicker()` or import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export declare function presentPermissionsPickerAsync(mediaTypes?: MediaTypeFilter[]): Promise<void>;
/**
 * @deprecated Use `Asset.create()` or import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export declare function createAssetAsync(localUri: string, album?: AlbumRef): Promise<Asset>;
/**
 * @deprecated Use `Asset.create()` or import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export declare function saveToLibraryAsync(localUri: string): Promise<void>;
/**
 * @deprecated Use `album.add()` or import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export declare function addAssetsToAlbumAsync(assets: AssetRef[] | AssetRef, album: AlbumRef, copy?: boolean): Promise<boolean>;
/**
 * @deprecated Use `album.removeAssets()` or import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export declare function removeAssetsFromAlbumAsync(assets: AssetRef[] | AssetRef, album: AlbumRef): Promise<boolean>;
/**
 * @deprecated Use `asset.delete()` or `Asset.delete()` or import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export declare function deleteAssetsAsync(assets: AssetRef[] | AssetRef): Promise<boolean>;
/**
 * @deprecated Use `asset.getInfo()` or import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export declare function getAssetInfoAsync(asset: AssetRef, options?: MediaLibraryAssetInfoQueryOptions): Promise<AssetInfo>;
/**
 * @deprecated Use `Album.getAll()` or import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export declare function getAlbumsAsync(options?: AlbumsOptions): Promise<Album[]>;
/**
 * @deprecated Use `Album.get(title)` or import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export declare function getAlbumAsync(title: string): Promise<Album>;
/**
 * @deprecated Use `Album.create()` or import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export declare function createAlbumAsync(albumName: string, asset?: AssetRef, copyAsset?: boolean, initialAssetLocalUri?: string): Promise<Album>;
/**
 * @deprecated Use `album.delete()` or `Album.delete()` or import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export declare function deleteAlbumsAsync(albums: AlbumRef[] | AlbumRef, assetRemove?: boolean): Promise<boolean>;
/**
 * @deprecated Use the `Query` class or import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export declare function getAssetsAsync(assetsOptions?: AssetsOptions): Promise<PagedInfo<Asset>>;
/**
 * @deprecated Use `subscription.remove()` or import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export declare function removeSubscription(subscription: EventSubscription): void;
/**
 * @deprecated Import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export declare function getMomentsAsync(): Promise<Album[]>;
/**
 * @deprecated Import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export declare function migrateAlbumIfNeededAsync(album: AlbumRef): Promise<void>;
/**
 * @deprecated Import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export declare function albumNeedsMigrationAsync(album: AlbumRef): Promise<boolean>;
/**
 * @deprecated Use `asset.setFavorite()` or import this method from `expo-media-library/legacy`. This method will throw in runtime.
 */
export declare function setAssetFavoriteAsync(asset: AssetRef, isFavorite: boolean): Promise<boolean>;
//# sourceMappingURL=legacyWarnings.d.ts.map