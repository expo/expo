import type { MetricAttributes } from 'expo-app-metrics';
import { useEffect, useRef, useState } from 'react';

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
 * import { ObserveInteractiveMarker } from 'expo-observe';
 *
 * function Feed({ items }) {
 *   if (!items) return <Spinner />;
 *   return (
 *     <>
 *       <FeedList items={items} />
 *       <ObserveInteractiveMarker params={{ cacheHit: true }} />
 *     </>
 *   );
 * }
 * ```
 */
export function ObserveInteractiveMarker(props: ObserveInteractiveMarkerProps) {
  const { markInteractive } = useObserve();
  const [initialProps] = useState(props);
  const hasWarnedRef = useRef(false);

  useEffect(() => {
    markInteractive({ params: initialProps.params });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!__DEV__ || hasWarnedRef.current) return;
    if (!paramsEqual(initialProps.params, props.params)) {
      hasWarnedRef.current = true;
      console.warn(
        '[expo-observe] <ObserveInteractiveMarker> received changed props after its first render. ' +
          'markInteractive is only sent once on mount, so updates to `params` are ignored. ' +
          "Pass params that are stable for the marker's lifetime, or call " +
          'useObserve().markInteractive(...) directly if you need to attach attributes known later.'
      );
    }
  }, [props.params]);

  return null;
}

function paramsEqual(
  a: ObserveInteractiveMarkerProps['params'],
  b: ObserveInteractiveMarkerProps['params']
) {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return a === b;
  }
}
