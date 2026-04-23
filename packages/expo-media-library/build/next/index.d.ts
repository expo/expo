import type { PermissionHookOptions, PermissionResponse } from 'expo-modules-core';
import ExpoMediaLibraryNext from './ExpoMediaLibraryNext';
import type { GranularPermission } from './types/GranularPermission';
import type { MediaSubtype } from './types/MediaSubtype';
export * from './MediaLibraryNext.types';
export declare class Query extends ExpoMediaLibraryNext.Query {
}
export declare class Asset extends ExpoMediaLibraryNext.Asset {
    getFavorite(): Promise<boolean>;
    setFavorite(isFavorite: boolean): Promise<void>;
    getMediaSubtypes(): Promise<MediaSubtype[]>;
    getLivePhotoVideoUri(): Promise<string | null>;
    getIsInCloud(): Promise<boolean>;
    getOrientation(): Promise<number | null>;
}
export declare class Album extends ExpoMediaLibraryNext.Album {
}
/**
 * Asks the user to grant permissions for accessing media in user's media library.
 * @param writeOnly - Whether to request write-only access without read permissions. Defaults to `false`.
 * @param granularPermissions - A list of [`GranularPermission`](#granularpermission) values. This parameter has an
 * effect only on Android 13 and newer. By default, `expo-media-library` will ask for all possible permissions.
 *
 * > When using granular permissions with a custom config plugin configuration, make sure that all the requested permissions are included in the plugin.
 * @return A promise that fulfils with [`PermissionResponse`](#permissionresponse) object.
 */
export declare function requestPermissionsAsync(writeOnly?: boolean, granularPermissions?: GranularPermission[]): Promise<PermissionResponse>;
/**
 * Checks user's permissions for accessing media library.
 * @param writeOnly - Whether to check write-only access without read permissions. Defaults to `false`.
 * @param granularPermissions - A list of [`GranularPermission`](#granularpermission) values. This parameter has
 * an effect only on Android 13 and newer. By default, `expo-media-library` will ask for all possible permissions.
 * @return A promise that fulfils with [`PermissionResponse`](#permissionresponse) object.
 */
export declare function getPermissionsAsync(writeOnly?: boolean, granularPermissions?: GranularPermission[]): Promise<PermissionResponse>;
/**
 * Check or request permissions to access the media library.
 * This uses both `requestPermissionsAsync` and `getPermissionsAsync` to interact with the permissions.
 *
 * @example
 * ```ts
 * const [permissionResponse, requestPermission] = MediaLibrary.usePermissions({
 *   writeOnly: true,
 *   granularPermissions: ['photo'],
 * });
 * ```
 */
export declare const usePermissions: (options?: PermissionHookOptions<{
    writeOnly?: boolean;
    granularPermissions?: GranularPermission[];
}> | undefined) => [PermissionResponse | null, () => Promise<PermissionResponse>, () => Promise<PermissionResponse>];
export type { PermissionHookOptions };
//# sourceMappingURL=index.d.ts.map