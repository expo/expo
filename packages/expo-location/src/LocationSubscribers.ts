import { type EventSubscription } from 'expo-modules-core';

import ExpoLocation from './ExpoLocation';
import { LocationCallback, LocationErrorCallback, LocationHeadingCallback } from './Location.types';
import { LocationEventEmitter } from './LocationEventEmitter';

type EventObject = {
  watchId: number;
  [key: string]: any;
};

let nextWatchId = 0;

class Subscriber<
  CallbackType extends LocationCallback | LocationHeadingCallback | LocationErrorCallback,
> {
  private eventName: string;
  private eventDataField: string;
  private callbacks: { [id: string]: CallbackType } = {};
  private eventSubscription: EventSubscription | null = null;

  constructor(eventName: string, eventDataField: string) {
    this.eventName = eventName;
    this.eventDataField = eventDataField;
  }

  maybeInitializeSubscription() {
    if (this.eventSubscription) {
      return;
    }
    this.eventSubscription = LocationEventEmitter.addListener(
      this.eventName,
      (event: EventObject) => this.trigger(event)
    );
  }

  /**
   * Registers given callback under new id which is then returned.
   */
  registerCallback(callback: CallbackType): number {
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
  registerCallbackForId(watchId: number, callback: CallbackType): number {
    this.maybeInitializeSubscription();
    const id = watchId;
    this.callbacks[id] = callback;
    return id;
  }

  /**
   * Unregisters a callback with given id and revokes the subscription if possible.
   */
  unregisterCallback(id: number): void {
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

  trigger(event: EventObject): void {
    const watchId = event.watchId;
    const callback = this.callbacks[watchId];

    if (callback) {
      callback(event[this.eventDataField]);
    } else {
      ExpoLocation.removeWatchAsync(watchId);
    }
  }
}

export const LocationSubscriber = new Subscriber<LocationCallback>(
  'Expo.locationChanged',
  'location'
);
export const HeadingSubscriber = new Subscriber<LocationHeadingCallback>(
  'Expo.headingChanged',
  'heading'
);

export const LocationErrorSubscriber = new Subscriber<LocationErrorCallback>(
  'Expo.locationError',
  'reason'
);

/**
 * @private Necessary for some unit tests.
 */
export function _getCurrentWatchId(): number {
  return nextWatchId;
}
