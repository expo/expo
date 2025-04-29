import { getActionFromState, LinkingOptions } from '@react-navigation/native';
import { Platform } from 'expo-modules-core';

import { RouteNode } from './Route';
import { INTERNAL_SLOT_NAME } from './constants';
import { Options, State } from './fork/getPathFromState';
import { getReactNavigationConfig } from './getReactNavigationConfig';
import { applyRedirects } from './getRoutesRedirects';
import { UrlObject } from './global-state/routeInfo';
import type { StoreRedirects } from './global-state/router-store';
import { getInitialURL, getPathFromState, getStateFromPath, subscribe } from './link/linking';
import { NativeIntent, RequireContext } from './types';

export function getNavigationConfig(routes: RouteNode, metaOnly: boolean = true) {
  return {
    screens: {
      [INTERNAL_SLOT_NAME]: {
        path: '',
        ...getReactNavigationConfig(routes, metaOnly),
      },
    },
  };
}

export type ExpoLinkingOptions<T extends object = Record<string, unknown>> = LinkingOptions<T> & {
  getPathFromState: typeof getPathFromState;
  getStateFromPath: typeof getStateFromPath;
};

export type LinkingConfigOptions = {
  metaOnly?: boolean;
  serverUrl?: string;
  getInitialURL?: typeof getInitialURL;
  redirects?: StoreRedirects[];
};

export function getLinkingConfig(
  routes: RouteNode,
  context: RequireContext,
  getRouteInfo: () => UrlObject,
  { metaOnly = true, serverUrl, redirects }: LinkingConfigOptions = {}
): ExpoLinkingOptions {
  // Returning `undefined` / `null from `getInitialURL` are valid values, so we need to track if it's been called.
  let hasCachedInitialUrl = false;
  let initialUrl: ReturnType<typeof getInitialURL> | undefined;

  const nativeLinkingKey = context
    .keys()
    .find((key) => key.match(/^\.\/\+native-intent\.[tj]sx?$/));
  const nativeLinking: NativeIntent | undefined = nativeLinkingKey
    ? context(nativeLinkingKey)
    : undefined;

  const config = getNavigationConfig(routes, metaOnly);

  return {
    prefixes: [],
    config,
    // A custom getInitialURL is used on native to ensure the app always starts at
    // the root path if it's launched from something other than a deep link.
    // This helps keep the native functionality working like the web functionality.
    // For example, if you had a root navigator where the first screen was `/settings` and the second was `/index`
    // then `/index` would be used on web and `/settings` would be used on native.
    getInitialURL() {
      // Expo Router calls `getInitialURL` twice, which may confuse the user if they provide a custom `getInitialURL`.
      // Therefor we memoize the result.
      if (!hasCachedInitialUrl) {
        if (Platform.OS === 'web') {
          initialUrl = serverUrl ?? getInitialURL();
        } else {
          initialUrl = serverUrl ?? getInitialURL();

          if (typeof initialUrl === 'string') {
            initialUrl = applyRedirects(initialUrl, redirects);
            if (initialUrl && typeof nativeLinking?.redirectSystemPath === 'function') {
              initialUrl = nativeLinking.redirectSystemPath({ path: initialUrl, initial: true });
            }
          } else if (initialUrl) {
            initialUrl = initialUrl.then((url) => {
              url = applyRedirects(url, redirects);
              if (url && typeof nativeLinking?.redirectSystemPath === 'function') {
                return nativeLinking.redirectSystemPath({ path: url, initial: true });
              }
              return url;
            });
          }
        }
        hasCachedInitialUrl = true;
      }
      return initialUrl;
    },
    subscribe: subscribe(nativeLinking, redirects),
    getStateFromPath: <ParamList extends object>(path: string, options?: Options<ParamList>) => {
      return getStateFromPath(path, options, getRouteInfo().segments);
    },
    getPathFromState(state: State, options: Parameters<typeof getPathFromState>[1]) {
      return (
        getPathFromState(state, {
          ...config,
          ...options,
          screens: config.screens ?? options?.screens ?? {},
        }) ?? '/'
      );
    },
    // Add all functions to ensure the types never need to fallback.
    // This is a convenience for usage in the package.
    getActionFromState,
  };
}
