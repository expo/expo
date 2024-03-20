import { getActionFromState, LinkingOptions } from '@react-navigation/native';

import { RouteNode } from './Route';
import { State } from './fork/getPathFromState';
import { getReactNavigationConfig } from './getReactNavigationConfig';
import {
  addEventListener,
  getInitialURL,
  getPathFromState,
  getStateFromPath,
} from './link/linking';

export function getNavigationConfig(routes: RouteNode, metaOnly: boolean = true) {
  return getReactNavigationConfig(routes, metaOnly);
}

export type ExpoLinkingOptions<T extends object = Record<string, unknown>> = LinkingOptions<T> & {
  getPathFromState?: typeof getPathFromState;
};

export function getLinkingConfig(
  routes: RouteNode,
  overrides: Partial<ExpoLinkingOptions> = {},
  metaOnly: boolean = true
): ExpoLinkingOptions {
  // Returning `undefined` / `null from `getInitialURL` are valid values, so we need to track if it's been called.
  let hasCachedInitialUrl = false;
  let initialUrl: ReturnType<typeof getInitialURL> | undefined;

  return {
    prefixes: overrides.prefixes ?? [],
    config: getNavigationConfig(routes, metaOnly),
    // A custom getInitialURL is used on native to ensure the app always starts at
    // the root path if it's launched from something other than a deep link.
    // This helps keep the native functionality working like the web functionality.
    // For example, if you had a root navigator where the first screen was `/settings` and the second was `/index`
    // then `/index` would be used on web and `/settings` would be used on native.
    getInitialURL() {
      // Expo Router calls `getInitialURL` twice, which may confuse the user if they provide a custom `getInitialURL`.
      // Therefor we memoize the result.
      if (!hasCachedInitialUrl) {
        initialUrl = (overrides.getInitialURL ?? getInitialURL)();
        hasCachedInitialUrl = true;
      }
      return initialUrl;
    },
    subscribe: overrides.subscribe ?? addEventListener,
    getStateFromPath: getStateFromPathMemoized,
    getPathFromState(state: State, options: Parameters<typeof getPathFromState>[1]) {
      return (
        getPathFromState(state, {
          screens: {},
          ...this.config,
          ...options,
        }) ?? '/'
      );
    },
    // Add all functions to ensure the types never need to fallback.
    // This is a convenience for usage in the package.
    getActionFromState,
  };
}

export const stateCache = new Map<string, any>();

/** We can reduce work by memoizing the state by the pathname. This only works because the options (linking config) theoretically never change.  */
function getStateFromPathMemoized(path: string, options: Parameters<typeof getStateFromPath>[1]) {
  const cached = stateCache.get(path);
  if (cached) {
    return cached;
  }
  const result = getStateFromPath(path, options);
  stateCache.set(path, result);
  return result;
}
