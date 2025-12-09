'use client';

import { createContext, type PropsWithChildren } from 'react';

import { isZoomTransitionEnabled } from './ZoomTransitionEnabler.ios';
import {
  getInternalExpoRouterParams,
  INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SCREEN_ID_PARAM_NAME,
  INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME,
} from '../../navigationParams';
import { useIsPreview } from '../preview/PreviewRouteContext';

export type ZoomTransitionSourceContextValueType =
  | {
      canAddSource: boolean;
      identifier: string;
      addSource: () => void;
      removeSource: () => void;
      reason: string | undefined;
    }
  | undefined;

export const ZoomTransitionSourceContext =
  createContext<ZoomTransitionSourceContextValueType>(undefined);

export const ZoomTransitionTargetContext = createContext<{ identifier: string | null }>({
  identifier: null,
});

export function ZoomTransitionTargetContextProvider({
  route,
  children,
}: PropsWithChildren<{ route: unknown }>) {
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
        <ZoomTransitionTargetContext value={{ identifier: zoomTransitionId }}>
          {children}
        </ZoomTransitionTargetContext>
      );
    }
  }
  return children;
}
