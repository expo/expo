import { EventSubscription } from 'expo-modules-core';
import { useEffect, useState } from 'react';

import { DisplayFeature, DisplayFeaturesChangeEvent, Hinge, HingeChangeEvent } from './DisplayFeatures.types';
import ExpoDisplayFeatures, {
  displayFeaturesChangeEventName,
  hingeChangeEventName,
} from './ExpoDisplayFeatures';

export {
  DisplayFeature,
  DisplayFeatureRect,
  DisplayFeatureState,
  DisplayFeatureType,
  DisplayFeaturesChangeEvent,
  Hinge,
  HingeChangeEvent,
  HingeStatus,
} from './DisplayFeatures.types';

/**
 * Gets the display's current reserved regions &mdash; areas such as a hinge or a front-facing
 * camera that content should avoid covering.
 *
 * Resolves to an empty array on every platform today. iOS reserves this for the iOS 27.1 SDK,
 * which is not part of any Xcode release publicly available as of 2026-09-10 (Apple lists Xcode
 * 27.1 beta, which ships it, as "coming later this month").
 *
 * @return A promise that resolves to the currently active display features.
 *
 * @example
 * ```ts
 * const displayFeatures = await getDisplayFeaturesAsync();
 * const fold = displayFeatures.find((feature) => feature.type === DisplayFeatureType.HINGE);
 * ```
 *
 * @platform ios
 */
export async function getDisplayFeaturesAsync(): Promise<DisplayFeature[]> {
  return await ExpoDisplayFeatures.getDisplayFeaturesAsync();
}

/**
 * Gets the device's current hinge state.
 *
 * Resolves to `null` on devices without a hinge, and on every device today: this is reserved for
 * the iOS 27.1 SDK. See {@link getDisplayFeaturesAsync} for why.
 *
 * @return A promise that resolves to the current hinge state, or `null` if the device has no hinge.
 *
 * @platform ios
 */
export async function getHingeAsync(): Promise<Hinge | null> {
  return await ExpoDisplayFeatures.getHingeAsync();
}

/**
 * Adds a listener that's called whenever the set of active display features changes, such as when
 * a foldable device's pose changes.
 *
 * @param listener Callback fired with the new list of display features.
 * @return A subscription object with a `remove` method to unregister the listener.
 *
 * @platform ios
 */
export function addDisplayFeaturesChangeListener(
  listener: (event: DisplayFeaturesChangeEvent) => void
): EventSubscription {
  return ExpoDisplayFeatures.addListener(displayFeaturesChangeEventName, listener);
}

/**
 * Adds a listener that's called whenever the device's hinge state changes.
 *
 * @param listener Callback fired with the new hinge state.
 * @return A subscription object with a `remove` method to unregister the listener.
 *
 * @platform ios
 */
export function addHingeChangeListener(listener: (event: HingeChangeEvent) => void): EventSubscription {
  return ExpoDisplayFeatures.addListener(hingeChangeEventName, listener);
}

/**
 * React hook that returns the display's currently active reserved regions, updating automatically
 * as they change. See {@link getDisplayFeaturesAsync} for platform support.
 *
 * @example
 * ```tsx
 * function App() {
 *   const displayFeatures = useDisplayFeatures();
 *   const isFolded = displayFeatures.some((f) => f.type === DisplayFeatureType.HINGE);
 *   return <View style={isFolded ? styles.folded : styles.unfolded} />;
 * }
 * ```
 *
 * @platform ios
 */
export function useDisplayFeatures(): DisplayFeature[] {
  const [displayFeatures, setDisplayFeatures] = useState<DisplayFeature[]>([]);
  useEffect(() => {
    let isMounted = true;
    getDisplayFeaturesAsync().then((initial) => {
      if (isMounted) {
        setDisplayFeatures(initial);
      }
    });
    const subscription = addDisplayFeaturesChangeListener((event) => {
      setDisplayFeatures(event.displayFeatures);
    });
    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);
  return displayFeatures;
}

/**
 * React hook that returns the device's current hinge state, updating automatically as it changes.
 * See {@link getHingeAsync} for platform support.
 *
 * @platform ios
 */
export function useHinge(): Hinge | null {
  const [hinge, setHinge] = useState<Hinge | null>(null);
  useEffect(() => {
    let isMounted = true;
    getHingeAsync().then((initial) => {
      if (isMounted) {
        setHinge(initial);
      }
    });
    const subscription = addHingeChangeListener((event) => {
      setHinge(event.hinge);
    });
    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);
  return hinge;
}
