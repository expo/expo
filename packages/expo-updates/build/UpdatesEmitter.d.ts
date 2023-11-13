import { EventSubscription } from 'fbemitter';
import type { UpdateEvent, UpdatesNativeStateChangeEvent } from './Updates.types';
/**
 * @deprecated Adds a callback to be invoked when updates-related events occur (such as upon the initial app
 * load) due to auto-update settings chosen at build-time. See also the
 * [`useUpdateEvents`](#useupdateeventslistener) React hook.
 * This API is deprecated and will be removed in a future release corresponding with SDK 51.
 * Use [`useUpdates()`](#useupdates) instead.
 *
 * @param listener A function that will be invoked with an [`UpdateEvent`](#updateevent) instance
 * and should not return any value.
 * @return An `EventSubscription` object on which you can call `remove()` to unsubscribe the
 * listener.
 */
export declare function addListener(listener: (event: UpdateEvent) => void): EventSubscription;
/**
 * @hidden
 */
export declare const addUpdatesStateChangeListener: (listener: (event: UpdatesNativeStateChangeEvent) => void) => EventSubscription;
/**
 * @hidden
 */
export declare const emitStateChangeEvent: (event: UpdatesNativeStateChangeEvent) => void;
//# sourceMappingURL=UpdatesEmitter.d.ts.map