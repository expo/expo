'use client';

import { nanoid } from 'nanoid/non-secure';
import React, { useMemo } from 'react';

import { INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME } from '../navigationParams';
import { isZoomTransitionEnabled } from './ZoomTransitionEnabler';
import { useIsPreview } from './preview/PreviewRouteContext';
import { LinkProps } from './useLinkHooks';
import { ZoomTransitionSourceContext } from './zoom/zoom-transition-context';

const NOOP_COMPONENT = (props: { children: React.ReactNode }) => {
  return props.children;
};

export function useZoomTransitionPrimitives({ unstable_transition, href }: LinkProps) {
  const isPreview = useIsPreview();
  const zoomTransitionId = useMemo(
    () =>
      unstable_transition === 'zoom' &&
      !isPreview &&
      process.env.EXPO_OS === 'ios' &&
      isZoomTransitionEnabled()
        ? nanoid()
        : undefined,
    []
  );
  const ZoomTransitionWrapper = useMemo(() => {
    if (!zoomTransitionId) {
      return NOOP_COMPONENT;
    }
    return (props: { children: React.ReactNode }) => (
      <ZoomTransitionSourceContext value={{ identifier: zoomTransitionId }}>
        {props.children}
      </ZoomTransitionSourceContext>
    );
  }, [zoomTransitionId]);
  const computedHref = useMemo(() => {
    if (!zoomTransitionId) {
      return href;
    }
    if (typeof href === 'string') {
      return {
        pathname: href,
        params: {
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
  }, [href, zoomTransitionId]);
  return { ZoomTransitionWrapper, href: computedHref };
}
