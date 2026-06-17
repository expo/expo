import type { MetricAttributes } from 'expo-app-metrics';
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
export declare function ObserveInteractiveMarker(props: ObserveInteractiveMarkerProps): null;
//# sourceMappingURL=InteractiveMarker.d.ts.map