import type { UseZoomPrefetchNavigationOptions, ZoomPrefetchPressHandler } from './useZoomPrefetchNavigation.types';
/**
 * Manages the prefetch-then-navigate flow for zoom transitions.
 *
 * When a zoom transition is active, pressing the link prefetches the route first,
 * then navigates on the next render. This ensures the target screen component is
 * mounted before the zoom animation starts, avoiding visual glitches.
 *
 * @returns A press handler that either prefetches-then-navigates (zoom) or navigates directly (no zoom).
 */
export declare function useZoomPrefetchNavigation({ withZoomTransition, resolvedHref, navigate, }: UseZoomPrefetchNavigationOptions): ZoomPrefetchPressHandler;
//# sourceMappingURL=useZoomPrefetchNavigation.ios.d.ts.map