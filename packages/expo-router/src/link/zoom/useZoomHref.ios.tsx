'use client';

import { use, useMemo } from 'react';

import { ZoomTransitionSourceContext } from './zoom-transition-context';
import { INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME } from '../../navigationParams';
import { parseUrlUsingCustomBase } from '../../utils/url';
import type { LinkProps } from '../useLinkHooks';

export function useZoomHref({ href }: LinkProps) {
  const value = use(ZoomTransitionSourceContext);
  if (!value) {
    throw new Error(
      '[expo-router] useZoomHref must be used within a ZoomTransitionSourceContextProvider. This is most likely a bug in expo-router.'
    );
  }
  const { hasZoomSource, identifier } = value;
  return useMemo(() => {
    if (!hasZoomSource) {
      return href;
    }
    if (typeof href === 'string') {
      const { pathname, searchParams } = parseUrlUsingCustomBase(href);
      return {
        pathname,
        params: {
          ...Object.fromEntries(searchParams.entries()),
          [INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME]: identifier,
        },
      };
    }
    return {
      pathname: href.pathname,
      params: {
        ...(href.params ?? {}),
        [INTERNAL_EXPO_ROUTER_ZOOM_TRANSITION_SOURCE_ID_PARAM_NAME]: identifier,
      },
    };
  }, [href, identifier, hasZoomSource]);
}
