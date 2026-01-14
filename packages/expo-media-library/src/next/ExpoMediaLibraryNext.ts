import { NativeModule, PermissionResponse, requireNativeModule } from 'expo-modules-core';

import { GranularPermission } from './MediaLibraryNext.types';
import { Album } from './types/Album';
import { Asset } from './types/Asset';
import { Query } from './types/Query';

declare class ExpoMediaLibraryNextModule extends NativeModule {
  Asset: typeof Asset;
  Album: typeof Album;
  Query: typeof Query;

  createAsset(filePath: string, album?: Album): Promise<Asset>;
  deleteAssets(assets: Asset[]): Promise<void>;

  createAlbum(name: string, assetsRefs: string[] | Asset[], moveAssets?: boolean): Promise<Album>;
  deleteAlbums(albums: Album[], deleteAssets?: boolean): Promise<void>;
  getAlbum(title: string): Promise<Album | null>;

  requestPermissionsAsync(
    writeOnly?: boolean,
    granularPermissions?: GranularPermission[]
  ): Promise<PermissionResponse>;
}

export default requireNativeModule<ExpoMediaLibraryNextModule>('ExpoMediaLibraryNext');
