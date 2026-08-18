'use client';

import Constants from 'expo-constants';
import type { ComponentType } from 'react';
import { Fragment, useEffect, useMemo } from 'react';
import { Platform } from 'react-native';

import { extractExpoPathFromURL } from '../fork/extractPathFromURL';
import { routePatternToRegex } from '../fork/getStateFromPath-forks';
import type { ExpoLinkingOptions, LinkingConfigOptions } from '../getLinkingConfig';
import { getLinkingConfig } from '../getLinkingConfig';
import { parseRouteSegments } from '../getReactNavigationConfig';
import { getRoutes } from '../getRoutes';
import { useNavigationContainerRef } from '../react-navigation/native';
import type { RequireContext } from '../types';
import { getQualifiedRouteComponent } from '../useScreens';
import { shouldLinkExternally } from '../utils/url';
import { getRouteInfoFromState } from './getRouteInfoFromState';
import { getCachedRouteInfo, setCachedRouteInfo } from './routeInfoCache';
import { storeRef, getSplashScreenAnimationFrame, setSplashScreenAnimationFrame } from './store';
import type { StoreContextValue } from './storeContext';
import type { ReactNavigationState, StoreRedirects } from './types';

export function useStore(
  context: RequireContext,
  linkingConfigOptions: LinkingConfigOptions,
  serverUrl?: string
): StoreContextValue {
  const navigationRef = useNavigationContainerRef();
  const config = Constants.expoConfig?.extra?.router;
  const storeValue = useMemo(() => {
    let linking: ExpoLinkingOptions | undefined;
    let rootComponent: ComponentType<any> = Fragment;
    let initialState: ReactNavigationState | undefined;
    const routeNode = getRoutes(context, {
      ...config,
      skipGenerated: true,
      ignoreEntryPoints: true,
      platform: Platform.OS,
      preserveRedirectAndRewrites: true,
    });

    const redirects: StoreRedirects[] = [config?.redirects, config?.rewrites]
      .filter(Boolean)
      .flat()
      .map((route) => {
        return [
          routePatternToRegex(parseRouteSegments(route.source)),
          route,
          shouldLinkExternally(route.destination),
        ];
      });

    if (routeNode) {
      // We have routes, so get the linking config and the root component
      linking = getLinkingConfig(routeNode, context, {
        metaOnly: linkingConfigOptions.metaOnly,
        serverUrl,
        redirects,
        skipGenerated: config?.skipGenerated ?? false,
        sitemap: config?.sitemap ?? true,
        notFound: config?.notFound ?? true,
      });
      rootComponent = getQualifiedRouteComponent(routeNode);

      // Prefetch synchronous state and route info for consumers that run before the container mounts.
      // The container derives its own initial state from linking.
      const initialURL = linking?.getInitialURL?.();
      if (typeof initialURL === 'string') {
        let initialPath = extractExpoPathFromURL(linking.prefixes, initialURL);

        // It does not matter if the path starts with a `/` or not, but this keeps the behavior consistent
        if (!initialPath.startsWith('/')) initialPath = '/' + initialPath;

        initialState = linking.getStateFromPath!(initialPath, linking.config);
        const initialRouteInfo = getRouteInfoFromState(initialState);
        setCachedRouteInfo(initialState as any, initialRouteInfo);
      }
    } else {
      // Only error in production, in development we will show the onboarding screen
      if (process.env.NODE_ENV === 'production') {
        throw new Error('No routes found');
      }

      // In development, we will show the onboarding screen
      rootComponent = Fragment;
    }

    return {
      navigationRef,
      linking,
      initialState,
      rootComponent,
      redirects,
      routeNode,
    };
  }, [config, context, linkingConfigOptions, navigationRef, serverUrl]);

  // TODO(@ubax): Check whether updating the store ref during every render is safe and needed.
  storeRef.current = {
    navigationRef,
    routeNode: storeValue.routeNode,
    config,
    linking: storeValue.linking,
    state: storeValue.initialState,
  };

  if (storeValue.initialState) {
    storeRef.current.routeInfo = getCachedRouteInfo(storeValue.initialState);
  }

  useEffect(() => {
    return () => {
      // listener();

      const animationFrame = getSplashScreenAnimationFrame();
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        setSplashScreenAnimationFrame(undefined);
      }
    };
  });

  return storeValue;
}
