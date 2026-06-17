'use client';

import { useSyncExternalStore } from 'react';

import type { UrlObject } from './getRouteInfoFromState';
import { routeInfoSubscribe } from './routeInfoCache';
import { store } from './store';
import { usePreviewInfo } from '../link/preview/PreviewRouteContext';
import { isNewStateModelEnabled } from '../navigation-state/enable';
import { projectRouteInfo } from '../navigation-state/integrate';
import { useOptionalNavigationTree } from '../navigation-state/store';

export function useRouteInfo(): UrlObject {
  // Both hooks run unconditionally (the flag is constant per session): subscribe to the new tree
  // (null when off) AND the old store, then pick. `useOptionalNavigationTree` re-renders on commit.
  const newTree = useOptionalNavigationTree();
  const routeInfo = useSyncExternalStore(
    routeInfoSubscribe,
    store.getRouteInfo,
    store.getRouteInfo
  );
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
  if (isNewStateModelEnabled() && newTree) {
    return projectRouteInfo(newTree);
  }
  return routeInfo;
}
