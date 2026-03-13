import type { MouseEvent } from 'react';
import type { GestureResponderEvent } from 'react-native';
export interface UseZoomPrefetchNavigationOptions {
    withZoomTransition: boolean;
    resolvedHref: string;
    navigate: (event?: MouseEvent<HTMLAnchorElement> | GestureResponderEvent) => void;
}
/**
 * The press handler type returned by `useZoomPrefetchNavigation`.
 *
 * Returns `true` if the press event was handled (e.g. prefetch initiated for zoom transition),
 * or `false` if the event should fall back to normal navigation.
 */
export type ZoomPrefetchPressHandler = (event?: MouseEvent<HTMLAnchorElement> | GestureResponderEvent) => boolean;
//# sourceMappingURL=useZoomPrefetchNavigation.types.d.ts.map