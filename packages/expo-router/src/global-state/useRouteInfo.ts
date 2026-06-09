'use client';

import { useEffect, useReducer, useRef } from 'react';

import type { UrlObject } from './getRouteInfoFromState';
import { routeInfoSubscribe } from './routeInfoCache';
import { store } from './store';
import { usePreviewInfo } from '../link/preview/PreviewRouteContext';

export function useRouteInfo(): UrlObject {
  // Route info is a derived projection of the navigation tree, finalized after each commit with the
  // leaf-accurate focused params (via setFocusedState). Read it during render and force a re-render
  // only when it actually changed since the last render — `getCachedRouteInfo` returns
  // referentially-stable values, so this gives uSES-like snapshot-equality bail-out and
  // render-once-per-navigation, without the `useSyncExternalStore` API.
  //
  // NOTE: this is an APPROXIMATION of uSES, not an equivalent. It reads a mutable external during
  // render, so it forgoes uSES's mid-render tearing protection — acceptable today because navigation
  // is not yet wrapped in startTransition, but a real gap to revisit when it is (see RouteInfoContext
  // follow-up). The mount-time re-check below closes the render→subscribe gap (cf. imperative-api).
  const routeInfo = store.getRouteInfo();
  const lastRouteInfoRef = useRef(routeInfo);
  lastRouteInfoRef.current = routeInfo;

  const [, forceUpdate] = useReducer((count: number) => count + 1, 0);
  useEffect(() => {
    const checkForChange = () => {
      if (store.getRouteInfo() !== lastRouteInfoRef.current) {
        forceUpdate();
      }
    };
    const unsubscribe = routeInfoSubscribe(checkForChange);
    // Safety net: catch a change that landed between the render-phase read and this subscribe
    // (cold-start navigation, StrictMode resubscribe gap) so the update isn't missed.
    checkForChange();
    return unsubscribe;
  }, []);

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
