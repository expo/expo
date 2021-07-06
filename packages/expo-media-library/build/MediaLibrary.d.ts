import { Subscription } from '@unimodules/core';
import { PermissionResponse as EXPermissionResponse, PermissionStatus, PermissionExpiration } from 'expo-modules-core';
export declare type PermissionResponse = EXPermissionResponse & {
    accessPrivileges?: 'all' | 'limited' | 'none';
};
export declare type MediaTypeValue = 'audio' | 'photo' | 'video' | 'unknown';
export declare type SortByKey = 'default' | 'mediaType' | 'width' | 'height' | 'creationTime' | 'modificationTime' | 'duration';
export declare type SortByValue = [SortByKey, boolean] | SortByKey;
export declare type MediaTypeObject = {
    audio: 'audio';
    photo: 'photo';
    video: 'video';
    unknown: 'unknown';
};
export declare type SortByObject = {
    default: 'default';
    mediaType: 'mediaType';
    width: 'width';
    height: 'height';
    creationTime: 'creationTime';
    modificationTime: 'modificationTime';
    duration: 'duration';
};
export declare type Asset = {
    id: string;
    filename: string;
    uri: string;
    mediaType: MediaTypeValue;
    mediaSubtypes?: string[];
    width: number;
    height: number;
    creationTime: number;
    modificationTime: number;
    duration: number;
    albumId?: string;
};
export declare type AssetInfo = Asset & {
    localUri?: string;
    location?: Location;
    exif?: object;
    isFavorite?: boolean;
    isNetworkAsset?: boolean;
};
export declare type MediaLibraryAssetInfoQueryOptions = {
    shouldDownloadFromNetwork?: boolean;
};
export declare type MediaLibraryAssetsChangeEvent = {
    hasIncrementalChanges: false;
} | {
    hasIncrementalChanges: true;
    insertedAssets: Asset[];
    deletedAssets: Asset[];
    updatedAssets: Asset[];
};
export declare type Location = {
    latitude: number;
    longitude: number;
};
export declare type Album = {
    id: string;
    title: string;
    assetCount: number;
    type?: string;
    startTime: number;
    endTime: number;
    approximateLocation?: Location;
    locationNames?: string[];
};
export declare type AlbumsOptions = {
    includeSmartAlbums?: boolean;
};
export declare type AssetsOptions = {
    first?: number;
    after?: AssetRef;
    album?: AlbumRef;
    sortBy?: SortByValue[] | SortByValue;
    mediaType?: MediaTypeValue[] | MediaTypeValue;
    createdAfter?: Date | number;
    createdBefore?: Date | number;
};
export declare type PagedInfo<T> = {
    assets: T[];
    endCursor: string;
    hasNextPage: boolean;
    totalCount: number;
};
export declare type AssetRef = Asset | string;
export declare type AlbumRef = Album | string;
export { PermissionStatus, PermissionExpiration };
export declare const MediaType: MediaTypeObject;
export declare const SortBy: SortByObject;
export declare function requestPermissionsAsync(writeOnly?: boolean): Promise<PermissionResponse>;
export declare function getPermissionsAsync(writeOnly?: boolean): Promise<PermissionResponse>;
/**
 * @iOS-only
 * @throws Will throw an error if called on platform that doesn't support this functionality (eg. iOS < 14, Android, etc.).
 */
export declare function presentPermissionsPickerAsync(): Promise<void>;
export declare function createAssetAsync(localUri: string): Promise<Asset>;
export declare function saveToLibraryAsync(localUri: string): Promise<void>;
export declare function addAssetsToAlbumAsync(assets: AssetRef[] | AssetRef, album: AlbumRef, copy?: boolean): Promise<any>;
export declare function removeAssetsFromAlbumAsync(assets: AssetRef[] | AssetRef, album: AlbumRef): Promise<any>;
export declare function deleteAssetsAsync(assets: AssetRef[] | AssetRef): Promise<any>;
export declare function getAssetInfoAsync(asset: AssetRef, options?: MediaLibraryAssetInfoQueryOptions): Promise<AssetInfo>;
export declare function getAlbumsAsync({ includeSmartAlbums }?: AlbumsOptions): Promise<Album[]>;
export declare function getAlbumAsync(title: string): Promise<Album>;
export declare function createAlbumAsync(albumName: string, asset?: AssetRef, copyAsset?: boolean): Promise<Album>;
export declare function deleteAlbumsAsync(albums: AlbumRef[] | AlbumRef, assetRemove?: boolean): Promise<any>;
export declare function getAssetsAsync(assetsOptions?: AssetsOptions): Promise<PagedInfo<Asset>>;
export declare function addListener(listener: (event: MediaLibraryAssetsChangeEvent) => void): Subscription;
export declare function removeSubscription(subscription: Subscription): void;
export declare function removeAllListeners(): void;
export declare function getMomentsAsync(): Promise<any>;
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
export declare function migrateAlbumIfNeededAsync(album: AlbumRef): Promise<void>;
/**
 * Checks if provided album should be migrated.
 * In other words, it checks if the application has the write permission to the album folder.
 *
 * This method always returns **false** for all android versions **below Android R**, **iOS** or **web**.
 *
 * @param album
 */
export declare function albumNeedsMigrationAsync(album: AlbumRef): Promise<boolean>;
