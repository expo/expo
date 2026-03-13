'use client';

import type {
  UseZoomPrefetchNavigationOptions,
  ZoomPrefetchPressHandler,
} from './useZoomPrefetchNavigation.types';

const NOOP = () => false;

/**
 * On non-iOS platforms, zoom transitions are not supported.
 */
export function useZoomPrefetchNavigation(
  _: UseZoomPrefetchNavigationOptions
): ZoomPrefetchPressHandler {
  return NOOP;
}
