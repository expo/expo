import { Subscription } from 'expo-modules-core';
import { Orientation, OrientationChangeEvent, OrientationChangeListener, OrientationLock, PlatformOrientationInfo, WebOrientationLock, WebOrientation, SizeClassIOS, ScreenOrientationInfo } from './ScreenOrientation.types';
export { Orientation, OrientationLock, PlatformOrientationInfo, OrientationChangeListener, OrientationChangeEvent, WebOrientationLock, WebOrientation, SizeClassIOS, ScreenOrientationInfo, Subscription, };
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
export declare function lockAsync(orientationLock: OrientationLock): Promise<void>;
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
export declare function lockPlatformAsync(options: PlatformOrientationInfo): Promise<void>;
/**
 * Sets the screen orientation back to the `OrientationLock.DEFAULT` policy.
 * @return Returns a promise with `void` value, which fulfils when the orientation is set.
 *
 * # Error codes
 * - `ERR_SCREEN_ORIENTATION_MISSING_ACTIVITY` - __Android Only.__ Could not get the current activity.
 */
export declare function unlockAsync(): Promise<void>;
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
export declare function getOrientationAsync(): Promise<Orientation>;
/**
 * Gets the current screen orientation lock type.
 * @return Returns a promise which fulfils with an [`OrientationLock`](#orientationlock)
 * value.
 *
 * # Error codes
 * - `ERR_SCREEN_ORIENTATION_MISSING_ACTIVITY` - __Android Only.__ Could not get the current activity.
 */
export declare function getOrientationLockAsync(): Promise<OrientationLock>;
/**
 * Gets the platform specific screen orientation lock type.
 * @return Returns a promise which fulfils with a [`PlatformOrientationInfo`](#platformorientationinfo)
 * value.
 *
 * # Error codes
 * - `ERR_SCREEN_ORIENTATION_GET_PLATFORM_ORIENTATION_LOCK`
 * - `ERR_SCREEN_ORIENTATION_MISSING_ACTIVITY` - __Android Only.__ Could not get the current activity.
 */
export declare function getPlatformOrientationLockAsync(): Promise<PlatformOrientationInfo>;
/**
 * Returns whether the [`OrientationLock`](#orientationlock) policy is supported on
 * the device.
 * @param orientationLock
 * @return Returns a promise that resolves to a `boolean` value that reflects whether or not the
 * orientationLock is supported.
 */
export declare function supportsOrientationLockAsync(orientationLock: OrientationLock): Promise<boolean>;
/**
 * Invokes the `listener` function when the screen orientation changes from `portrait` to `landscape`
 * or from `landscape` to `portrait`. For example, it won't be invoked when screen orientation
 * change from `portrait up` to `portrait down`, but it will be called when there was a change from
 * `portrait up` to `landscape left`.
 * @param listener Each orientation update will pass an object with the new [`OrientationChangeEvent`](#orientationchangeevent)
 * to the listener.
 */
export declare function addOrientationChangeListener(listener: OrientationChangeListener): Subscription;
/**
 * Removes all listeners subscribed to orientation change updates.
 */
export declare function removeOrientationChangeListeners(): void;
/**
 * Unsubscribes the listener associated with the `Subscription` object from all orientation change
 * updates.
 * @param subscription A subscription object that manages the updates passed to a listener function
 * on an orientation change.
 */
export declare function removeOrientationChangeListener(subscription: Subscription): void;
//# sourceMappingURL=ScreenOrientation.d.ts.map