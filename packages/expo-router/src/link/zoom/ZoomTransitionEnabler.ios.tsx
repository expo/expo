import { use, useLayoutEffect } from 'react';

import type { ZoomTransitionEnablerProps } from './ZoomTransitionEnabler.types';
import { ZoomTransitionTargetContext } from './zoom-transition-context';
import { DescriptorsContext } from '../../fork/native-stack/descriptors-context';
import {
  getInternalExpoRouterParams,
  INTERNAL_EXPO_ROUTER_IS_PREVIEW_NAVIGATION_PARAM_NAME,
  INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME,
  INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME,
} from '../../navigationParams';
import { isModalPresentation } from '../../utils/stackPresentation';
import { useIsPreview } from '../preview/PreviewRouteContext';
import { LinkZoomTransitionEnabler } from '../preview/native';

let _isZoomTransitionEnabled = process.env.EXPO_OS === 'ios';

export function disableZoomTransition() {
  _isZoomTransitionEnabled = false;
}

export function isZoomTransitionEnabled() {
  return _isZoomTransitionEnabled;
}

export function ZoomTransitionEnabler({ route }: ZoomTransitionEnablerProps) {
  const shouldEnableZoomTransition = useShouldEnableZoomTransition(route);
  const targetContext = use(ZoomTransitionTargetContext);
  useLayoutEffect(() => {
    if (shouldEnableZoomTransition && targetContext?.addEnabler && targetContext?.removeEnabler) {
      targetContext.addEnabler();
      return () => {
        targetContext.removeEnabler();
      };
    }
    return () => {};
  }, [shouldEnableZoomTransition]);
  if (shouldEnableZoomTransition) {
    const params = route.params;
    const zoomTransitionId = params[INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME];

    // Read dismissalBoundsRect from context (set by usePreventZoomTransitionDismissal hook)
    const dismissalBoundsRect = targetContext.dismissalBoundsRect;

    // Read gestureEnabled from the screen descriptor so that gestureEnabled: false
    // automatically blocks the native zoom transition dismissal gesture,
    // even when the user hasn't called usePreventZoomTransitionDismissal().
    const descriptorsMap = use(DescriptorsContext);
    const gestureEnabled = descriptorsMap[route.key]?.options?.gestureEnabled;
    const effectiveDismissalBoundsRect =
      dismissalBoundsRect ?? (gestureEnabled === false ? { maxX: 0, maxY: 0 } : null);

    return (
      <LinkZoomTransitionEnabler
        zoomTransitionSourceIdentifier={zoomTransitionId}
        dismissalBoundsRect={effectiveDismissalBoundsRect}
      />
    );
  }
  return null;
}

/**
 * @internal
 */
export function useShouldEnableZoomTransition(route: unknown): route is {
  key: string;
  params: {
    [INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME]: string;
    [INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME]: string;
  };
} {
  const isPreview = useIsPreview();
  if (
    isZoomTransitionEnabled() &&
    !isPreview &&
    route &&
    typeof route === 'object' &&
    'params' in route &&
    typeof route.params === 'object' &&
    route.params &&
    'key' in route &&
    typeof route.key === 'string'
  ) {
    const params = route.params;
    const internalParams = getInternalExpoRouterParams(params);
    const zoomTransitionId =
      internalParams[INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME];
    const zoomTransitionScreenId =
      internalParams[INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME];
    const hasZoomTransition = !!zoomTransitionId && zoomTransitionScreenId === route.key;
    if (hasZoomTransition && typeof zoomTransitionId === 'string') {
      // Read gestureEnabled from the screen descriptor so that gestureEnabled: false
      // automatically blocks the native zoom transition dismissal gesture,
      // even when the user hasn't called usePreventZoomTransitionDismissal().
      const descriptorsMap = use(DescriptorsContext);

      const isLinkPreviewNavigation =
        !!internalParams[INTERNAL_EXPO_ROUTER_IS_PREVIEW_NAVIGATION_PARAM_NAME];
      const isPresentedAsModal = isModalPresentation(descriptorsMap[route.key]?.options);
      if (isLinkPreviewNavigation && !isPresentedAsModal) {
        console.warn(
          '[expo-router] Zoom transition with link preview is only supported for screens presented modally. Please set the screen presentation to "fullScreenModal" or another modal presentation style.'
        );
      } else {
        return true;
      }
    }
  }
  return false;
}
