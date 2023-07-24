import { getActionFromState, LinkingOptions } from "@react-navigation/native";

import { RouteNode } from "./Route";
import { State } from "./fork/getPathFromState";
import { getReactNavigationConfig, Screen } from "./getReactNavigationConfig";
import {
  addEventListener,
  getInitialURL,
  getPathFromState,
  getStateFromPath,
} from "./link/linking";

export function getNavigationConfig(routes: RouteNode): {
  initialRouteName?: string;
  screens: Record<string, Screen>;
} {
  return getReactNavigationConfig(routes, true);
}

export type ExpoLinkingOptions = LinkingOptions<object> & {
  getPathFromState?: typeof getPathFromState;
};

export function getLinkingConfig(routes: RouteNode): ExpoLinkingOptions {
  return {
    prefixes: [],
    // @ts-expect-error
    config: getNavigationConfig(routes),
    // A custom getInitialURL is used on native to ensure the app always starts at
    // the root path if it's launched from something other than a deep link.
    // This helps keep the native functionality working like the web functionality.
    // For example, if you had a root navigator where the first screen was `/settings` and the second was `/index`
    // then `/index` would be used on web and `/settings` would be used on native.
    getInitialURL,
    subscribe: addEventListener,
    getStateFromPath: getStateFromPathMemoized,
    getPathFromState(
      state: State,
      options: Parameters<typeof getPathFromState>[1]
    ) {
      return (
        getPathFromState(state, {
          screens: [],
          ...this.config,
          ...options,
        }) ?? "/"
      );
    },
    // Add all functions to ensure the types never need to fallback.
    // This is a convenience for usage in the package.
    getActionFromState,
  };
}

export const stateCache = new Map<string, any>();

/** We can reduce work by memoizing the state by the pathname. This only works because the options (linking config) theoretically never change.  */
function getStateFromPathMemoized(
  path: string,
  options: Parameters<typeof getStateFromPath>[1]
) {
  const cached = stateCache.get(path);
  if (cached) {
    return cached;
  }
  const result = getStateFromPath(path, options);
  stateCache.set(path, result);
  return result;
}
