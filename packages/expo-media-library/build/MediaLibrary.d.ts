import { Subscription } from '@unimodules/core';
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
    mediaSubtypes?: Array<string>;
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
    exif?: Object;
    isFavorite?: boolean;
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
    locationNames?: Array<string>;
};
export declare type AlbumsOptions = {
    includeSmartAlbums?: boolean;
};
export declare type AssetsOptions = {
    first?: number;
    after?: AssetRef;
    album?: AlbumRef;
    sortBy?: Array<SortByValue> | SortByValue;
    mediaType?: Array<MediaTypeValue> | MediaTypeValue;
};
export declare type PagedInfo<T> = {
    assets: Array<T>;
    endCursor: string;
    hasNextPage: boolean;
    totalCount: number;
};
export declare type AssetRef = Asset | string;
export declare type AlbumRef = Album | string;
export declare const MediaType: MediaTypeObject;
export declare const SortBy: SortByObject;
export declare function createAssetAsync(localUri: string): Promise<Asset>;
export declare function addAssetsToAlbumAsync(assets: Array<AssetRef> | AssetRef, album: AlbumRef, copy?: boolean): Promise<any>;
export declare function removeAssetsFromAlbumAsync(assets: Array<AssetRef> | AssetRef, album: AlbumRef): Promise<any>;
export declare function deleteAssetsAsync(assets: Array<AssetRef> | AssetRef): Promise<any>;
export declare function getAssetInfoAsync(asset: AssetRef): Promise<AssetInfo>;
export declare function getAlbumsAsync({ includeSmartAlbums }?: AlbumsOptions): Promise<Array<Album>>;
export declare function getAlbumAsync(title: string): Promise<Album>;
export declare function createAlbumAsync(albumName: string, asset?: AssetRef, copyAsset?: boolean): Promise<Album>;
export declare function deleteAlbumsAsync(albums: Array<AlbumRef> | AlbumRef, assetRemove?: boolean): Promise<any>;
export declare function getAssetsAsync(assetsOptions?: AssetsOptions): Promise<PagedInfo<Asset>>;
export declare function addListener(listener: () => void): Subscription;
export declare function removeSubscription(subscription: Subscription): void;
export declare function removeAllListeners(): void;
export declare function getMomentsAsync(): Promise<any>;
