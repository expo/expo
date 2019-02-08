import { EventEmitter, Subscription } from 'expo-core';
import { UnavailabilityError } from 'expo-errors';
import { Platform } from 'react-native';

import MediaLibrary from './ExponentMediaLibrary';

const eventEmitter = new EventEmitter(MediaLibrary);

export type MediaTypeValue = 'audio' | 'photo' | 'video' | 'unknown';
export type SortByKey =
  | 'default'
  | 'id'
  | 'mediaType'
  | 'width'
  | 'height'
  | 'creationTime'
  | 'modificationTime'
  | 'duration';
export type SortByValue = [SortByKey, boolean] | SortByKey;

export type MediaTypeObject = {
  audio: 'audio';
  photo: 'photo';
  video: 'video';
  unknown: 'unknown';
};

export type SortByObject = {
  default: 'default';
  id: 'id';
  mediaType: 'mediaType';
  width: 'width';
  height: 'height';
  creationTime: 'creationTime';
  modificationTime: 'modificationTime';
  duration: 'duration';
};

export type Asset = {
  id: string;
  filename: string;
  uri: string;
  mediaType: MediaTypeValue;
  mediaSubtypes?: Array<string>; // iOS only
  width: number;
  height: number;
  creationTime: number;
  modificationTime: number;
  duration: number;
  albumId?: string; // Android only
};

export type AssetInfo = Asset & {
  localUri?: string;
  location?: Location;
  exif?: Object;
  isFavorite?: boolean; //iOS only
};

export type Location = {
  latitude: number;
  longitude: number;
};

export type Album = {
  id: string;
  title: string;
  assetCount: number;
  type?: string; // iOS only

  // iOS moments only
  startTime: number;
  endTime: number;
  approximateLocation?: Location;
  locationNames?: Array<string>;
};

export type AlbumsOptions = {
  // iOS only
  includeSmartAlbums?: boolean;
};

export type AssetsOptions = {
  first?: number;
  after?: AssetRef;
  album?: AlbumRef;
  sortBy?: Array<SortByValue> | SortByValue;
  mediaType?: Array<MediaTypeValue> | MediaTypeValue;
};

export type PagedInfo<T> = {
  assets: Array<T>;
  endCursor: string;
  hasNextPage: boolean;
  totalCount: number;
};

export type AssetRef = Asset | string;
export type AlbumRef = Album | string;

function arrayize(item: any): Array<any> {
  if (Array.isArray(item)) {
    return item;
  }
  return item ? [item] : [];
}

function getId(ref: any): string | undefined {
  if (typeof ref === 'string') {
    return ref;
  }
  return ref ? ref.id : undefined;
}

function checkAssetIds(assetIds: any): void {
  if (assetIds.some(id => !id || typeof id !== 'string')) {
    throw new Error('Asset ID must be a string!');
  }
}

function checkAlbumIds(albumIds: any): void {
  if (albumIds.some(id => !id || typeof id !== 'string')) {
    throw new Error('Album ID must be a string!');
  }
}

function checkMediaType(mediaType: any): void {
  if (Object.values(MediaType).indexOf(mediaType) === -1) {
    throw new Error(`Invalid mediaType: ${mediaType}`);
  }
}

function checkSortBy(sortBy: any): void {
  if (Array.isArray(sortBy)) {
    checkSortByKey(sortBy[0]);

    if (typeof sortBy[1] !== 'boolean') {
      throw new Error('Invalid sortBy array argument. Second item must be a boolean!');
    }
  } else {
    checkSortByKey(sortBy);
  }
}

function checkSortByKey(sortBy: any): void {
  if (Object.values(SortBy).indexOf(sortBy) === -1) {
    throw new Error(`Invalid sortBy key: ${sortBy}`);
  }
}

// export constants
export const MediaType: MediaTypeObject = MediaLibrary.MediaType;
export const SortBy: SortByObject = MediaLibrary.SortBy;

export async function createAssetAsync(localUri: string): Promise<Asset> {
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

export async function addAssetsToAlbumAsync(
  assets: Array<AssetRef> | AssetRef,
  album: AlbumRef,
  copy: boolean = true
) {
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

export async function removeAssetsFromAlbumAsync(
  assets: Array<AssetRef> | AssetRef,
  album: AlbumRef
) {
  if (!MediaLibrary.removeAssetsFromAlbumAsync) {
    throw new UnavailabilityError('MediaLibrary', 'removeAssetsFromAlbumAsync');
  }

  const assetIds = arrayize(assets).map(getId);
  const albumId = getId(album);

  checkAssetIds(assetIds);
  return await MediaLibrary.removeAssetsFromAlbumAsync(assetIds, albumId);
}

export async function deleteAssetsAsync(assets: Array<AssetRef> | AssetRef) {
  if (!MediaLibrary.deleteAssetsAsync) {
    throw new UnavailabilityError('MediaLibrary', 'deleteAssetsAsync');
  }

  const assetIds = arrayize(assets).map(getId);

  checkAssetIds(assetIds);
  return await MediaLibrary.deleteAssetsAsync(assetIds);
}

export async function getAssetInfoAsync(asset: AssetRef): Promise<AssetInfo> {
  if (!MediaLibrary.getAssetInfoAsync) {
    throw new UnavailabilityError('MediaLibrary', 'getAssetInfoAsync');
  }

  const assetId = getId(asset);

  checkAssetIds([assetId]);

  const assetInfo = await MediaLibrary.getAssetInfoAsync(assetId);

  if (Array.isArray(assetInfo)) {
    // Android returns an array with asset info, we need to pick the first item
    return assetInfo[0];
  }
  return assetInfo;
}

export async function getAlbumsAsync({ includeSmartAlbums = false }: AlbumsOptions = {}): Promise<
  Array<Album>
> {
  if (!MediaLibrary.getAlbumsAsync) {
    throw new UnavailabilityError('MediaLibrary', 'getAlbumsAsync');
  }
  return await MediaLibrary.getAlbumsAsync({ includeSmartAlbums });
}

export async function getAlbumAsync(title: string): Promise<Album> {
  if (!MediaLibrary.getAlbumAsync) {
    throw new UnavailabilityError('MediaLibrary', 'getAlbumAsync');
  }
  if (typeof title !== 'string') {
    throw new Error('Album title must be a string!');
  }
  return await MediaLibrary.getAlbumAsync(title);
}

export async function createAlbumAsync(
  albumName: string,
  asset?: AssetRef,
  copyAsset: boolean = true
): Promise<Album> {
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

export async function deleteAlbumsAsync(
  albums: Array<AlbumRef> | AlbumRef,
  assetRemove: boolean = false
) {
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

export async function getAssetsAsync(assetsOptions: AssetsOptions = {}): Promise<PagedInfo<Asset>> {
  if (!MediaLibrary.getAssetsAsync) {
    throw new UnavailabilityError('MediaLibrary', 'getAssetsAsync');
  }

  const { first, after, album, sortBy, mediaType } = assetsOptions;

  const options = {
    first: first == null ? 20 : first,
    after: getId(after),
    album: getId(album),
    sortBy: arrayize(sortBy),
    mediaType: arrayize(mediaType || [MediaType.photo]),
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

  options.sortBy.forEach(checkSortBy);
  options.mediaType.forEach(checkMediaType);

  return await MediaLibrary.getAssetsAsync(options);
}

export function addListener(listener: () => void): Subscription {
  const subscription = eventEmitter.addListener(MediaLibrary.CHANGE_LISTENER_NAME, listener);
  return subscription;
}

export function removeSubscription(subscription: Subscription): void {
  subscription.remove();
}

export function removeAllListeners(): void {
  eventEmitter.removeAllListeners(MediaLibrary.CHANGE_LISTENER_NAME);
}

// iOS only
export async function getMomentsAsync() {
  if (!MediaLibrary.getMomentsAsync) {
    throw new UnavailabilityError('MediaLibrary', 'getMomentsAsync');
  }

  return await MediaLibrary.getMomentsAsync();
}
