'use client';

import { use } from 'react';

import { usePreviewInfo } from '../link/preview/PreviewRouteContext';
import type { UrlObject } from './getRouteInfoFromState';
import { RouteInfoContext } from './routeInfoContext';

export function useRouteInfo(): UrlObject {
  const routeInfo = use(RouteInfoContext);
  const previewInfo = usePreviewInfo();
  if (previewInfo.isPreview) {
    const pathname = previewInfo.pathname;
    return {
      pathname,
      segments: previewInfo.segments,
      unstable_globalHref: '',
      params: previewInfo.params,
      searchParams: new URLSearchParams(),
      pathnameWithParams: pathname,
      isIndex: false,
    };
  }
  return routeInfo;
}
