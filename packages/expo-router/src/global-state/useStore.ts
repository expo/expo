'use client';

import Constants from 'expo-constants';
import type { ComponentType } from 'react';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import type { RouteNode } from '../Route';
import { extractExpoPathFromURL } from '../fork/extractPathFromURL';
import { routePatternToRegex } from '../fork/getStateFromPath-forks';
import type { ExpoLinkingOptions, LinkingConfigOptions } from '../getLinkingConfig';
import { getLinkingConfig } from '../getLinkingConfig';
import { parseRouteSegments } from '../getReactNavigationConfig';
import { getRoutes } from '../getRoutes';
import { type NavigationState, useNavigationContainerRef } from '../react-navigation/native';
import type { RequireContext } from '../types';
import { getQualifiedRouteComponent } from '../useScreens';
import { shouldLinkExternally } from '../utils/url';
import { createSeededRootState } from './createSeededNavigationState';
import { storeRef, getSplashScreenAnimationFrame, setSplashScreenAnimationFrame } from './store';
import type { StoreContextValue } from './storeContext';
import type { StoreRedirects } from './types';

export function useStore(
  context: RequireContext,
  linkingConfigOptions: LinkingConfigOptions,
  serverUrl?: string
): StoreContextValue {
  const navigationRef = useNavigationContainerRef();
  const config = Constants.expoConfig?.extra?.router;
  const configValue = useMemo(() => {
    let linking: ExpoLinkingOptions | undefined;
    let rootComponent: ComponentType<any> = Fragment;
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
    } else {
      // Only error in production, in development we will show the onboarding screen
      if (process.env.NODE_ENV === 'production') {
        throw new Error('No routes found');
      }

      // In development, we will show the onboarding screen
      rootComponent = Fragment;
    }

    return { linking, rootComponent, redirects, routeNode };
  }, [config, context, linkingConfigOptions, serverUrl]);

  const { linking, rootComponent, redirects, routeNode } = configValue;

  // One object per mount: identity marks store ownership, and state is seeded once from the URL
  // (or left undefined when the URL is asynchronous).
  const [owner] = useState(() => ({ state: seedInitialState(linking, routeNode) }));
  const isFirstRender = storeRef.current.owner !== owner;
  const state = isFirstRender ? owner.state : storeRef.current.state;

  // TODO: Move this assignment to an effect or remove the global store ref entirely.
  storeRef.current = {
    owner,
    navigationRef,
    routeNode,
    linking,
    redirects,
    state,
  };

  const storeValue = useMemo(
    () => ({
      navigationRef,
      linking,
      get state() {
        return storeRef.current.state;
      },
      rootComponent,
      redirects,
      routeNode,
    }),
    [navigationRef, linking, rootComponent, redirects, routeNode]
  );

  useEffect(() => {
    return () => {
      const animationFrame = getSplashScreenAnimationFrame();
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        setSplashScreenAnimationFrame(undefined);
      }
    };
  });

  return storeValue;
}

function seedInitialState(
  linking: ExpoLinkingOptions | undefined,
  routeNode: RouteNode | null
): NavigationState | undefined {
  // Static rendering only gets one pass, so synchronously available URLs are seeded immediately.
  if (!linking || !routeNode) {
    return undefined;
  }

  const initialURL = linking.getInitialURL?.();
  if (typeof initialURL !== 'string') {
    return undefined;
  }

  let initialPath = extractExpoPathFromURL(linking.prefixes, initialURL);
  // It does not matter if the path starts with a `/`, but this keeps parsing consistent.
  if (!initialPath.startsWith('/')) initialPath = '/' + initialPath;

  return createSeededRootState(linking.getStateFromPath!(initialPath, linking.config), routeNode);
}
