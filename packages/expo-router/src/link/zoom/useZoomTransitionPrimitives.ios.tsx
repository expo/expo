'use client';

import { nanoid } from 'nanoid/non-secure';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { isZoomTransitionEnabled } from './ZoomTransitionEnabler';
import { INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME } from '../../navigationParams';
import { parseUrlUsingCustomBase } from '../../utils/url';
import { useIsPreview } from '../preview/PreviewRouteContext';
import { LinkProps } from '../useLinkHooks';

export function useZoomTransitionPrimitives({ href, asChild }: LinkProps) {
  const isPreview = useIsPreview();
  const zoomTransitionId = useMemo(
    () =>
      !isPreview && process.env.EXPO_OS === 'ios' && isZoomTransitionEnabled()
        ? nanoid()
        : undefined,
    []
  );

  const [numberOfSources, setNumberOfSources] = useState(0);
  const addSource = useCallback(() => {
    setNumberOfSources((prev) => prev + 1);
  }, []);
  const removeSource = useCallback(() => {
    setNumberOfSources((prev) => prev - 1);
  }, []);

  const hasZoomSource = numberOfSources > 0;

  useEffect(() => {
    if (numberOfSources > 1) {
      throw new Error(
        '[expo-router] Only one Link.ZoomTransitionSource can be used within a single Link component.'
      );
    }
  }, [numberOfSources]);

  useEffect(() => {
    if (hasZoomSource && !asChild) {
      console.warn(
        '[expo-router] Using zoom transition links without `asChild` prop may lead to unexpected behavior. Please ensure to set `asChild` when using zoom transitions.'
      );
    }
  }, [hasZoomSource, asChild]);

  const zoomTransitionSourceContextValue = useMemo(() => {
    if (!zoomTransitionId) {
      return undefined;
    }
    return {
      identifier: zoomTransitionId,
      addSource,
      removeSource,
      canAddSource: !hasZoomSource,
    };
  }, [zoomTransitionId, addSource, removeSource, hasZoomSource]);

  const computedHref = useMemo(() => {
    if (!hasZoomSource || !zoomTransitionId) {
      return href;
    }
    if (typeof href === 'string') {
      const { pathname, searchParams } = parseUrlUsingCustomBase(href);
      return {
        pathname,
        params: {
          ...Object.fromEntries(searchParams.entries()),
          [INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME]: zoomTransitionId,
        },
      };
    }
    return {
      pathname: href.pathname,
      params: {
        ...(href.params ?? {}),
        [INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME]: zoomTransitionId,
      },
    };
  }, [href, zoomTransitionId, hasZoomSource]);
  return { zoomTransitionSourceContextValue, href: computedHref };
}
