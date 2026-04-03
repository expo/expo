import { PermissionResponse } from 'expo-modules-core';
import ExpoMediaLibraryNext from './ExpoMediaLibraryNext';
import { GranularPermission } from './types/GranularPermission';
export * from './MediaLibraryNext.types';
export declare class Query extends ExpoMediaLibraryNext.Query {
}
export declare class Asset extends ExpoMediaLibraryNext.Asset {
    getFavorite(): Promise<boolean>;
    setFavorite(isFavorite: boolean): Promise<void>;
}
export declare class Album extends ExpoMediaLibraryNext.Album {
}
/**
 * Asks the user to grant permissions for accessing media in user's media library.
 * @param writeOnly
 * @param granularPermissions - A list of [`GranularPermission`](#granularpermission) values. This parameter has an
 * effect only on Android 13 and newer. By default, `expo-media-library` will ask for all possible permissions.
 *
 * > When using granular permissions with a custom config plugin configuration, make sure that all the requested permissions are included in the plugin.
 * @return A promise that fulfils with [`PermissionResponse`](#permissionresponse) object.
 */
export declare function requestPermissionsAsync(writeOnly?: boolean, granularPermissions?: GranularPermission[]): Promise<PermissionResponse>;
/**
 * Checks user's permissions for accessing media library.
 * @param writeOnly
 * @param granularPermissions - A list of [`GranularPermission`](#granularpermission) values. This parameter has
 * an effect only on Android 13 and newer. By default, `expo-media-library` will ask for all possible permissions.
 * @return A promise that fulfils with [`PermissionResponse`](#permissionresponse) object.
 */
export declare function getPermissionsAsync(writeOnly?: boolean, granularPermissions?: GranularPermission[]): Promise<PermissionResponse>;
//# sourceMappingURL=index.d.ts.map