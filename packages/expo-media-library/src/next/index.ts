import { createPermissionHook, type PermissionHookOptions, type PermissionResponse } from 'expo';
import { UnavailabilityError, type EventSubscription } from 'expo-modules-core';
import { Platform } from 'react-native';

import ExpoMediaLibraryNext from './ExpoMediaLibraryNext';
import type { MediaLibraryAssetsChangeEvent } from './MediaLibraryNext.types';
import type { GranularPermission } from './types/GranularPermission';
import { MediaSubtype } from './types/MediaSubtype';
import type { MediaTypeFilter } from './types/MediaTypeFilter';

export * from './MediaLibraryNext.types';

export class Query extends ExpoMediaLibraryNext.Query {}

export class Asset extends ExpoMediaLibraryNext.Asset {
  // @hidden
  getFavorite(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      throw new UnavailabilityError('MediaLibrary', 'getFavorite is only available on iOS');
    }
    return super.getFavorite();
  }

  // @hidden
  setFavorite(isFavorite: boolean): Promise<void> {
    if (Platform.OS !== 'ios') {
      throw new UnavailabilityError('MediaLibrary', 'setFavorite is only available on iOS');
    }
    return super.setFavorite(isFavorite);
  }

  // @hidden
  getMediaSubtypes(): Promise<MediaSubtype[]> {
    if (Platform.OS !== 'ios') {
      throw new UnavailabilityError('MediaLibrary', 'getMediaSubtypes is only available on iOS');
    }
    return super.getMediaSubtypes();
  }

  // @hidden
  getLivePhotoVideoUri(): Promise<string | null> {
    if (Platform.OS !== 'ios') {
      throw new UnavailabilityError(
        'MediaLibrary',
        'getLivePhotoVideoUri is only available on iOS'
      );
    }
    return super.getLivePhotoVideoUri();
  }

  // @hidden
  getIsInCloud(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      throw new UnavailabilityError('MediaLibrary', 'getIsInCloud is only available on iOS');
    }
    return super.getIsInCloud();
  }

  // @hidden
  getOrientation(): Promise<number | null> {
    if (Platform.OS !== 'ios') {
      throw new UnavailabilityError('MediaLibrary', 'getOrientation is only available on iOS');
    }
    return super.getOrientation();
  }
}

export class Album extends ExpoMediaLibraryNext.Album {}

/**
 * Asks the user to grant permissions for accessing media in user's media library.
 * @param writeOnly - Whether to request write-only access without read permissions. Defaults to `false`.
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

/**
 * Checks user's permissions for accessing media library.
 * @param writeOnly - Whether to check write-only access without read permissions. Defaults to `false`.
 * @param granularPermissions - A list of [`GranularPermission`](#granularpermission) values. This parameter has
 * an effect only on Android 13 and newer. By default, `expo-media-library` will ask for all possible permissions.
 * @return A promise that fulfils with [`PermissionResponse`](#permissionresponse) object.
 */
export async function getPermissionsAsync(
  writeOnly: boolean = false,
  granularPermissions?: GranularPermission[]
): Promise<PermissionResponse> {
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
export const usePermissions = createPermissionHook<
  PermissionResponse,
  { writeOnly?: boolean; granularPermissions?: GranularPermission[] }
>({
  getMethod: (options) => getPermissionsAsync(options?.writeOnly, options?.granularPermissions),
  requestMethod: (options) =>
    requestPermissionsAsync(options?.writeOnly, options?.granularPermissions),
});

export type { PermissionHookOptions };

/**
 * Allows the user to update the assets that your app has access to.
 * The system modal is only displayed if the user originally allowed only `limited` access to their
 * media library, otherwise this method is a no-op.
 * @param mediaTypes Limits the type(s) of media that the user will be granting access to. By default, a list that shows both photos and videos is presented.
 *
 * @return A promise that either rejects if the method is unavailable, or resolves to `void`.
 * > __Note:__ This method doesn't inform you if the user changes which assets your app has access to.
 * That information is only exposed by iOS, and to obtain it, you need to subscribe for updates to the user's media library using [`addListener()`](#medialibraryaddlistenerlistener).
 * If `hasIncrementalChanges` is `false`, the user changed their permissions.
 *
 * @platform android 14+
 * @platform ios
 */
export async function presentPermissionsPicker(mediaTypes?: MediaTypeFilter[]): Promise<void> {
  return await ExpoMediaLibraryNext.presentPermissionsPicker(mediaTypes);
}

/**
 * Subscribes for updates in user's media library.
 * @param listener A callback that is fired when any assets have been inserted or deleted from the
 * library. On Android it's invoked with an empty object. On iOS it's invoked with
 * [`MediaLibraryAssetsChangeEvent`](#medialibraryassetschangeevent) object.
 * @return An [`EventSubscription`](#eventsubscription) object that you can call `remove()` on when
 * you would like to unsubscribe the listener.
 */
export function addListener(
  listener: (event: MediaLibraryAssetsChangeEvent) => void
): EventSubscription {
  return ExpoMediaLibraryNext.addListener('mediaLibraryDidChange', listener);
}

/**
 * Removes all listeners.
 */
export function removeAllListeners(): void {
  ExpoMediaLibraryNext.removeAllListeners('mediaLibraryDidChange');
}
