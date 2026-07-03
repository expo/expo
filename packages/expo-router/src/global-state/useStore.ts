'use client';

import Constants from 'expo-constants';
import type { ComponentType } from 'react';
import { Fragment, useEffect, useRef, useState } from 'react';
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
import {
  store,
  storeRef,
  getSplashScreenAnimationFrame,
  setSplashScreenAnimationFrame,
} from './store';
import type { ReactNavigationState, StoreRedirects } from './types';

export function useStore(
  context: RequireContext,
  linkingConfigOptions: LinkingConfigOptions,
  serverUrl?: string
) {
  const navigationRef = useNavigationContainerRef();
  const config = Constants.expoConfig?.extra?.router;

  // `getInitialURL()` may return a promise (async `+native-intent` redirect, or Android's
  // `Linking.getInitialURL()` race). We can't compile the seed synchronously in that case, so we
  // subscribe to the promise and re-render once it resolves, then compile from the resolved URL.
  const initialURLSubscribed = useRef(false);
  const [resolvedInitialURL, setResolvedInitialURL] = useState<
    { url: string | null | undefined } | undefined
  >(undefined);

  let linking: ExpoLinkingOptions | undefined;
  let rootComponent: ComponentType<any> = Fragment;
  let initialState: ReactNavigationState | undefined;
  let hasPendingInitialURL = false;

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
    linking = getLinkingConfig(routeNode, context, () => store.getRouteInfo(), {
      metaOnly: linkingConfigOptions.metaOnly,
      serverUrl,
      redirects,
      skipGenerated: config?.skipGenerated ?? false,
      sitemap: config?.sitemap ?? true,
      notFound: config?.notFound ?? true,
    });
    rootComponent = getQualifiedRouteComponent(routeNode);

    // Compile the seed state (and its cached route info) from a URL. This is the synchronous path
    // that static rendering (single pass) relies on. The seed is raw compiled state: its state keys
    // are the deterministic `navigator*` ones, not the live-minted `stack-<nanoid>` keys, until the
    // first `onStateChange` reconciles it.
    const seedFromURL = (url: string) => {
      let initialPath = extractExpoPathFromURL(linking!.prefixes, url);
      // It does not matter if the path starts with a `/` or not, but this keeps the behavior consistent
      if (!initialPath.startsWith('/')) initialPath = '/' + initialPath;
      initialState = linking!.getStateFromPath(initialPath, linking!.config);
      const initialRouteInfo = getRouteInfoFromState(initialState);
      setCachedRouteInfo(initialState as any, initialRouteInfo);
    };

    // By default React Navigation is async and does not render anything in the first pass as it waits for `getInitialURL`
    // This will cause static rendering to fail, which once performs a single pass.
    // If the initialURL is a string, we can prefetch the state and routeInfo, skipping React Navigation's async behavior.
    const initialURL = linking?.getInitialURL?.();
    if (typeof initialURL === 'string') {
      seedFromURL(initialURL);
    } else if (initialURL) {
      // A promise: the initial URL resolves asynchronously.
      if (resolvedInitialURL) {
        // Resolved on a previous render — compile synchronously from its value, exactly like the
        // string case. A null/undefined URL means no seed (navigators fall back to their initial state).
        if (typeof resolvedInitialURL.url === 'string') {
          seedFromURL(resolvedInitialURL.url);
        }
      } else {
        // Still pending: nothing to seed yet, so the container must not mount. `getInitialURL()`
        // returns a fresh promise every render, so only ever subscribe to the first one. (Attaching
        // `.then` during render is safe only because the ref guard survives replays.) A rejection
        // (e.g. a throwing async `redirectSystemPath`) must still unblock rendering — fall back to
        // no seed instead of hanging on a blank screen forever.
        hasPendingInitialURL = true;
        if (!initialURLSubscribed.current) {
          initialURLSubscribed.current = true;
          Promise.resolve(initialURL).then(
            (url) => setResolvedInitialURL({ url }),
            (error) => {
              console.error(
                `Expo Router couldn't resolve the initial URL because 'getInitialURL' (or an async ` +
                  `'redirectSystemPath' in +native-intent) rejected, so the app starts at its ` +
                  `default route instead of the deep link. Fix the rejection to restore deep ` +
                  `linking. Rejection:`,
                error
              );
              setResolvedInitialURL({ url: null });
            }
          );
        }
      }
    }
  } else {
    // Only error in production, in development we will show the onboarding screen
    if (process.env.NODE_ENV === 'production') {
      throw new Error('No routes found');
    }

    // In development, we will show the onboarding screen
    rootComponent = Fragment;
  }

  storeRef.current = {
    navigationRef,
    routeNode,
    config,
    rootComponent,
    linking,
    redirects,
    state: initialState,
    hasPendingInitialURL,
  };

  if (initialState) {
    storeRef.current.routeInfo = getCachedRouteInfo(initialState);
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

  return store;
}
