'use client';

import { use } from 'react';

import { usePreviewInfo } from '../link/preview/PreviewRouteContext';
import type { UrlObject } from './getRouteInfoFromState';
import { RouteInfoContext } from './routeInfoContext';

export function useRouteInfo(): UrlObject {
  const routeInfo = use(RouteInfoContext);
  const { isPreview, segments, params, pathname } = usePreviewInfo();
  if (isPreview) {
    return {
      pathname: pathname ?? '',
      segments: segments ?? [],
      unstable_globalHref: '',
      params: params ?? {},
      searchParams: new URLSearchParams(),
      pathnameWithParams: pathname ?? '',
      isIndex: false,
    };
  }
  return routeInfo;
}
