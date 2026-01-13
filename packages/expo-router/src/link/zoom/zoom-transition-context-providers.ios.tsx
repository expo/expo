'use client';

import { useCallback, useId, useMemo, useRef, useState } from 'react';

import { isZoomTransitionEnabled } from './ZoomTransitionEnabler.ios';
import {
  ZoomTransitionSourceContext,
  ZoomTransitionTargetContext,
  type ZoomTransitionSourceContextValueType,
  type DismissalBoundsRect,
} from './zoom-transition-context';
import type {
  ZoomTransitionSourceContextProviderProps,
  ZoomTransitionTargetContextProviderProps,
} from './zoom-transition-context-providers.types';
import {
  getInternalExpoRouterParams,
  INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME,
  INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME,
} from '../../navigationParams';
import { shouldLinkExternally } from '../../utils/url';
import { useIsPreview } from '../preview/PreviewRouteContext';

export function ZoomTransitionSourceContextProvider({
  children,
  linkProps,
}: ZoomTransitionSourceContextProviderProps) {
  const { href, asChild } = linkProps;
  const isExternalHref =
    typeof href === 'string' ? shouldLinkExternally(href) : shouldLinkExternally(href.pathname);
  const numberOfSources = useRef(0);
  const [hasZoomSource, setHasZoomSource] = useState(false);

  const zoomTransitionId = useId();

  const addSource = useCallback(() => {
    if (!isZoomTransitionEnabled()) {
      throw new Error('[expo-router] Zoom transitions are not enabled.');
    }
    if (numberOfSources.current >= 1) {
      throw new Error(
        '[expo-router] Only one Link.ZoomTransitionSource can be used within a single Link component.'
      );
    }
    if (!asChild) {
      throw new Error(
        '[expo-router] Link must be used with `asChild` prop to enable zoom transitions.'
      );
    }
    if (isExternalHref) {
      throw new Error('[expo-router] Zoom transitions can only be used with internal links.');
    }
    numberOfSources.current += 1;
    setHasZoomSource(true);
  }, [asChild, isExternalHref]);

  const removeSource = useCallback(() => {
    numberOfSources.current -= 1;
    if (numberOfSources.current <= 0) {
      setHasZoomSource(false);
    }
  }, []);

  const value = useMemo<ZoomTransitionSourceContextValueType>(
    () => ({
      identifier: zoomTransitionId,
      hasZoomSource,
      addSource,
      removeSource,
    }),
    [zoomTransitionId, hasZoomSource, addSource, removeSource]
  );

  return <ZoomTransitionSourceContext value={value}>{children}</ZoomTransitionSourceContext>;
}

export function ZoomTransitionTargetContextProvider({
  route,
  children,
}: ZoomTransitionTargetContextProviderProps) {
  const [dismissalBoundsRect, setDismissalBoundsRect] = useState<DismissalBoundsRect | null>(null);
  const isPreview = useIsPreview();
  if (
    isZoomTransitionEnabled() &&
    !isPreview &&
    route &&
    typeof route === 'object' &&
    'params' in route &&
    typeof route.params === 'object' &&
    'key' in route &&
    typeof route.key === 'string'
  ) {
    const params = route.params ?? {};
    const internalParams = getInternalExpoRouterParams(params);
    const zoomTransitionId =
      internalParams[INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME];
    const zoomTransitionScreenId =
      internalParams[INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME];
    const hasZoomTransition = !!zoomTransitionId && zoomTransitionScreenId === route.key;
    if (hasZoomTransition && typeof zoomTransitionId === 'string') {
      return (
        <ZoomTransitionTargetContext
          value={{
            identifier: zoomTransitionId,
            dismissalBoundsRect,
            setDismissalBoundsRect,
          }}>
          {children}
        </ZoomTransitionTargetContext>
      );
    }
  }
  return children;
}
