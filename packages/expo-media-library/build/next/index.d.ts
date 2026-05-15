import { type PermissionHookOptions, type PermissionResponse } from 'expo';
import { type EventSubscription } from 'expo-modules-core';
import ExpoMediaLibraryNext from './ExpoMediaLibraryNext';
import type { MediaLibraryAssetsChangeEvent } from './MediaLibraryNext.types';
import type { GranularPermission } from './types/GranularPermission';
import { MediaSubtype } from './types/MediaSubtype';
import type { MediaTypeFilter } from './types/MediaTypeFilter';
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
export declare function presentPermissionsPicker(mediaTypes?: MediaTypeFilter[]): Promise<void>;
/**
 * Subscribes for updates in user's media library.
 * @param listener A callback that is fired when any assets have been inserted or deleted from the
 * library. On Android it's invoked with an empty object. On iOS it's invoked with
 * [`MediaLibraryAssetsChangeEvent`](#medialibraryassetschangeevent) object.
 * @return An [`EventSubscription`](#eventsubscription) object that you can call `remove()` on when
 * you would like to unsubscribe the listener.
 */
export declare function addListener(listener: (event: MediaLibraryAssetsChangeEvent) => void): EventSubscription;
/**
 * Removes all listeners.
 */
export declare function removeAllListeners(): void;
//# sourceMappingURL=index.d.ts.map