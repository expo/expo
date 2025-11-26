import {
  getInternalExpoRouterParams,
  INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME,
  INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME,
} from '../navigationParams';
import type { ZoomTransitionEnablerProps } from './ZoomTransitionEnabler.types';
import { useIsPreview } from './preview/PreviewRouteContext';
import { LinkZoomTransitionEnabler } from './preview/native';

let _isZoomTransitionEnabled = false;

export function enableZoomTransition() {
  console.warn('[expo-router] Zoom transition is an experimental feature. Use at your own risk.');
  _isZoomTransitionEnabled = true;
}

export function isZoomTransitionEnabled() {
  return _isZoomTransitionEnabled;
}

export function ZoomTransitionEnabler({ route }: ZoomTransitionEnablerProps) {
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
      return <LinkZoomTransitionEnabler zoomTransitionSourceIdentifier={zoomTransitionId} />;
    }
  }
  return null;
}
