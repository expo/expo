import { UnavailabilityError } from 'expo-modules-core';
import { Platform } from 'react-native';
import ExpoMediaLibraryNext from './ExpoMediaLibraryNext';
export * from './MediaLibraryNext.types';
export class Query extends ExpoMediaLibraryNext.Query {
}
export class Asset extends ExpoMediaLibraryNext.Asset {
    static create(filePath, album) {
        return ExpoMediaLibraryNext.createAsset(filePath, album);
    }
    static delete(assets) {
        return ExpoMediaLibraryNext.deleteAssets(assets);
    }
}
export class Album extends ExpoMediaLibraryNext.Album {
    static create(name, assetsRefs, moveAssets = true) {
        if (Platform.OS === 'ios') {
            return ExpoMediaLibraryNext.createAlbum(name, assetsRefs);
        }
        return ExpoMediaLibraryNext.createAlbum(name, assetsRefs, moveAssets);
    }
    static delete(albums, deleteAssets = false) {
        if (Platform.OS === 'ios') {
            return ExpoMediaLibraryNext.deleteAlbums(albums, deleteAssets);
        }
        else {
            return ExpoMediaLibraryNext.deleteAlbums(albums);
        }
    }
    /**
     * Retrieves an album with the given title.
     * If multiple albums share the same title only one will be returned.
     * @param title - The title of the album to retrieve.
     * @returns A promise resolving to the `Album` if found, or `null` if no album with the given title exists.
     * @example
     * ```ts
     * const album = await Album.get("Camera");
     * if (album) {
     *   console.log(`Found album with ID: ${album.id}`);
     * }
     * ```
     */
    static get(title) {
        return ExpoMediaLibraryNext.getAlbum(title);
    }
}
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