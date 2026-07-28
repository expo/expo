import { type EventSubscription } from 'expo';

import { NativeMediaLibraryModule } from '../native';
import type { MediaLibraryAssetsChangeEvent } from '../types';

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
