'use client';

import { nanoid } from 'nanoid/non-secure';
import React, { useMemo } from 'react';

import { INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME } from '../navigationParams';
import { isZoomTransitionEnabled } from './ZoomTransitionEnabler';
import { useIsPreview } from './preview/PreviewRouteContext';
import { LinkZoomTransitionSource } from './preview/native';
import { LinkProps } from './useLinkHooks';

const NOOP_COMPONENT = (props: { children: React.ReactNode }) => {
  return props.children;
};

export function useZoomTransitionPrimitives({
  unstable_transition,
  unstable_transitionAlignmentRect,
  href,
}: LinkProps) {
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
      <LinkZoomTransitionSource
        identifier={zoomTransitionId}
        alignment={unstable_transitionAlignmentRect}>
        {props.children}
      </LinkZoomTransitionSource>
    );
  }, [
    zoomTransitionId,
    unstable_transitionAlignmentRect?.x,
    unstable_transitionAlignmentRect?.y,
    unstable_transitionAlignmentRect?.width,
    unstable_transitionAlignmentRect?.height,
  ]);
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
