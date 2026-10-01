'use client';

import Constants from 'expo-constants';
import type { ComponentType } from 'react';
import { Fragment, use, useEffect, useMemo } from 'react';
import { Platform } from 'react-native';

import { findRouteNodeByName, type RouteNode } from '../Route';
import { INTERNAL_SLOT_NAME } from '../constants';
import type { ResultState } from '../fork/getStateFromPath';
import { routePatternToRegex } from '../fork/getStateFromPath-forks';
import type { ExpoLinkingOptions, LinkingConfigOptions } from '../getLinkingConfig';
import { getLinkingConfig } from '../getLinkingConfig';
import { parseRouteSegments } from '../getReactNavigationConfig';
import { getRoutes, type Options as GetRoutesOptions } from '../getRoutes';
import { isThenable } from '../getRoutesCore';
import type { RequireContext } from '../types';
import { getQualifiedRouteComponent } from '../useScreens';
import { cancelSplashScreenAnimationFrame } from '../utils/splash';
import { shouldLinkExternally } from '../utils/url';
import type { RouterConfig } from './routerConfigContext';
import type { StoreRedirects } from './types';

function getRootRouteNode(context: RequireContext, config: GetRoutesOptions | undefined) {
  return getRoutes(context, {
    ...config,
    skipGenerated: true,
    ignoreEntryPoints: true,
    platform: Platform.OS,
    preserveRedirectAndRewrites: true,
  });
}

/**
 * The layouts whose `unstable_settings` seed the initial navigation state: the root layout and
 * every layout on the focused path of `state`. Without a parsed state every layout can take part.
 */
export function getInitialLayoutNodes(
  rootRouteNode: RouteNode,
  state: ResultState | undefined
): RouteNode[] {
  if (!state) {
    return getAllLayoutNodes(rootRouteNode);
  }

  const layouts = [rootRouteNode];
  let node = rootRouteNode;
  let current: ResultState | undefined = state;

  while (current) {
    const route: ResultState['routes'][number] | undefined =
      current.routes[current.index ?? current.routes.length - 1];
    if (!route) {
      break;
    }
    // The parsed state wraps the app in the internal root slot, which maps to the root layout.
    if (route.name === INTERNAL_SLOT_NAME) {
      current = route.state;
      continue;
    }
    const child = findRouteNodeByName(node, route.name);
    if (!child) {
      break;
    }
    if (child.type === 'layout') {
      layouts.push(child);
    }
    node = child;
    current = route.state;
  }

  return layouts;
}

function getAllLayoutNodes(node: RouteNode, layouts: RouteNode[] = []): RouteNode[] {
  if (node.type === 'layout') {
    layouts.push(node);
    for (const child of node.children) {
      getAllLayoutNodes(child, layouts);
    }
  }
  return layouts;
}

const initialLayoutLoads = new WeakMap<RequireContext, Promise<unknown> | null>();

/**
 * Suspends until the layouts on the initial URL have loaded in the `lazy` import mode.
 *
 * `getRoutes` reads `unstable_settings` from the layouts that have loaded. Layouts that have not
 * loaded would lose their `anchor` from the route tree before `useLinking` seeds the initial
 * navigation state. Only the layouts on the initial URL are loaded here. Without a known URL,
 * which is the case on native, every layout is loaded.
 */
function useInitialLayoutModules(
  context: RequireContext,
  config: GetRoutesOptions | undefined,
  linkingConfigOptions: LinkingConfigOptions,
  serverUrl: string | undefined
) {
  // `use` must run on every render after the one that suspended, so the promise is kept per
  // context instead of in a hook. The route tree and the initial URL do not change for a context.
  let pending = initialLayoutLoads.get(context);
  if (pending === undefined) {
    pending = loadInitialLayoutModules(context, config, linkingConfigOptions, serverUrl);
    initialLayoutLoads.set(context, pending);
  }
  if (pending) {
    use(pending);
  }
}

function loadInitialLayoutModules(
  context: RequireContext,
  config: GetRoutesOptions | undefined,
  linkingConfigOptions: LinkingConfigOptions,
  serverUrl: string | undefined
): Promise<unknown> | null {
  if (process.env.EXPO_ROUTER_IMPORT_MODE !== 'lazy') {
    return null;
  }
  const rootRouteNode = getRootRouteNode(context, config);
  if (!rootRouteNode) {
    return null;
  }

  let state: ResultState | undefined;
  if (serverUrl !== undefined) {
    const linking = getLinkingConfig(rootRouteNode, context, {
      metaOnly: linkingConfigOptions.metaOnly,
      serverUrl,
      redirects: [],
      skipGenerated: config?.skipGenerated ?? false,
      sitemap: config?.sitemap ?? true,
      notFound: config?.notFound ?? true,
    });
    state = linking.getStateFromPath(serverUrl, linking.config);
  }

  const pending = getInitialLayoutNodes(rootRouteNode, state)
    .map((layout) => layout.loadRoute())
    .filter(isThenable);
  // A failed load is not an error here. The route tree is built without that layout's settings
  // and the failure surfaces when the layout renders, inside its parent's `ErrorBoundary`.
  return pending.length ? Promise.allSettled(pending) : null;
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
    const routeNode = getRootRouteNode(context, config);

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
