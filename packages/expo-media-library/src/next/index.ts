import { PermissionResponse, UnavailabilityError } from 'expo-modules-core';
import { Platform } from 'react-native';

import ExpoMediaLibraryNext from './ExpoMediaLibraryNext';
import { GranularPermission } from './types/GranularPermission';

export * from './MediaLibraryNext.types';

export class Query extends ExpoMediaLibraryNext.Query {}

export class Asset extends ExpoMediaLibraryNext.Asset {
  // @hidden
  static create(filePath: string, album?: Album): Promise<Asset> {
    return ExpoMediaLibraryNext.createAsset(filePath, album);
  }

  // @hidden
  static delete(assets: Asset[]): Promise<void> {
    return ExpoMediaLibraryNext.deleteAssets(assets);
  }
}

export class Album extends ExpoMediaLibraryNext.Album {
  // @hidden
  static create(
    name: string,
    assetsRefs: string[] | Asset[],
    moveAssets: boolean = true
  ): Promise<Album> {
    if (Platform.OS === 'ios') {
      return ExpoMediaLibraryNext.createAlbum(name, assetsRefs);
    }
    return ExpoMediaLibraryNext.createAlbum(name, assetsRefs, moveAssets);
  }

  // @hidden
  static delete(albums: Album[], deleteAssets: boolean = false): Promise<void> {
    if (Platform.OS === 'ios') {
      return ExpoMediaLibraryNext.deleteAlbums(albums, deleteAssets);
    } else {
      return ExpoMediaLibraryNext.deleteAlbums(albums);
    }
  }

  // @hidden
  static get(title: string): Promise<Album | null> {
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
export async function requestPermissionsAsync(
  writeOnly: boolean = false,
  granularPermissions?: GranularPermission[]
): Promise<PermissionResponse> {
  if (!ExpoMediaLibraryNext.requestPermissionsAsync) {
    throw new UnavailabilityError('MediaLibrary', 'requestPermissionsAsync');
  }
  if (Platform.OS === 'android') {
    return await ExpoMediaLibraryNext.requestPermissionsAsync(writeOnly, granularPermissions);
  }
  return await ExpoMediaLibraryNext.requestPermissionsAsync(writeOnly);
}
