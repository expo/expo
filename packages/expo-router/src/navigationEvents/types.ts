import type { ReactNavigationState } from '../global-state/types';
import type { NavigationAction, NavigationState } from '../react-navigation';

export interface BasePageEvent {
  pathname: string;
  params: Record<string, string | string[]>;
  screenId: string;
  segments: string[];
}

/**
 * The page rendered as part of a preload (e.g. `router.prefetch()`) and is not
 * currently focused. If the user later navigates to this route, the matching
 * `pageFocused` will fire then; the preload may also be invalidated or the
 * route unmounted (`pageRemoved`) without a focus.
 */
export interface PagePreloadedEvent extends BasePageEvent {
  type: 'pagePreloaded';
}

export interface PageFocusedEvent extends BasePageEvent {
  type: 'pageFocused';
}

export interface PageBlurredEvent extends BasePageEvent {
  type: 'pageBlurred';
}

export interface PageRemoved extends BasePageEvent {
  type: 'pageRemoved';
}

export interface ActionDispatchedEvent {
  type: 'actionDispatched';
  /** The action type from the dispatched NavigationAction (e.g. `NAVIGATE`). */
  actionType: NavigationAction['type'];
  payload: NavigationAction['payload'];
  state: ReactNavigationState;
}

/**
 * Fires after navigation state commits once for each `PRELOAD` action that changes it. Unlike
 * `pagePreloaded`, which fires when an unfocused screen mounts, this event reports the route
 * affected by the preload action.
 */
export interface RoutePreloadedEvent {
  type: 'routePreloaded';
  routeKey: string;
  state: NavigationState;
}
