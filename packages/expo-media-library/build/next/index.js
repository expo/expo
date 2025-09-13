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
    static getAll() {
        return ExpoMediaLibraryNext.getAllAlbums();
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