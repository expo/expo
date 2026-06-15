import type { MetricAttributes } from 'expo-app-metrics';
import { useEffect, useRef } from 'react';

import { useObserve } from './useObserve';

export type ObserveInteractiveMarkerProps = {
  /**
   * Custom parameters attached to the TTI metric, forwarded to `markInteractive`.
   * Values can be strings, numbers, booleans, or other JSON-serializable values.
   */
  params?: MetricAttributes['params'];
};

/**
 * Declarative wrapper around `useObserve().markInteractive(...)`. Renders nothing
 * and calls `markInteractive` once when it first mounts, marking the moment the
 * screen becomes interactive (used to compute the `tti` metric). Render it once
 * the screen is ready for user interaction — for example, after its initial data
 * has loaded.
 *
 * Because `markInteractive` is only sent on mount, the marker is fire-once: changing
 * `params` after the first render has no effect and warns in development. If you need
 * to attach attributes that are only known later, call `useObserve().markInteractive(...)`
 * imperatively instead.
 *
 * @example
 * ```tsx
 * import { InteractiveMarker } from 'expo-observe';
 *
 * function Feed({ items }) {
 *   if (!items) return <Spinner />;
 *   return (
 *     <>
 *       <FeedList items={items} />
 *       <InteractiveMarker params={{ cacheHit: true }} />
 *     </>
 *   );
 * }
 * ```
 */
export function ObserveInteractiveMarker(props: ObserveInteractiveMarkerProps) {
  const { markInteractive } = useObserve();
  const initialPropsRef = useRef(props);
  const hasFiredRef = useRef(false);
  const hasWarnedRef = useRef(false);

  useEffect(() => {
    // Fire once per mounted instance. The `hasFiredRef` guard keeps StrictMode's
    // mount/unmount/remount double-invoke (refs are preserved across it) from
    // sending twice; a genuine remount gets a fresh ref and fires again.
    if (hasFiredRef.current) return;
    hasFiredRef.current = true;
    markInteractive({ params: initialPropsRef.current.params });
    // Fire once on mount; `markInteractive` identity and later prop changes are ignored by design.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!__DEV__ || hasWarnedRef.current) return;
    if (!paramsEqual(initialPropsRef.current.params, props.params)) {
      hasWarnedRef.current = true;
      console.warn(
        '[expo-observe] <InteractiveMarker> received changed props after its first render. ' +
          'markInteractive is only sent once on mount, so updates to `params` are ignored. ' +
          'Pass params that are stable for the marker’s lifetime, or call ' +
          'useObserve().markInteractive(...) directly if you need to attach attributes known later.'
      );
    }
  }, [props.params]);

  return null;
}

/**
 * Structural equality for `params`, so a fresh inline object of the same shape is treated as
 * equal and does not trigger the dev warning. Falls back to reference equality if the values
 * can't be serialized (for example, a circular reference) so the diagnostic never throws.
 */
function paramsEqual(a: ObserveInteractiveMarkerProps['params'], b: ObserveInteractiveMarkerProps['params']) {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return a === b;
  }
}
