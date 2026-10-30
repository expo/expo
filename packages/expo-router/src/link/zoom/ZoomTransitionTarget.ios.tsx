'use client';

import { useMemo, useState } from 'react';

import {
  getInternalExpoRouterParams,
  INTERNAL_EXPO_ROUTER_IS_PREVIEW_NAVIGATION_PARAM_NAME,
  INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME,
  INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME,
} from '../../navigationParams';
import { isModalPresentation } from '../../utils/stackPresentation';
import { useIsPreview } from '../preview/PreviewRouteContext';
import { LinkZoomTransitionEnabler } from '../preview/native';
import type { ZoomTransitionTargetProps } from './ZoomTransitionTarget.types';
import {
  ZoomTransitionTargetContext,
  type DismissalBoundsRect,
  type ZoomTransitionTargetContextValueType,
} from './zoom-transition-context';
import { isZoomTransitionEnabled } from './zoom-transition-enabled';

function getZoomTransitionSourceIdentifier(
  route: ZoomTransitionTargetProps['route'],
  presentation: ZoomTransitionTargetProps['presentation'],
  isPreview: boolean
): string | null {
  if (!isZoomTransitionEnabled() || isPreview) {
    return null;
  }

  const params = getInternalExpoRouterParams(route.params);
  const identifier = params[INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME];
  if (
    typeof identifier !== 'string' ||
    !identifier ||
    params[INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME] !== route.key
  ) {
    return null;
  }

  if (
    params[INTERNAL_EXPO_ROUTER_IS_PREVIEW_NAVIGATION_PARAM_NAME] &&
    !isModalPresentation({ presentation })
  ) {
    console.warn(
      '[expo-router] Zoom transition with link preview is only supported for screens presented modally. Please set the screen presentation to "fullScreenModal" or another modal presentation style.'
    );
    return null;
  }

  return identifier;
}

export function ZoomTransitionTarget({
  route,
  presentation,
  gestureEnabled,
  children,
}: ZoomTransitionTargetProps) {
  const isPreview = useIsPreview();
  const identifier = getZoomTransitionSourceIdentifier(route, presentation, isPreview);
  const [dismissalBoundsRect, setDismissalBoundsRect] = useState<DismissalBoundsRect | null>(null);
  const value = useMemo<ZoomTransitionTargetContextValueType>(
    () => ({ identifier, gestureEnabled, setDismissalBoundsRect }),
    [identifier, gestureEnabled]
  );

  return (
    <ZoomTransitionTargetContext value={value}>
      {identifier && (
        <LinkZoomTransitionEnabler
          zoomTransitionSourceIdentifier={identifier}
          dismissalBoundsRect={
            dismissalBoundsRect ?? (gestureEnabled === false ? { maxX: 0, maxY: 0 } : null)
          }
        />
      )}
      {children}
    </ZoomTransitionTargetContext>
  );
}
