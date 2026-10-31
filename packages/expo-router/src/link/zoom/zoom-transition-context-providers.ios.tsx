'use client';

import { useCallback, useId, useMemo, useRef, useState } from 'react';

import { shouldLinkExternally } from '../../utils/url';
import {
  ZoomTransitionSourceContext,
  type ZoomTransitionSourceContextValueType,
} from './zoom-transition-context';
import type { ZoomTransitionSourceContextProviderProps } from './zoom-transition-context-providers.types';
import { isZoomTransitionEnabled } from './zoom-transition-enabled';

export function ZoomTransitionSourceContextProvider({
  children,
  linkProps,
}: ZoomTransitionSourceContextProviderProps) {
  const { href, asChild } = linkProps;
  const isExternalHref =
    typeof href === 'string' ? shouldLinkExternally(href) : shouldLinkExternally(href.pathname);
  const numberOfSources = useRef(0);
  const [hasZoomSource, setHasZoomSource] = useState(false);

  const zoomTransitionId = useId();

  const addSource = useCallback(() => {
    if (!isZoomTransitionEnabled()) {
      throw new Error('[expo-router] Zoom transitions are not enabled.');
    }
    if (numberOfSources.current >= 1) {
      throw new Error(
        '[expo-router] Only one Link.ZoomTransitionSource can be used within a single Link component.'
      );
    }
    if (!asChild) {
      throw new Error(
        '[expo-router] Link must be used with `asChild` prop to enable zoom transitions.'
      );
    }
    if (isExternalHref) {
      throw new Error('[expo-router] Zoom transitions can only be used with internal links.');
    }
    numberOfSources.current += 1;
    setHasZoomSource(true);
  }, [asChild, isExternalHref]);

  const removeSource = useCallback(() => {
    numberOfSources.current -= 1;
    if (numberOfSources.current <= 0) {
      setHasZoomSource(false);
    }
  }, []);

  const value = useMemo<ZoomTransitionSourceContextValueType>(
    () => ({
      identifier: zoomTransitionId,
      hasZoomSource,
      addSource,
      removeSource,
    }),
    [zoomTransitionId, hasZoomSource, addSource, removeSource]
  );

  return <ZoomTransitionSourceContext value={value}>{children}</ZoomTransitionSourceContext>;
}
