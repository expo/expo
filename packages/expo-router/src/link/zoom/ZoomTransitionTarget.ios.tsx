'use client';

import { use, useMemo, useState } from 'react';

import { DescriptorsContext } from '../../fork/native-stack/descriptors-context';
import {
  getInternalExpoRouterParams,
  INTERNAL_EXPO_ROUTER_IS_PREVIEW_NAVIGATION_PARAM_NAME,
  INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME,
  INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME,
} from '../../navigationParams';
import { ScreenPresentationContext } from '../../react-navigation/native-stack/utils/ScreenPresentationContext';
import { useWarnOnce } from '../../useDeprecated';
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

  return identifier;
}

export function ZoomTransitionTarget({ route, children }: ZoomTransitionTargetProps) {
  const isPreview = useIsPreview();
  const presentation = use(ScreenPresentationContext);
  const gestureEnabled = use(DescriptorsContext)[route.key]?.options?.gestureEnabled;
  const sourceIdentifier = getZoomTransitionSourceIdentifier(route, isPreview);
  const isUnsupportedPreview =
    !!sourceIdentifier &&
    !!getInternalExpoRouterParams(route.params)[
      INTERNAL_EXPO_ROUTER_IS_PREVIEW_NAVIGATION_PARAM_NAME
    ] &&
    !isModalPresentation({ presentation });
  useWarnOnce(
    '[expo-router] Zoom transition with link preview is only supported for screens presented modally. Please set the screen presentation to "fullScreenModal" or another modal presentation style.',
    isUnsupportedPreview
  );
  const identifier = isUnsupportedPreview ? null : sourceIdentifier;
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
