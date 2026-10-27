'use client';

import { createContext } from 'react';

import {
  getInternalExpoRouterParams,
  INTERNAL_EXPO_ROUTER_IS_PREVIEW_NAVIGATION_PARAM_NAME,
  INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME,
  INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME,
} from '../../navigationParams';

export type ZoomTransitionSourceContextValueType =
  | {
      identifier: string;
      hasZoomSource: boolean;
      addSource: () => void;
      removeSource: () => void;
    }
  | undefined;

export const ZoomTransitionSourceContext =
  createContext<ZoomTransitionSourceContextValueType>(undefined);

/**
 * Defines the screen bounds where interactive dismissal gestures are allowed for zoom transitions.
 *
 * @platform ios
 */
export interface DismissalBoundsRect {
  /**
   * Minimum X coordinate (left edge) where dismissal gestures are allowed.
   */
  minX?: number;
  /**
   * Maximum X coordinate (right edge) where dismissal gestures are allowed.
   */
  maxX?: number;
  /**
   * Minimum Y coordinate (top edge) where dismissal gestures are allowed.
   */
  minY?: number;
  /**
   * Maximum Y coordinate (bottom edge) where dismissal gestures are allowed.
   */
  maxY?: number;
}

export interface ZoomTransitionTargetContextValueType {
  identifier: string | null;
  dismissalBoundsRect: DismissalBoundsRect | undefined | null;
  setDismissalBoundsRect: (rect: DismissalBoundsRect | null) => void;
  addEnabler: () => void;
  removeEnabler: () => void;
  hasEnabler: boolean;
  gestureEnabled?: boolean;
  isModal?: boolean;
}

export const ZoomTransitionTargetContext = createContext<ZoomTransitionTargetContextValueType>({
  identifier: null,
  dismissalBoundsRect: null,
  setDismissalBoundsRect: () => {},
  addEnabler: () => {},
  removeEnabler: () => {},
  hasEnabler: false,
});

/**
 * Reads the zoom transition a route was pushed with, if any.
 *
 * @internal
 */
export function getZoomTransitionTarget(
  route: unknown
): { identifier: string; routeKey: string; isLinkPreviewNavigation: boolean } | null {
  if (
    route &&
    typeof route === 'object' &&
    'params' in route &&
    typeof route.params === 'object' &&
    'key' in route &&
    typeof route.key === 'string'
  ) {
    const internalParams = getInternalExpoRouterParams(route.params ?? {});
    const zoomTransitionId =
      internalParams[INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME];
    const zoomTransitionScreenId =
      internalParams[INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME];
    if (
      typeof zoomTransitionId === 'string' &&
      zoomTransitionId &&
      zoomTransitionScreenId === route.key
    ) {
      return {
        identifier: zoomTransitionId,
        routeKey: route.key,
        isLinkPreviewNavigation:
          !!internalParams[INTERNAL_EXPO_ROUTER_IS_PREVIEW_NAVIGATION_PARAM_NAME],
      };
    }
  }
  return null;
}
