import ExpoLocation from './ExpoLocation';
import { LocationEventEmitter } from './LocationEventEmitter';
let nextWatchId = 0;
class Subscriber {
    eventName;
    eventDataField;
    callbacks = {};
    eventSubscription = null;
    constructor(eventName, eventDataField) {
        this.eventName = eventName;
        this.eventDataField = eventDataField;
    }
    maybeInitializeSubscription() {
        if (this.eventSubscription) {
            return;
        }
        this.eventSubscription = LocationEventEmitter.addListener(this.eventName, (event) => this.trigger(event));
    }
    /**
     * Registers given callback under new id which is then returned.
     */
    registerCallback(callback) {
        this.maybeInitializeSubscription();
        const id = ++nextWatchId;
        this.callbacks[id] = callback;
        return id;
    }
    /**
     * Registers given callback under and existing id. This can be used to
     * create a subscriber for the error event on the same id as the location
     * event is subscribed to.
     */
    registerCallbackForId(watchId, callback) {
        this.maybeInitializeSubscription();
        const id = watchId;
        this.callbacks[id] = callback;
        return id;
    }
    /**
     * Unregisters a callback with given id and revokes the subscription if possible.
     */
    unregisterCallback(id) {
        // Do nothing if we have already unregistered the callback.
        if (!this.callbacks[id]) {
            return;
        }
        delete this.callbacks[id];
        ExpoLocation.removeWatchAsync(id);
        if (Object.keys(this.callbacks).length === 0 && this.eventSubscription) {
            LocationEventEmitter.removeSubscription(this.eventSubscription);
            this.eventSubscription = null;
        }
    }
    trigger(event) {
        const watchId = event.watchId;
        const callback = this.callbacks[watchId];
        if (callback) {
            callback(event[this.eventDataField]);
        }
        else {
            ExpoLocation.removeWatchAsync(watchId);
        }
    }
}
export const LocationSubscriber = new Subscriber('Expo.locationChanged', 'location');
export const HeadingSubscriber = new Subscriber('Expo.headingChanged', 'heading');
export const LocationErrorSubscriber = new Subscriber('Expo.locationError', 'reason');
/**
 * @private Necessary for some unit tests.
 */
export function _getCurrentWatchId() {
    return nextWatchId;
}
//# sourceMappingURL=LocationSubscribers.js.map