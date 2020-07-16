import { EventEmitter } from '@unimodules/core';
import ExpoLocation from './ExpoLocation';
export const LocationEventEmitter = new EventEmitter(ExpoLocation);
let nextWatchId = 0;
class Subscriber {
    constructor(eventName, eventDataField) {
        this.callbacks = {};
        this.eventSubscription = null;
        this.eventName = eventName;
        this.eventDataField = eventDataField;
    }
    maybeInitializeSubscription() {
        if (this.eventSubscription) {
            return;
        }
        this.eventSubscription = LocationEventEmitter.addListener(this.eventName, (event) => {
            const callback = this.callbacks[event.watchId];
            if (callback) {
                callback(event[this.eventDataField]);
            }
            else {
                ExpoLocation.removeWatchAsync(event.watchId);
            }
        });
    }
    /**
     * Registers given callback under new id which is then returned.
     */
    registerCallback(callback) {
        const id = ++nextWatchId;
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
}
export const LocationSubscriber = new Subscriber('Expo.locationChanged', 'location');
export const HeadingSubscriber = new Subscriber('Expo.headingChanged', 'heading');
/**
 * Necessary for some unit tests.
 */
export function _getCurrentWatchId() {
    return nextWatchId;
}
//# sourceMappingURL=LocationSubscriptions.js.map