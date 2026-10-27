'use client';

import { use, useCallback, useId, useMemo, useRef, useState } from 'react';

import { DescriptorsContext } from '../../fork/native-stack/descriptors-context';
import { isModalPresentation } from '../../utils/stackPresentation';
import { shouldLinkExternally } from '../../utils/url';
import { useIsPreview } from '../preview/PreviewRouteContext';
import { isZoomTransitionEnabled } from './ZoomTransitionEnabler';
import {
  getZoomTransitionTarget,
  ZoomTransitionSourceContext,
  ZoomTransitionTargetContext,
  type ZoomTransitionSourceContextValueType,
  type DismissalBoundsRect,
} from './zoom-transition-context';
import type {
  ZoomTransitionSourceContextProviderProps,
  ZoomTransitionTargetContextProviderProps,
} from './zoom-transition-context-providers.types';

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

export function ZoomTransitionTargetContextProvider({
  route,
  children,
}: ZoomTransitionTargetContextProviderProps) {
  const [dismissalBoundsRect, setDismissalBoundsRect] = useState<DismissalBoundsRect | null>(null);
  // TODO(@ubax): Move this logic to within NativeStackView
  // https://linear.app/expo/issue/ENG-19580/remove-hasenabler-logic-from-zoomtransitiontargetcontext
  // This is a temporary solution to detect if zoom transition was enabled for the screen
  // In theory we could do all the checks here and only mount the enabler when all conditions are met
  const [numberOfEnablers, setNumberOfEnablers] = useState(0);
  const addEnabler = useCallback(() => setNumberOfEnablers((prev) => prev + 1), []);
  const removeEnabler = useCallback(() => setNumberOfEnablers((prev) => prev - 1), []);
  const hasEnabler = numberOfEnablers > 0;
  const isPreview = useIsPreview();
  const target = isZoomTransitionEnabled() && !isPreview ? getZoomTransitionTarget(route) : null;
  // Only this route's values go into the memoized context value. So an options change on any
  // route re-renders this provider, but not the screen that reads the context.
  const routeOptions = target ? use(DescriptorsContext)[target.routeKey]?.options : undefined;
  const gestureEnabled = routeOptions?.gestureEnabled;
  const isModal = isModalPresentation(routeOptions);
  const identifier = target?.identifier;
  const value = useMemo(
    () => ({
      identifier: identifier ?? null,
      dismissalBoundsRect,
      setDismissalBoundsRect,
      addEnabler,
      removeEnabler,
      hasEnabler,
      gestureEnabled,
      isModal,
    }),
    [
      identifier,
      dismissalBoundsRect,
      addEnabler,
      removeEnabler,
      hasEnabler,
      gestureEnabled,
      isModal,
    ]
  );
  if (target) {
    return <ZoomTransitionTargetContext value={value}>{children}</ZoomTransitionTargetContext>;
  }
  return children;
}
