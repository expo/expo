import type { SharedObject } from 'expo';

import { worklets } from './optionalWorklets';
import { useWorkletProp } from './useWorkletProp';

/**
 * A worklet function wrapped for native code, returned by [`useWorkletCallback`](#useworkletcallback).
 * Pass it to a modifier or prop that accepts worklet callbacks, which then runs it synchronously on
 * the UI thread.
 */
export type WorkletCallback<T extends (...args: never[]) => void> = SharedObject & {
  /** @hidden */
  readonly __workletCallbackType?: T;
};

/**
 * Wraps a worklet function so native code can run it synchronously on the UI thread, with no
 * JS-thread round trip. Pass the result to a modifier that accepts worklet callbacks, such as
 * `onHingeChange`. The callback must start with the `'worklet'` directive, and
 * [`react-native-worklets`](https://docs.swmansion.com/react-native-worklets/) must be installed.
 *
 * The native callback is updated when `callback` changes and released when the component unmounts,
 * so call it at the top of your component like any hook.
 *
 * @example
 * ```tsx
 * const angle = useNativeState(180);
 * const onHinge = useWorkletCallback((_, newContext) => {
 *   'worklet';
 *   angle.value = newContext.hinge?.angle ?? 180;
 * });
 *
 * <VStack modifiers={[onHingeChange(onHinge)]} />
 * ```
 */
export function useWorkletCallback<T extends (...args: never[]) => void>(
  callback: T
): WorkletCallback<T> {
  const workletCallback = useWorkletProp(callback as unknown as (...args: unknown[]) => void);
  if (!worklets || !workletCallback) {
    throw new Error(
      "useWorkletCallback needs the 'react-native-worklets' package, which couldn't be loaded. " +
        'Install react-native-worklets and rebuild the native app, or pass a plain function ' +
        'where the API accepts one.'
    );
  }
  return workletCallback as WorkletCallback<T>;
}
