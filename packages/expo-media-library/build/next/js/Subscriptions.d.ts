import { type EventSubscription } from 'expo-modules-core';
import type { MediaLibraryAssetsChangeEvent } from '../types';
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
//# sourceMappingURL=Subscriptions.d.ts.map