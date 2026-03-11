'use client';

import { useState, useEffect } from 'react';
import type { MouseEvent } from 'react';
import type { GestureResponderEvent } from 'react-native';

import type {
  UseZoomPrefetchNavigationOptions,
  ZoomPrefetchPressHandler,
} from './useZoomPrefetchNavigation.types';
import { useRouter } from '../../hooks';
import { useNavigation } from '../../useNavigation';

const NOOP = () => false;

/**
 * Manages the prefetch-then-navigate flow for zoom transitions.
 *
 * When a zoom transition is active, pressing the link prefetches the route first,
 * then navigates on the next render. This ensures the target screen component is
 * mounted before the zoom animation starts, avoiding visual glitches.
 *
 * @returns A press handler that either prefetches-then-navigates (zoom) or navigates directly (no zoom).
 */
export function useZoomPrefetchNavigation({
  withZoomTransition,
  resolvedHref,
  navigate,
}: UseZoomPrefetchNavigationOptions): ZoomPrefetchPressHandler {
  const router = useRouter();
  const navigation = useNavigation();

  const [zoomPrefetched, setZoomPrefetched] = useState(false);

  // After prefetch, navigate on the next render
  useEffect(() => {
    if (zoomPrefetched) {
      setZoomPrefetched(false);
      navigate();
    }
  }, [zoomPrefetched]);

  if (!withZoomTransition) {
    return NOOP;
  }

  return (e?: MouseEvent<HTMLAnchorElement> | GestureResponderEvent) => {
    // Only prefetch when the current screen is focused.
    // Otherwise the prefetch can cause unexpected behavior
    // when a currently dismissed screen gets prefetched.
    if (navigation.isFocused() && !e?.defaultPrevented) {
      e?.preventDefault();
      router.prefetch(resolvedHref);
      setZoomPrefetched(true);
      return true;
    }
    return false;
  };
}
