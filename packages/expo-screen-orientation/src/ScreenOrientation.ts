import { EventEmitter, Platform, Subscription, UnavailabilityError } from 'expo-modules-core';

import ExpoScreenOrientation from './ExpoScreenOrientation';
import {
  Orientation,
  OrientationChangeEvent,
  OrientationChangeListener,
  OrientationLock,
  PlatformOrientationInfo,
  WebOrientationLock,
  WebOrientation,
  SizeClassIOS,
  ScreenOrientationInfo,
} from './ScreenOrientation.types';

export {
  Orientation,
  OrientationLock,
  PlatformOrientationInfo,
  OrientationChangeListener,
  OrientationChangeEvent,
  WebOrientationLock,
  WebOrientation,
  SizeClassIOS,
  ScreenOrientationInfo,
  Subscription,
};

const _orientationChangeEmitter = new EventEmitter(ExpoScreenOrientation);
let _orientationChangeSubscribers: Subscription[] = [];

let _lastOrientationLock: OrientationLock = OrientationLock.UNKNOWN;

// @needsAudit
/**
 * Lock the screen orientation to a particular `OrientationLock`.
 * @param orientationLock The orientation lock to apply. See the [`OrientationLock`](#orientationlock)
 * enum for possible values.
 * @return Returns a promise with `void` value, which fulfils when the orientation is set.
 *
 * # Error codes
 * - `ERR_SCREEN_ORIENTATION_INVALID_ORIENTATION_LOCK` - An invalid [`OrientationLock`](#orientationlock)
 *   was passed in.
 * - `ERR_SCREEN_ORIENTATION_UNSUPPORTED_ORIENTATION_LOCK` - The platform does not support the
 *   orientation lock policy.
 * - `ERR_SCREEN_ORIENTATION_MISSING_ACTIVITY` - __Android Only.__ Could not get the current activity.
 *
 * @example
 * ```ts
 * async function changeScreenOrientation() {
 *   await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_LEFT);
 * }
 * ```
 */
export async function lockAsync(orientationLock: OrientationLock): Promise<void> {
  if (!ExpoScreenOrientation.lockAsync) {
    throw new UnavailabilityError('ScreenOrientation', 'lockAsync');
  }

  const orientationLocks = Object.values(OrientationLock);
  if (!orientationLocks.includes(orientationLock)) {
    throw new TypeError(`Invalid Orientation Lock: ${orientationLock}`);
  }

  if (orientationLock === OrientationLock.OTHER) {
    return;
  }

  await ExpoScreenOrientation.lockAsync(orientationLock);
  _lastOrientationLock = orientationLock;
}

// @needsAudit @docsMissing
/**
 * @param options The platform specific lock to apply. See the [`PlatformOrientationInfo`](#platformorientationinfo)
 * object type for the different platform formats.
 * @return Returns a promise with `void` value, resolving when the orientation is set and rejecting
 * if an invalid option or value is passed.
 *
 * # Error codes
 * - `ERR_SCREEN_ORIENTATION_INVALID_ORIENTATION_LOCK` - __iOS Only.__ An invalid [`OrientationLock`](#orientationlock)
 *   was passed in.
 * - `ERR_SCREEN_ORIENTATION_UNSUPPORTED_ORIENTATION_LOCK` - The platform does not support the
 *   orientation lock policy.
 * - `ERR_SCREEN_ORIENTATION_MISSING_ACTIVITY` - __Android Only.__ Could not get the current activity.
 *
 */
export async function lockPlatformAsync(options: PlatformOrientationInfo): Promise<void> {
  if (!ExpoScreenOrientation.lockPlatformAsync) {
    throw new UnavailabilityError('ScreenOrientation', 'lockPlatformAsync');
  }

  const { screenOrientationConstantAndroid, screenOrientationArrayIOS, screenOrientationLockWeb } =
    options;
  let platformOrientationParam: any;
  if (Platform.OS === 'android' && screenOrientationConstantAndroid) {
    if (isNaN(screenOrientationConstantAndroid)) {
      throw new TypeError(
        `lockPlatformAsync Android platform: screenOrientationConstantAndroid cannot be called with ${screenOrientationConstantAndroid}`
      );
    }
    platformOrientationParam = screenOrientationConstantAndroid;
  } else if (Platform.OS === 'ios' && screenOrientationArrayIOS) {
    if (!Array.isArray(screenOrientationArrayIOS)) {
      throw new TypeError(
        `lockPlatformAsync iOS platform: screenOrientationArrayIOS cannot be called with ${screenOrientationArrayIOS}`
      );
    }

    const orientations = Object.values(Orientation);
    for (const orientation of screenOrientationArrayIOS) {
      if (!orientations.includes(orientation)) {
        throw new TypeError(
          `lockPlatformAsync iOS platform: ${orientation} is not a valid Orientation`
        );
      }
    }
    platformOrientationParam = screenOrientationArrayIOS;
  } else if (Platform.OS === 'web' && screenOrientationLockWeb) {
    const webOrientationLocks = Object.values(WebOrientationLock);
    if (!webOrientationLocks.includes(screenOrientationLockWeb)) {
      throw new TypeError(`Invalid Web Orientation Lock: ${screenOrientationLockWeb}`);
    }
    platformOrientationParam = screenOrientationLockWeb;
  }

  if (!platformOrientationParam) {
    throw new TypeError('lockPlatformAsync cannot be called with undefined option properties');
  }
  await ExpoScreenOrientation.lockPlatformAsync(platformOrientationParam);
  _lastOrientationLock = OrientationLock.OTHER;
}

// @needsAudit
/**
 * Sets the screen orientation back to the `OrientationLock.DEFAULT` policy.
 * @return Returns a promise with `void` value, which fulfils when the orientation is set.
 *
 * # Error codes
 * - `ERR_SCREEN_ORIENTATION_MISSING_ACTIVITY` - __Android Only.__ Could not get the current activity.
 */
export async function unlockAsync(): Promise<void> {
  if (!ExpoScreenOrientation.lockAsync) {
    throw new UnavailabilityError('ScreenOrientation', 'lockAsync');
  }
  await ExpoScreenOrientation.lockAsync(OrientationLock.DEFAULT);
}

// @needsAudit
/**
 * Gets the current screen orientation.
 * @return Returns a promise that fulfils with an [`Orientation`](#screenorientationorientation)
 * value that reflects the current screen orientation.
 *
 * # Error codes
 * - `ERR_SCREEN_ORIENTATION_GET_ORIENTATION_LOCK` - __Android Only.__ An unknown error occurred
 *   when trying to get the system lock.
 * - `ERR_SCREEN_ORIENTATION_MISSING_ACTIVITY` - __Android Only.__ Could not get the current activity.
 */
export async function getOrientationAsync(): Promise<Orientation> {
  if (!ExpoScreenOrientation.getOrientationAsync) {
    throw new UnavailabilityError('ScreenOrientation', 'getOrientationAsync');
  }
  return await ExpoScreenOrientation.getOrientationAsync();
}

// @needsAudit
/**
 * Gets the current screen orientation lock type.
 * @return Returns a promise which fulfils with an [`OrientationLock`](#orientationlock)
 * value.
 *
 * # Error codes
 * - `ERR_SCREEN_ORIENTATION_MISSING_ACTIVITY` - __Android Only.__ Could not get the current activity.
 */
export async function getOrientationLockAsync(): Promise<OrientationLock> {
  if (!ExpoScreenOrientation.getOrientationLockAsync) {
    return _lastOrientationLock;
  }
  return await ExpoScreenOrientation.getOrientationLockAsync();
}

// @needsAudit
/**
 * Gets the platform specific screen orientation lock type.
 * @return Returns a promise which fulfils with a [`PlatformOrientationInfo`](#platformorientationinfo)
 * value.
 *
 * # Error codes
 * - `ERR_SCREEN_ORIENTATION_GET_PLATFORM_ORIENTATION_LOCK`
 * - `ERR_SCREEN_ORIENTATION_MISSING_ACTIVITY` - __Android Only.__ Could not get the current activity.
 */
export async function getPlatformOrientationLockAsync(): Promise<PlatformOrientationInfo> {
  const platformOrientationLock = await ExpoScreenOrientation.getPlatformOrientationLockAsync();
  if (Platform.OS === 'android') {
    return {
      screenOrientationConstantAndroid: platformOrientationLock,
    };
  } else if (Platform.OS === 'ios') {
    return {
      screenOrientationArrayIOS: platformOrientationLock,
    };
  } else if (Platform.OS === 'web') {
    return {
      screenOrientationLockWeb: platformOrientationLock,
    };
  } else {
    return {};
  }
}

// @needsAudit @docsMissing
/**
 * Returns whether the [`OrientationLock`](#orientationlock) policy is supported on
 * the device.
 * @param orientationLock
 * @return Returns a promise that resolves to a `boolean` value that reflects whether or not the
 * orientationLock is supported.
 */
export async function supportsOrientationLockAsync(
  orientationLock: OrientationLock
): Promise<boolean> {
  if (!ExpoScreenOrientation.supportsOrientationLockAsync) {
    throw new UnavailabilityError('ScreenOrientation', 'supportsOrientationLockAsync');
  }

  const orientationLocks = Object.values(OrientationLock);
  if (!orientationLocks.includes(orientationLock)) {
    throw new TypeError(`Invalid Orientation Lock: ${orientationLock}`);
  }

  return await ExpoScreenOrientation.supportsOrientationLockAsync(orientationLock);
}

// Determine the event name lazily so Jest can set up mocks in advance
function getEventName(): string {
  return Platform.OS === 'ios' || Platform.OS === 'web'
    ? 'expoDidUpdateDimensions'
    : 'didUpdateDimensions';
}

// We rely on RN to emit `didUpdateDimensions`
// If this method no longer works, it's possible that the underlying RN implementation has changed
// see https://github.com/facebook/react-native/blob/c31f79fe478b882540d7fd31ee37b53ddbd60a17/ReactAndroid/src/main/java/com/facebook/react/modules/deviceinfo/DeviceInfoModule.java#L90
// @needsAudit
/**
 * Invokes the `listener` function when the screen orientation changes from `portrait` to `landscape`
 * or from `landscape` to `portrait`. For example, it won't be invoked when screen orientation
 * change from `portrait up` to `portrait down`, but it will be called when there was a change from
 * `portrait up` to `landscape left`.
 * @param listener Each orientation update will pass an object with the new [`OrientationChangeEvent`](#orientationchangeevent)
 * to the listener.
 */
export function addOrientationChangeListener(listener: OrientationChangeListener): Subscription {
  if (typeof listener !== 'function') {
    throw new TypeError(`addOrientationChangeListener cannot be called with ${listener}`);
  }
  const subscription = _orientationChangeEmitter.addListener(
    getEventName(),
    async (update: OrientationChangeEvent) => {
      let orientationInfo, orientationLock;
      if (Platform.OS === 'ios' || Platform.OS === 'web') {
        // For iOS, RN relies on statusBarOrientation (deprecated) to emit `didUpdateDimensions`
        // event, so we emit our own `expoDidUpdateDimensions` event instead
        orientationLock = update.orientationLock;
        orientationInfo = update.orientationInfo;
      } else {
        // We rely on the RN Dimensions to emit the `didUpdateDimensions` event on Android
        let orientation;
        [orientationLock, orientation] = await Promise.all([
          getOrientationLockAsync(),
          getOrientationAsync(),
        ]);
        orientationInfo = { orientation };
      }
      listener({ orientationInfo, orientationLock });
    }
  );
  _orientationChangeSubscribers.push(subscription);
  return subscription;
}

// We need to keep track of our own subscribers because EventEmitter uses a shared subscriber
// from NativeEventEmitter that is registered to the same eventTypes as us. Directly calling
// removeAllListeners(eventName) will remove other module's subscribers.
// @needsAudit
/**
 * Removes all listeners subscribed to orientation change updates.
 */
export function removeOrientationChangeListeners(): void {
  // Remove listener by subscription instead of eventType to avoid clobbering Dimension module's subscription of didUpdateDimensions
  let i = _orientationChangeSubscribers.length;
  while (i--) {
    const subscriber = _orientationChangeSubscribers[i];
    subscriber.remove();

    // remove after a successful unsubscribe
    _orientationChangeSubscribers.pop();
  }
}

// @needsAudit
/**
 * Unsubscribes the listener associated with the `Subscription` object from all orientation change
 * updates.
 * @param subscription A subscription object that manages the updates passed to a listener function
 * on an orientation change.
 */
export function removeOrientationChangeListener(subscription: Subscription): void {
  if (!subscription || !subscription.remove) {
    throw new TypeError(`Must pass in a valid subscription`);
  }
  subscription.remove();
  _orientationChangeSubscribers = _orientationChangeSubscribers.filter(
    (sub) => sub !== subscription
  );
}
