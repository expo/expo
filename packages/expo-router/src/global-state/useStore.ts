'use client';

import Constants from 'expo-constants';
import type { ComponentType } from 'react';
import { Fragment, use, useEffect, useMemo } from 'react';
import { Platform } from 'react-native';

import { routePatternToRegex } from '../fork/getStateFromPath-forks';
import type { ExpoLinkingOptions, LinkingConfigOptions } from '../getLinkingConfig';
import { getLinkingConfig } from '../getLinkingConfig';
import { parseRouteSegments } from '../getReactNavigationConfig';
import { getRoutes, type Options as GetRoutesOptions } from '../getRoutes';
import EXPO_ROUTER_IMPORT_MODE from '../import-mode';
import type { RequireContext } from '../types';
import { getQualifiedRouteComponent } from '../useScreens';
import { cancelSplashScreenAnimationFrame } from '../utils/splash';
import { shouldLinkExternally } from '../utils/url';
import {
  getAllLayoutNodes,
  getLayoutNodesForState,
  getPendingLayoutModules,
} from './initialLayoutModules';
import type { RouterConfig } from './routerConfigContext';
import type { StoreRedirects } from './types';

function getRoutesOptions(config: GetRoutesOptions | undefined): GetRoutesOptions {
  return {
    ...config,
    skipGenerated: true,
    ignoreEntryPoints: true,
    platform: Platform.OS,
    preserveRedirectAndRewrites: true,
    // Keep route loading in step with `useScreens`, which reads the same module.
    importMode: EXPO_ROUTER_IMPORT_MODE,
  };
}

/**
 * Suspends until the layout modules that seed the initial navigation state are loaded.
 *
 * `getRoutes` reads `unstable_settings` from each layout synchronously. In the `lazy` import mode
 * a layout whose split bundle has not been registered yet returns a promise instead, and its
 * `anchor` would be dropped from the route tree before `useLinking` seeds the initial state.
 * With a known initial URL only the layouts on that path are awaited. Without one, which is the
 * case on native where the initial URL resolves asynchronously, every layout is awaited.
 */
function useInitialLayoutModules(
  context: RequireContext,
  config: GetRoutesOptions | undefined,
  linkingConfigOptions: LinkingConfigOptions,
  serverUrl: string | undefined
) {
  // `use` must run in every render after the one that suspended, so the thenable is kept per
  // context instead of in a hook. The route tree and the initial URL do not change for a context.
  let pending = initialLayoutLoads.get(context);
  if (pending === undefined) {
    pending = getInitialLayoutLoad(context, config, linkingConfigOptions, serverUrl);
    initialLayoutLoads.set(context, pending);
  }
  if (pending) {
    use(pending);
  }
}

const initialLayoutLoads = new WeakMap<RequireContext, Promise<unknown> | null>();

function getInitialLayoutLoad(
  context: RequireContext,
  config: GetRoutesOptions | undefined,
  linkingConfigOptions: LinkingConfigOptions,
  serverUrl: string | undefined
): Promise<unknown> | null {
  if (EXPO_ROUTER_IMPORT_MODE !== 'lazy') {
    return null;
  }
  const routeNode = getRoutes(context, getRoutesOptions(config));
  if (!routeNode) {
    return null;
  }

  let layouts;
  if (serverUrl === undefined) {
    layouts = getAllLayoutNodes(routeNode);
  } else {
    const linking = getLinkingConfig(routeNode, context, {
      metaOnly: linkingConfigOptions.metaOnly,
      serverUrl,
      redirects: [],
      skipGenerated: config?.skipGenerated ?? false,
      sitemap: config?.sitemap ?? true,
      notFound: config?.notFound ?? true,
    });
    layouts = getLayoutNodesForState(
      routeNode,
      linking.getStateFromPath(serverUrl, linking.config)
    );
  }

  const modules = getPendingLayoutModules(layouts);
  // A failed load is not an error here. The route tree is built without that layout's settings
  // and the failure surfaces when the layout renders, inside its parent's `ErrorBoundary`.
  return modules.length ? Promise.allSettled(modules) : null;
}

// TODO(@ubax): rename this file to useRouterConfig.ts
export function useRouterConfig(
  context: RequireContext,
  linkingConfigOptions: LinkingConfigOptions,
  serverUrl?: string
): { routerConfig: RouterConfig; rootComponent: ComponentType<any> } {
  const config = Constants.expoConfig?.extra?.router;
  useInitialLayoutModules(context, config, linkingConfigOptions, serverUrl);
  const configValue = useMemo(() => {
    let linking: ExpoLinkingOptions | undefined;
    let rootComponent: ComponentType<any> = Fragment;
    const routeNode = getRoutes(context, getRoutesOptions(config));

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

    return { routerConfig: { linking, redirects, routeNode }, rootComponent };
  }, [config, context, linkingConfigOptions, serverUrl]);

  useEffect(() => {
    return cancelSplashScreenAnimationFrame;
  }, []);

  return configValue;
}
