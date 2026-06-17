import {} from 'expo-modules-core';
import { NativeMediaLibraryModule } from '../native';
/**
 * Subscribes for updates in user's media library.
 * @param listener A callback that is fired when any assets have been inserted or deleted from the
 * library. On Android it's invoked with an empty object. On iOS it's invoked with
 * [`MediaLibraryAssetsChangeEvent`](#medialibraryassetschangeevent) object.
 * @return An [`EventSubscription`](#eventsubscription) object that you can call `remove()` on when
 * you would like to unsubscribe the listener.
 */
export function addListener(listener) {
    return NativeMediaLibraryModule.addListener('mediaLibraryDidChange', listener);
}
/**
 * Removes all listeners.
 */
export function removeAllListeners() {
    NativeMediaLibraryModule.removeAllListeners('mediaLibraryDidChange');
}
//# sourceMappingURL=Subscriptions.js.map