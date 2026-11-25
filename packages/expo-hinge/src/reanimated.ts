import { installOnUIRuntime, type EventSubscription } from 'expo';
import { useEffect } from 'react';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';
import { createSerializable, getUIRuntimeHolder, isWorkletFunction } from 'react-native-worklets';

import ExpoHinge from './ExpoHinge';
import { getHinge } from './Hinge';
import type { Hinge, HingeChangeEvent } from './Hinge.types';

let isInstalledOnUIRuntime = false;

/**
 * Subscribes a worklet to hinge changes. The worklet runs on the UI thread, synchronously with the
 * native change, and never waits for the JS thread. Unlike
 * [`addHingeListener`](#addhingelistenerlistener), it also runs once with the current hinge right
 * after the subscription. Throws an error when `worklet` is not a worklet. Import it from
 * `expo-hinge/reanimated`, which requires `react-native-reanimated` and `react-native-worklets`.
 * @param worklet A worklet that is invoked with a [`HingeChangeEvent`](#hingechangeevent).
 * @return An `EventSubscription` whose `remove()` unsubscribes the worklet.
 */
export function addHingeWorkletListener(
  worklet: (event: HingeChangeEvent) => void
): EventSubscription {
  if (!ExpoHinge) {
    return { remove() {} };
  }
  if (!isWorkletFunction(worklet)) {
    throw new Error(
      "The hinge listener must be a worklet. Add the 'worklet' directive as its first statement."
    );
  }
  if (!isInstalledOnUIRuntime) {
    installOnUIRuntime(getUIRuntimeHolder());
    isInstalledOnUIRuntime = true;
  }
  const id = ExpoHinge.addWorkletListener(createSerializable(worklet));
  return { remove: () => ExpoHinge?.removeWorkletListener(id) };
}

/**
 * Returns a Reanimated shared value with the live hinge state. The UI thread updates it with no
 * JS-thread round trip, so animations that read it keep up with the hinge while the JS thread is
 * busy. Import it from `expo-hinge/reanimated`, which requires `react-native-reanimated` and
 * `react-native-worklets`.
 * @example
 * ```tsx
 * const hinge = useAnimatedHinge();
 * const style = useAnimatedStyle(() => ({
 *   transform: [{ rotate: `${hinge.get()?.angle ?? 180}deg` }],
 * }));
 * ```
 */
export function useAnimatedHinge(): SharedValue<Hinge | null> {
  const hinge = useSharedValue<Hinge | null>(getHinge);

  useEffect(() => {
    const subscription = addHingeWorkletListener((event) => {
      'worklet';
      hinge.set(event.hinge);
    });
    return () => subscription.remove();
  }, [hinge]);

  return hinge;
}
