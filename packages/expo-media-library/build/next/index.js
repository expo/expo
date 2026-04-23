import { createPermissionHook, UnavailabilityError } from 'expo-modules-core';
import { Platform } from 'react-native';
import ExpoMediaLibraryNext from './ExpoMediaLibraryNext';
export * from './MediaLibraryNext.types';
export class Query extends ExpoMediaLibraryNext.Query {
}
export class Asset extends ExpoMediaLibraryNext.Asset {
    // @hidden
    getFavorite() {
        if (Platform.OS !== 'ios') {
            throw new UnavailabilityError('MediaLibrary', 'getFavorite is only available on iOS');
        }
        return super.getFavorite();
    }
    // @hidden
    setFavorite(isFavorite) {
        if (Platform.OS !== 'ios') {
            throw new UnavailabilityError('MediaLibrary', 'setFavorite is only available on iOS');
        }
        return super.setFavorite(isFavorite);
    }
    // @hidden
    getMediaSubtypes() {
        if (Platform.OS !== 'ios') {
            throw new UnavailabilityError('MediaLibrary', 'getMediaSubtypes is only available on iOS');
        }
        return super.getMediaSubtypes();
    }
    // @hidden
    getLivePhotoVideoUri() {
        if (Platform.OS !== 'ios') {
            throw new UnavailabilityError('MediaLibrary', 'getLivePhotoVideoUri is only available on iOS');
        }
        return super.getLivePhotoVideoUri();
    }
    // @hidden
    getIsInCloud() {
        if (Platform.OS !== 'ios') {
            throw new UnavailabilityError('MediaLibrary', 'getIsInCloud is only available on iOS');
        }
        return super.getIsInCloud();
    }
    // @hidden
    getOrientation() {
        if (Platform.OS !== 'ios') {
            throw new UnavailabilityError('MediaLibrary', 'getOrientation is only available on iOS');
        }
        return super.getOrientation();
    }
}
export class Album extends ExpoMediaLibraryNext.Album {
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
export async function requestPermissionsAsync(writeOnly = false, granularPermissions) {
    if (!ExpoMediaLibraryNext.requestPermissionsAsync) {
        throw new UnavailabilityError('MediaLibrary', 'requestPermissionsAsync');
    }
    if (Platform.OS === 'android') {
        return await ExpoMediaLibraryNext.requestPermissionsAsync(writeOnly, granularPermissions);
    }
    return await ExpoMediaLibraryNext.requestPermissionsAsync(writeOnly);
}
/**
 * Checks user's permissions for accessing media library.
 * @param writeOnly - Whether to check write-only access without read permissions. Defaults to `false`.
 * @param granularPermissions - A list of [`GranularPermission`](#granularpermission) values. This parameter has
 * an effect only on Android 13 and newer. By default, `expo-media-library` will ask for all possible permissions.
 * @return A promise that fulfils with [`PermissionResponse`](#permissionresponse) object.
 */
export async function getPermissionsAsync(writeOnly = false, granularPermissions) {
    if (!ExpoMediaLibraryNext.getPermissionsAsync) {
        throw new UnavailabilityError('MediaLibrary', 'getPermissionsAsync');
    }
    if (Platform.OS === 'android') {
        return await ExpoMediaLibraryNext.getPermissionsAsync(writeOnly, granularPermissions);
    }
    return await ExpoMediaLibraryNext.getPermissionsAsync(writeOnly);
}
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
export const usePermissions = createPermissionHook({
    getMethod: (options) => getPermissionsAsync(options?.writeOnly, options?.granularPermissions),
    requestMethod: (options) => requestPermissionsAsync(options?.writeOnly, options?.granularPermissions),
});
//# sourceMappingURL=index.js.map