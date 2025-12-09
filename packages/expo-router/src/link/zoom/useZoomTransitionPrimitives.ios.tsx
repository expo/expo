'use client';

import { nanoid } from 'nanoid/non-secure';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { isZoomTransitionEnabled } from './ZoomTransitionEnabler';
import { INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME } from '../../navigationParams';
import { parseUrlUsingCustomBase, shouldLinkExternally } from '../../utils/url';
import { useIsPreview } from '../preview/PreviewRouteContext';
import { LinkProps } from '../useLinkHooks';
import type { ZoomTransitionSourceContextValueType } from './zoom-transition-context';

export function useZoomTransitionPrimitives({ href, asChild }: LinkProps) {
  const isPreview = useIsPreview();
  const isExternalHref =
    typeof href === 'string' ? shouldLinkExternally(href) : shouldLinkExternally(href.pathname);

  const isZoomTransitionConfigValid =
    process.env.EXPO_OS === 'ios' &&
    !isPreview &&
    !!isZoomTransitionEnabled() &&
    !!asChild &&
    !isExternalHref;

  const reason = useMemo(() => {
    if (process.env.EXPO_OS !== 'ios' || isPreview) {
      return undefined;
    }
    if (!isZoomTransitionEnabled()) {
      return 'Zoom transitions are not enabled.';
    }
    if (!asChild) {
      return 'Link must be used with `asChild` prop to enable zoom transitions.';
    }
    if (isExternalHref) {
      return 'Zoom transitions can only be used with internal links.';
    }
    return undefined;
  }, [asChild, isExternalHref]);

  const zoomTransitionId = useMemo(nanoid, []);

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

  const zoomTransitionSourceContextValue = useMemo<ZoomTransitionSourceContextValueType>(
    () => ({
      canAddSource: isZoomTransitionConfigValid,
      identifier: zoomTransitionId,
      addSource,
      removeSource,
      reason,
    }),
    [zoomTransitionId, addSource, removeSource, hasZoomSource, reason, isZoomTransitionConfigValid]
  );

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
