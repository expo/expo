import {
  PermissionStatus,
  type PermissionResponse,
  type EventSubscription,
  UnavailabilityError,
} from 'expo';

import type {
  AssetField,
  AssetFieldValueMap,
  AssetMetadata,
  GranularPermission,
  MediaTypeFilter,
  MediaLibraryAssetsChangeEvent,
  SortDescriptor,
} from '../types';
import type { NativeAlbumClass } from './types/NativeAlbumClass.types';
import type { NativeAssetClass } from './types/NativeAssetClass.types';
import type { NativeMediaLibraryModuleClass } from './types/NativeMediaLibraryModuleClass.types';
import type { NativeQueryClass } from './types/NativeQueryClass.types';

const noPermissionResponse: PermissionResponse = {
  status: PermissionStatus.UNDETERMINED,
  canAskAgain: true,
  granted: false,
  expires: 'never',
};

function unavailable(methodName: string): never {
  throw new UnavailabilityError('MediaLibrary', methodName);
}

class NativeAssetWeb implements NativeAssetClass {
  id: string;

  constructor(id: string) {
    this.id = id;
  }

  getCreationTime() {
    return unavailable('Asset.getCreationTime');
  }
  getDuration() {
    return unavailable('Asset.getDuration');
  }
  getFilename() {
    return unavailable('Asset.getFilename');
  }
  getHeight() {
    return unavailable('Asset.getHeight');
  }
  getMediaType() {
    return unavailable('Asset.getMediaType');
  }
  getMediaSubtypes() {
    return unavailable('Asset.getMediaSubtypes');
  }
  getLivePhotoVideoUri() {
    return unavailable('Asset.getLivePhotoVideoUri');
  }
  getIsInCloud() {
    return unavailable('Asset.getIsInCloud');
  }
  getOrientation() {
    return unavailable('Asset.getOrientation');
  }
  getModificationTime() {
    return unavailable('Asset.getModificationTime');
  }
  getShape() {
    return unavailable('Asset.getShape');
  }
  getUri() {
    return unavailable('Asset.getUri');
  }
  getWidth() {
    return unavailable('Asset.getWidth');
  }
  getInfo() {
    return unavailable('Asset.getInfo');
  }
  getAlbums() {
    return unavailable('Asset.getAlbums');
  }
  getLocation() {
    return unavailable('Asset.getLocation');
  }
  getExif() {
    return unavailable('Asset.getExif');
  }
  delete() {
    return unavailable('Asset.delete');
  }
  getFavorite() {
    return unavailable('Asset.getFavorite');
  }
  setFavorite(_isFavorite: boolean) {
    return unavailable('Asset.setFavorite');
  }

  static create(_filePath: string, _album?: NativeAlbumClass): Promise<NativeAssetClass> {
    return unavailable('Asset.create');
  }

  static delete(_assets: NativeAssetClass[]): Promise<void> {
    return unavailable('Asset.delete');
  }
}

class NativeAlbumWeb implements NativeAlbumClass {
  id: string;

  constructor(id: string) {
    this.id = id;
  }

  getAssets() {
    return unavailable('Album.getAssets');
  }
  getTitle() {
    return unavailable('Album.getTitle');
  }
  delete() {
    return unavailable('Album.delete');
  }
  add(_assets: NativeAssetClass | NativeAssetClass[]) {
    return unavailable('Album.add');
  }
  removeAssets(_assets: NativeAssetClass[]) {
    return unavailable('Album.removeAssets');
  }

  static create(
    _name: string,
    _assetsRefs: string[] | NativeAssetClass[],
    _moveAssets?: boolean
  ): Promise<NativeAlbumClass> {
    return unavailable('Album.create');
  }

  static delete(_albums: NativeAlbumClass[], _deleteAssets?: boolean): Promise<void> {
    return unavailable('Album.delete');
  }

  static get(_title: string): Promise<NativeAlbumClass | null> {
    return unavailable('Album.get');
  }

  static getAll(): Promise<NativeAlbumClass[]> {
    return unavailable('Album.getAll');
  }
}

class NativeQueryWeb implements NativeQueryClass {
  eq<T extends AssetField>(_field: T, _value: AssetFieldValueMap[T]) {
    return this;
  }
  within<T extends AssetField>(_field: T, _value: AssetFieldValueMap[T][]) {
    return this;
  }
  gt(_field: AssetField, _value: number) {
    return this;
  }
  gte(_field: AssetField, _value: number) {
    return this;
  }
  lt(_field: AssetField, _value: number) {
    return this;
  }
  lte(_field: AssetField, _value: number) {
    return this;
  }
  limit(_limit: number) {
    return this;
  }
  offset(_offset: number) {
    return this;
  }
  orderBy(_sortDescriptors: SortDescriptor | AssetField) {
    return this;
  }
  album(_album: NativeAlbumClass) {
    return this;
  }
  exe(): Promise<NativeAssetClass[]> {
    return unavailable('Query.exe');
  }
  exeForMetadata(): Promise<AssetMetadata[]> {
    return unavailable('Query.exeForMetadata');
  }
}

export const NativeMediaLibraryModule = {
  Asset: NativeAssetWeb,
  Album: NativeAlbumWeb,
  Query: NativeQueryWeb,
  getPermissionsAsync(
    _writeOnly?: boolean,
    _granularPermissions?: GranularPermission[]
  ): Promise<PermissionResponse> {
    return Promise.resolve(noPermissionResponse);
  },
  requestPermissionsAsync(
    _writeOnly?: boolean,
    _granularPermissions?: GranularPermission[]
  ): Promise<PermissionResponse> {
    return Promise.resolve(noPermissionResponse);
  },
  presentPermissionsPicker(_mediaTypes?: MediaTypeFilter[]): Promise<void> {
    return unavailable('presentPermissionsPicker');
  },
  addListener(
    _eventName: 'mediaLibraryDidChange',
    _listener: (event: MediaLibraryAssetsChangeEvent) => void
  ): EventSubscription {
    return { remove() {} };
  },
  removeAllListeners(_eventName: 'mediaLibraryDidChange'): void {},
} as unknown as NativeMediaLibraryModuleClass;

export const NativeAsset = NativeMediaLibraryModule.Asset;
export const NativeAlbum = NativeMediaLibraryModule.Album;
export const NativeQuery = NativeMediaLibraryModule.Query;
