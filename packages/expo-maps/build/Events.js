import { LegacyEventEmitter } from 'expo-modules-core';
import { Platform } from 'react-native';
import { NativeExpoAppleMapsModule, NativeExpoGoogleMapsModule } from './ExpoMaps';
let nativeModule;
if (Platform.OS === 'ios') {
    nativeModule = NativeExpoAppleMapsModule;
}
else {
    nativeModule = NativeExpoGoogleMapsModule;
}
const emitter = new LegacyEventEmitter(nativeModule);
const MapsEventsNames = {
    ON_MARKER_CLICK_EVENT: 'onMarkerClick',
    ON_MARKER_DRAG_STARTED_EVENT: 'onMarkerDragStarted',
    ON_MARKER_DRAG_ENDED_EVENT: 'onMarkerDragEnded',
};
/**
 * Adds a new listener to be called when a marker or cluster is clicked.
 * @returns Subscription which can be used later to remove this particular listener.
 */
export function addOnMarkerClickListener(listener) {
    return emitter.addListener(MapsEventsNames.ON_MARKER_CLICK_EVENT, listener);
}
/**
 * Removes all listeners registered to listen for MarkerClick event.
 */
export function removeAllOnMarkerClickListeners() {
    emitter.removeAllListeners(MapsEventsNames.ON_MARKER_CLICK_EVENT);
}
/**
 * Adds a new listener to be called when a user starts dragging a marker.
 * Does not work for markers which are children of Cluster.
 * @returns Subscription which can be used later to remove this particular listener.
 */
export function addOnMarkerDragStartedListener(listener) {
    return emitter.addListener(MapsEventsNames.ON_MARKER_DRAG_STARTED_EVENT, listener);
}
/**
 * Removes all listeners registered to listen for MarkerDragStarted event.
 */
export function removeAllOnMarkerDragStartedListeners() {
    emitter.removeAllListeners(MapsEventsNames.ON_MARKER_DRAG_STARTED_EVENT);
}
/**
 * Adds a new listener to be called when a user drops a marker.
 * Does not work for markers which are children of Cluster.
 * @returns Subscription which can be used later to remove this particular listener.
 */
export function addOnMarkerDragEndedListener(listener) {
    return emitter.addListener(MapsEventsNames.ON_MARKER_DRAG_ENDED_EVENT, listener);
}
/**
 * Removes all listeners registered to listen for MarkerDragEnded event.
 */
export function removeAllOnMarkerDragEndedListeners() {
    emitter.removeAllListeners(MapsEventsNames.ON_MARKER_DRAG_ENDED_EVENT);
}
/**
 * Removes particular listener, which was earlier registered.
 */
export function removeEventListener(subscription) {
    emitter.removeSubscription(subscription);
}
/**
 * Removes all registered listeners.
 */
export function removeAllListeners() {
    for (const event in MapsEventsNames) {
        emitter.removeAllListeners(MapsEventsNames[event]);
    }
}
//# sourceMappingURL=Events.js.map