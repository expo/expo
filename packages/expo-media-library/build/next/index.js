import { UnavailabilityError } from 'expo-modules-core';
import { Platform } from 'react-native';
import ExpoMediaLibraryNext from './ExpoMediaLibraryNext';
export * from './MediaLibraryNext.types';
export class Query extends ExpoMediaLibraryNext.Query {
}
export class Asset extends ExpoMediaLibraryNext.Asset {
    // @hidden
    static create(filePath, album) {
        return ExpoMediaLibraryNext.createAsset(filePath, album);
    }
    // @hidden
    static delete(assets) {
        return ExpoMediaLibraryNext.deleteAssets(assets);
    }
}
export class Album extends ExpoMediaLibraryNext.Album {
    // @hidden
    static create(name, assetsRefs, moveAssets = true) {
        if (Platform.OS === 'ios') {
            return ExpoMediaLibraryNext.createAlbum(name, assetsRefs);
        }
        return ExpoMediaLibraryNext.createAlbum(name, assetsRefs, moveAssets);
    }
    // @hidden
    static delete(albums, deleteAssets = false) {
        if (Platform.OS === 'ios') {
            return ExpoMediaLibraryNext.deleteAlbums(albums, deleteAssets);
        }
        else {
            return ExpoMediaLibraryNext.deleteAlbums(albums);
        }
    }
    // @hidden
    static get(title) {
        return ExpoMediaLibraryNext.getAlbum(title);
    }
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
export async function requestPermissionsAsync(writeOnly = false, granularPermissions) {
    if (!ExpoMediaLibraryNext.requestPermissionsAsync) {
        throw new UnavailabilityError('MediaLibrary', 'requestPermissionsAsync');
    }
    if (Platform.OS === 'android') {
        return await ExpoMediaLibraryNext.requestPermissionsAsync(writeOnly, granularPermissions);
    }
    return await ExpoMediaLibraryNext.requestPermissionsAsync(writeOnly);
}
//# sourceMappingURL=index.js.map