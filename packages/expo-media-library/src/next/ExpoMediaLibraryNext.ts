import { NativeModule, PermissionResponse, requireNativeModule } from 'expo-modules-core';

import { GranularPermission } from './MediaLibraryNext.types';
import { Album } from './types/Album';
import { Asset } from './types/Asset';
import { Query } from './types/Query';

declare class ExpoMediaLibraryNextModule extends NativeModule {
  Asset: typeof Asset;
  Album: typeof Album;
  Query: typeof Query;

  getPermissionsAsync(
    writeOnly?: boolean,
    granularPermissions?: GranularPermission[]
  ): Promise<PermissionResponse>;
  requestPermissionsAsync(
    writeOnly?: boolean,
    granularPermissions?: GranularPermission[]
  ): Promise<PermissionResponse>;
}

export default requireNativeModule<ExpoMediaLibraryNextModule>('ExpoMediaLibraryNext');
