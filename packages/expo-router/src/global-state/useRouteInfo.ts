'use client';

import { use } from 'react';

import { usePreviewInfo } from '../link/preview/PreviewRouteContext';
import type { AbsolutePath } from '../types/paths';
import type { UrlObject } from './getRouteInfoFromState';
import { RouteInfoContext } from './routeInfoContext';

export function useRouteInfo(): UrlObject {
  const routeInfo = use(RouteInfoContext);
  const previewInfo = usePreviewInfo();
  if (previewInfo.isPreview) {
    // The preview pathname is the href being previewed, which callers pass in already resolved.
    const pathname = previewInfo.pathname as AbsolutePath;
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
