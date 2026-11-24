import { UnavailabilityError } from 'expo';
import type { EventSubscription } from 'expo';
import { Platform } from 'react-native';

import { NativeMediaLibraryModule } from '../native';
import type {
  GranularPermission,
  MediaLibraryAssetsChangeEvent,
  MediaTypeFilter,
  PermissionResponse,
} from '../types';

/**
 * Asks the user to grant permissions for accessing media in user's media library.
 * @param writeOnly - Whether to request write-only access without read permissions. Defaults to `false`.
 * @param granularPermissions - A list of [`GranularPermission`](#granularpermission) values. This parameter has an
 * effect only on Android 13 and newer. By default, `expo-media-library` will ask for all possible permissions.
 *
 * > When using granular permissions with a custom config plugin configuration, make sure that all the requested permissions are included in the plugin.
 * @return A promise that fulfils with [`PermissionResponse`](#permissionresponse) object.
 */
export async function requestPermissions(
  writeOnly: boolean = false,
  granularPermissions?: GranularPermission[]
): Promise<PermissionResponse> {
  if (!NativeMediaLibraryModule.requestPermissionsAsync) {
    throw new UnavailabilityError('MediaLibrary', 'requestPermissions');
  }
  if (Platform.OS === 'android') {
    return await NativeMediaLibraryModule.requestPermissionsAsync(writeOnly, granularPermissions);
  }
  return await NativeMediaLibraryModule.requestPermissionsAsync(writeOnly);
}

/**
 * Checks user's permissions for accessing media library.
 * @param writeOnly - Whether to check write-only access without read permissions. Defaults to `false`.
 * @param granularPermissions - A list of [`GranularPermission`](#granularpermission) values. This parameter has
 * an effect only on Android 13 and newer. By default, `expo-media-library` will ask for all possible permissions.
 * @return A promise that fulfils with [`PermissionResponse`](#permissionresponse) object.
 */
export async function getPermissions(
  writeOnly: boolean = false,
  granularPermissions?: GranularPermission[]
): Promise<PermissionResponse> {
  if (!NativeMediaLibraryModule.getPermissionsAsync) {
    throw new UnavailabilityError('MediaLibrary', 'getPermissions');
  }
  if (Platform.OS === 'android') {
    return await NativeMediaLibraryModule.getPermissionsAsync(writeOnly, granularPermissions);
  }
  return await NativeMediaLibraryModule.getPermissionsAsync(writeOnly);
}

/**
 * Allows the user to update the assets that your app has access to.
 * The system modal is only displayed if the user originally allowed only `limited` access to their
 * media library, otherwise this method is a no-op.
 * @param mediaTypes Limits the type(s) of media that the user will be granting access to. By default, a list that shows both photos and videos is presented.
 *
 * @return A promise that either rejects if the method is unavailable, or resolves to `void`.
 * > __Note:__ This method doesn't inform you if the user changes which assets your app has access to.
 * That information is only exposed by iOS, and to obtain it, you need to subscribe for updates to the user's media library using [`addListener()`](#addlistenerlistener-1).
 * If `hasIncrementalChanges` is `false`, the user changed their permissions.
 *
 * @platform android 14+
 * @platform ios
 */
export async function presentPermissionsPicker(mediaTypes?: MediaTypeFilter[]): Promise<void> {
  return await NativeMediaLibraryModule.presentPermissionsPicker(mediaTypes);
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
  return NativeMediaLibraryModule.addListener('mediaLibraryDidChange', listener);
}

/**
 * Removes all listeners.
 */
export function removeAllListeners(): void {
  NativeMediaLibraryModule.removeAllListeners('mediaLibraryDidChange');
}
