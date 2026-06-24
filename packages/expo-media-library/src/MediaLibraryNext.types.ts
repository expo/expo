import type { PermissionResponse as EXPermissionResponse } from 'expo';

export * from './types/SortDescriptor';
export * from './types/AssetField';
export * from './types/MediaSubtype';
export * from './types/MediaType';
export * from './types/MediaTypeFilter';
export * from './types/GranularPermission';
export * from './types/AssetInfo';
export * from './types/AssetMetadata';
export * from './types/Location';
export * from './types/MediaLibraryAssetsChangeEvent';
export * from './types/Shape';

export {
  PermissionStatus,
  type PermissionExpiration,
  type PermissionHookOptions,
  type PermissionResponse as EXPermissionResponse,
} from 'expo';

export type PermissionResponse = EXPermissionResponse & {
  /**
   * Indicates if your app has access to the whole or only part of the photo library. Possible values are:
   * - `'all'` if the user granted your app access to the whole photo library
   * - `'limited'` if the user granted your app access only to selected photos (only available on Android API 14+ and iOS 14.0+)
   * - `'none'` if user denied or hasn't yet granted the permission
   */
  accessPrivileges?: 'all' | 'limited' | 'none';
};
