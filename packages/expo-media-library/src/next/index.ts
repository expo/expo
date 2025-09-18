import { PermissionResponse, UnavailabilityError } from 'expo-modules-core';
import { Platform } from 'react-native';

import ExpoMediaLibraryNext from './ExpoMediaLibraryNext';
import { GranularPermission } from './types/GranularPermission';

export * from './MediaLibraryNext.types';

export class Query extends ExpoMediaLibraryNext.Query {}

export class Asset extends ExpoMediaLibraryNext.Asset {
  /*
   * A static function. Creates a new asset from a given file path.
   * Optionally associates the asset with an album. On Android, if not specified, the asset will be placed in the default "Pictures" directory.
   *
   * @param filePath - Local filesystem path (for example, `file:///...`) of the file to import.
   * @param album - Optional {@link Album} instance to place the asset in.
   * @returns A promise resolving to the created {@link Asset}.
   * @throws An exception if the asset could not be created, for example, if the file does not exist or permission is denied.
   *
   * @example
   * ```ts
   * const asset = await Asset.create("file:///storage/emulated/0/DCIM/Camera/IMG_20230915_123456.jpg");
   * console.log(await asset.getFilename()); // "IMG_20230915_123456.jpg"
   * ```
   */
  static create(filePath: string, album?: Album): Promise<Asset> {
    return ExpoMediaLibraryNext.createAsset(filePath, album);
  }

  /*
   * A static function. Deletes multiple assets at once.
   * @param assets - An array of {@link Asset} instances to delete.
   * @returns A promise that resolves once the assets have been deleted.
   *
   * @example
   * ```ts
   * const asset = await Asset.create("file:///storage/emulated/0/DCIM/Camera/IMG_20230915_123456.jpg");
   * await Asset.delete([asset]);
   * ```
   */
  static delete(assets: Asset[]): Promise<void> {
    return ExpoMediaLibraryNext.deleteAssets(assets);
  }
}

export class Album extends ExpoMediaLibraryNext.Album {
  /*
   * A static function. Creates a new album with a given name and assets.
   * On Android, if assets are provided and `moveAssets` is true, the assets will be moved into the new album. If false or not supported, the assets will be copied.
   *
   * @param name - Name of the new album.
   * @param assetsRefs - List of {@link Asset} objects or file paths (file:///...) to include.
   * @param moveAssets - On Android, whether to move assets into the album.
   * @returns A promise resolving to the created {@link Album}.
   *
   * @example
   * ```ts
   * const album = await Album.create("My Album", [asset]);
   * console.log(await album.getTitle()); // "My Album"
   * ```
   */
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
  /*
   * A static function. Deletes multiple albums at once.
   * @param albums - An array of {@link Album} instances to delete.
   * @param deleteAssets - Whether to delete the assets in the albums as well.
   * @returns A promise that resolves once the albums have been deleted.
   *
   * @example
   * ```ts
   * const album = await Album.create("My Album", [asset]);
   * await Album.delete([album]);
   * ```
   */
  static delete(albums: Album[], deleteAssets: boolean = false): Promise<void> {
    if (Platform.OS === 'ios') {
      return ExpoMediaLibraryNext.deleteAlbums(albums, deleteAssets);
    } else {
      return ExpoMediaLibraryNext.deleteAlbums(albums);
    }
  }
  /*
   * A static function. Retrieves an album by its title.
   * @param title - The title of the album to retrieve.
   * @return A promise resolving to the {@link Album} if found, or `null` if not found.
   *
   * @example
   * ```ts
   * const album = await Album.get("Camera");
   * if (album) {
   *   console.log(await album.getTitle()); // "Camera"
   * }
   * ```
   */
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
