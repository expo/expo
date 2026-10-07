import type { EventSubscription } from 'expo';
import { useEffect, useState } from 'react';

import ExpoHinge from './ExpoHinge';
import type { Hinge, HingeChangeEvent } from './Hinge.types';

/**
 * Whether this build and OS can report the hinge: iOS 27.1 or later, built with the iOS 27.1 SDK, or
 * Android 11 (API level 30) or later. It does not mean the device has a hinge, which
 * [`getHinge()`](#gethinge) answers with a non-`null` value. Always `false` on web.
 */
export function isAvailable(): boolean {
  return ExpoHinge?.isAvailable ?? false;
}

/**
 * Returns the current hinge state synchronously, or `null` when the API is unavailable, the device
 * has no hinge, or the app's window provides no hinge updates.
 * @example
 * ```ts
 * Hinge.getHinge();
 * // { angle: 120, status: 'partiallyOpen' }
 * ```
 */
export function getHinge(): Hinge | null {
  return ExpoHinge?.getHinge() ?? null;
}

/**
 * Subscribes to hinge changes. The listener is called on every angle or status change, and with a
 * `null` hinge when the window stops providing hinge updates. Use hinge state for interactions and
 * effects, not for layout.
 * @param listener A callback that is invoked with a [`HingeChangeEvent`](#hingechangeevent).
 * @return An `EventSubscription` whose `remove()` unsubscribes the listener.
 */
export function addHingeListener(listener: (event: HingeChangeEvent) => void): EventSubscription {
  if (!ExpoHinge) {
    return { remove() {} };
  }
  return ExpoHinge.addListener('hingeChange', listener);
}

/**
 * Returns the live hinge state and re-renders on every change. The first render already has the
 * current value, since the native module caches it.
 * @example
 * ```tsx
 * const hinge = useHinge();
 * return <Text>{hinge ? `${hinge.status} at ${hinge.angle}°` : 'No hinge'}</Text>;
 * ```
 */
export function useHinge(): Hinge | null {
  const [hinge, setHinge] = useState<Hinge | null>(getHinge);

  useEffect(() => {
    // The state can change between the first render and the subscription.
    setHinge(getHinge());
    const subscription = addHingeListener((event) => setHinge(event.hinge));
    return () => subscription.remove();
  }, []);

  return hinge;
}
