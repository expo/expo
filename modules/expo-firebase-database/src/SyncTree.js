/**
 * @flow
 */
import { NativeModulesProxy, EventEmitter } from 'expo-core';
import { events, utils } from 'expo-firebase-app';

const { SharedEventEmitter } = events;
import DataSnapshot from './DataSnapshot';
import DatabaseReference from './Reference';
const { isString, nativeToJSError } = utils;

type Listener = DataSnapshot => any;

type Registration = {
  key: string,
  path: string,
  once?: boolean,
  appName: string,
  eventType: string,
  listener: Listener,
  eventRegistrationKey: string,
  ref: DatabaseReference,
};

/**
 * Internally used to manage firebase database realtime event
 * subscriptions and keep the listeners in sync in js vs native.
 */
class SyncTree {
  _nativeEmitter: EventEmitter;
  _reverseLookup: { [string]: Registration };
  _tree: { [string]: { [string]: { [string]: Listener } } };

  constructor() {
    this._tree = {};
    this._reverseLookup = {};
    if (NativeModulesProxy.ExpoFirebaseDatabase) {
      this._nativeEmitter = new EventEmitter(NativeModulesProxy.ExpoFirebaseDatabase);
      this._nativeEmitter.addListener('database_sync_event', this._handleSyncEvent.bind(this));
    }
  }

  /**
   *
   * @param event
   * @private
   */
  _handleSyncEvent(event) {
    if (event.error) {
      this._handleErrorEvent(event);
    } else {
      this._handleValueEvent(event);
    }
  }

  /**
   * Routes native database 'on' events to their js equivalent counterpart.
   * If there is no longer any listeners remaining for this event we internally
   * call the native unsub method to prevent further events coming through.
   *
   * @param event
   * @private
   */
  _handleValueEvent(event) {
    // console.log('SyncTree.VALUE >>>', event);
    const { key, eventRegistrationKey } = event.registration;
    const registration = this.getRegistration(eventRegistrationKey);

    if (!registration) {
      // registration previously revoked
      // notify native that the registration
      // no longer exists so it can remove
      // the native listeners
      return NativeModulesProxy.ExpoFirebaseDatabase.off(key, eventRegistrationKey);
    }

    const { snapshot, previousChildName } = event.data;

    // forward on to users .on(successCallback <-- listener
    return SharedEventEmitter.emit(
      eventRegistrationKey,
      new DataSnapshot(registration.ref, snapshot),
      previousChildName
    );
  }

  /**
   * Routes native database query listener cancellation events to their js counterparts.
   *
   * @param event
   * @private
   */
  _handleErrorEvent(event) {
    // console.log('SyncTree.ERROR >>>', event);
    const { code, message } = event.error;
    const { eventRegistrationKey, registrationCancellationKey } = event.registration;

    const registration = this.getRegistration(registrationCancellationKey);

    if (registration) {
      // build a new js error - we additionally attach
      // the ref as a property for easier debugging
      const error = nativeToJSError(code, message, { ref: registration.ref });

      // forward on to users .on(successCallback, cancellationCallback <-- listener
      SharedEventEmitter.emit(registrationCancellationKey, error);

      // remove the paired event registration - if we received a cancellation
      // event then it's guaranteed that they'll be no further value events
      this.removeRegistration(eventRegistrationKey);
    }
  }

  /**
   * Returns registration information such as appName, ref, path and registration keys.
   *
   * @param registration
   * @return {null}
   */
  getRegistration(registration: string): Registration | null {
    return this._reverseLookup[registration]
      ? Object.assign({}, this._reverseLookup[registration])
      : null;
  }

  /**
   * Removes all listeners for the specified registration keys.
   *
   * @param registrations
   * @return {number}
   */
  removeListenersForRegistrations(registrations: string | string[]): number {
    if (isString(registrations)) {
      this.removeRegistration(registrations);
      SharedEventEmitter.removeAllListeners(registrations);
      return 1;
    }

    if (!Array.isArray(registrations)) return 0;
    for (let i = 0, len = registrations.length; i < len; i++) {
      this.removeRegistration(registrations[i]);
      SharedEventEmitter.removeAllListeners(registrations[i]);
    }

    return registrations.length;
  }

  /**
   * Removes a specific listener from the specified registrations.
   *
   * @param listener
   * @param registrations
   * @return {Array} array of registrations removed
   */
  removeListenerRegistrations(listener: () => any, registrations: string[]) {
    if (!Array.isArray(registrations)) return [];
    const removed = [];

    for (let i = 0, len = registrations.length; i < len; i++) {
      const registration = registrations[i];
      const subscriptions = SharedEventEmitter._subscriber.getSubscriptionsForType(registration);
      if (subscriptions) {
        for (let j = 0, l = subscriptions.length; j < l; j++) {
          const subscription = subscriptions[j];
          // The subscription may have been removed during this event loop.
          // its listener matches the listener in method parameters
          if (subscription && subscription.listener === listener) {
            subscription.remove();
            removed.push(registration);
            this.removeRegistration(registration);
          }
        }
      }
    }

    return removed;
  }

  /**
   * Returns an array of all registration keys for the specified path.
   *
   * @param path
   * @return {Array}
   */
  getRegistrationsByPath(path: string): string[] {
    const out = [];
    const eventKeys = Object.keys(this._tree[path] || {});

    for (let i = 0, len = eventKeys.length; i < len; i++) {
      Array.prototype.push.apply(out, Object.keys(this._tree[path][eventKeys[i]]));
    }

    return out;
  }

  /**
   * Returns an array of all registration keys for the specified path and eventType.
   *
   * @param path
   * @param eventType
   * @return {Array}
   */
  getRegistrationsByPathEvent(path: string, eventType: string): string[] {
    if (!this._tree[path]) return [];
    if (!this._tree[path][eventType]) return [];

    return Object.keys(this._tree[path][eventType]);
  }

  /**
   * Returns a single registration key for the specified path, eventType, and listener
   *
   * @param path
   * @param eventType
   * @param listener
   * @return {Array}
   */
  getOneByPathEventListener(path: string, eventType: string, listener: Function): ?string {
    if (!this._tree[path]) return null;
    if (!this._tree[path][eventType]) return null;

    const registrationsForPathEvent = Object.entries(this._tree[path][eventType]);

    for (let i = 0; i < registrationsForPathEvent.length; i++) {
      const registration = registrationsForPathEvent[i];
      if (registration[1] === listener) return registration[0];
    }

    return null;
  }

  /**
   * Register a new listener.
   *
   * @param parameters
   * @param listener
   * @return {String}
   */
  addRegistration(registration: Registration): string {
    const { eventRegistrationKey, eventType, listener, once, path } = registration;

    if (!this._tree[path]) this._tree[path] = {};
    if (!this._tree[path][eventType]) this._tree[path][eventType] = {};

    this._tree[path][eventType][eventRegistrationKey] = listener;
    this._reverseLookup[eventRegistrationKey] = registration;

    if (once) {
      SharedEventEmitter.once(
        eventRegistrationKey,
        this._onOnceRemoveRegistration(eventRegistrationKey, listener)
      );
    } else {
      SharedEventEmitter.addListener(eventRegistrationKey, listener);
    }

    return eventRegistrationKey;
  }

  /**
   * Remove a registration, if it's not a `once` registration then instructs native
   * to also remove the underlying database query listener.
   *
   * @param registration
   * @return {boolean}
   */
  removeRegistration(registration: string): boolean {
    if (!this._reverseLookup[registration]) return false;
    const { path, eventType, once } = this._reverseLookup[registration];

    if (!this._tree[path]) {
      delete this._reverseLookup[registration];
      return false;
    }

    if (!this._tree[path][eventType]) {
      delete this._reverseLookup[registration];
      return false;
    }

    // we don't want `once` events to notify native as they're already
    // automatically unsubscribed on native when the first event is sent
    const registrationObj = this._reverseLookup[registration];
    if (registrationObj && !once) {
      NativeModulesProxy.ExpoFirebaseDatabase.off(registrationObj.key, registration);
    }

    delete this._tree[path][eventType][registration];
    delete this._reverseLookup[registration];

    return !!registrationObj;
  }

  /**
   * Wraps a `once` listener with a new function that self de-registers.
   *
   * @param registration
   * @param listener
   * @return {function(...[*])}
   * @private
   */
  _onOnceRemoveRegistration(registration, listener) {
    return (...args: any[]) => {
      this.removeRegistration(registration);
      listener(...args);
    };
  }
}

export default new SyncTree();
