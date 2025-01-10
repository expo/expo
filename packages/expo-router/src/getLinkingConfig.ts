import { getActionFromState, LinkingOptions } from '@react-navigation/native';
import { Platform } from 'expo-modules-core';

import { RouteNode } from './Route';
import { State } from './fork/getPathFromState';
import { ResultState, type Options } from './fork/getStateFromPath';
import { getReactNavigationConfig } from './getReactNavigationConfig';
import { RouterStore } from './global-state/router-store';
import {
  addEventListener,
  getInitialURL,
  getPathFromState,
  getStateFromPath as _getStateFromPath,
} from './link/linking';
import { NativeIntent, RequireContext } from './types';

export function getNavigationConfig(routes: RouteNode, metaOnly: boolean = true) {
  return getReactNavigationConfig(routes, metaOnly);
}

export type ExpoLinkingOptions<T extends object = Record<string, unknown>> = LinkingOptions<T> & {
  getPathFromState?: typeof getPathFromState;
  getStateFromPath?: (path: string, config?: Options<object>) => ResultState | undefined;
};

export type LinkingConfigOptions = {
  metaOnly?: boolean;
  serverUrl?: string;
  getInitialURL?: typeof getInitialURL;
};

export async function getLinkingConfig(
  store: RouterStore,
  routes: RouteNode,
  context: RequireContext,
  { metaOnly = true, serverUrl }: LinkingConfigOptions = {}
): Promise<ExpoLinkingOptions> {
  // Returning `undefined` / `null from `getInitialURL` are valid values, so we need to track if it's been called.
  let hasCachedInitialUrl = false;
  let initialUrl: ReturnType<typeof getInitialURL> | undefined;
  const config = getNavigationConfig(routes, metaOnly);

  const nativeLinkingKey = context
    .keys()
    .find((key) => key.match(/^\.\/\+native-intent\.[tj]sx?$/));

  // The native linking module is optional and can be imported from the native intent file.
  // It also might be a promise depending on the metro bundler/expo config.
  const nativeLinkingModule: Promise<NativeIntent> | NativeIntent | undefined = nativeLinkingKey
    ? context(nativeLinkingKey)
    : undefined;

  // If the nativeLinkingModule is a promise, we need to await it
  const nativeLinking: NativeIntent | undefined =
    nativeLinkingModule &&
    'then' in nativeLinkingModule &&
    typeof nativeLinkingModule.then === 'function'
      ? await nativeLinkingModule
      : (nativeLinkingModule as NativeIntent);

  // Create bound getStateFromPath
  const getStateFromPath = _getStateFromPath.bind(store);

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
            if (typeof nativeLinking?.redirectSystemPath === 'function') {
              initialUrl = nativeLinking.redirectSystemPath({ path: initialUrl, initial: true });
            }
          } else if (initialUrl) {
            initialUrl = initialUrl.then((url) => {
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
    subscribe: addEventListener(nativeLinking),
    getStateFromPath(path: string, options?: Options<object>) {
      // In order to utilize the native intent file, the native linking
      // is passed to the extended getStateFromPath function.
      return getStateFromPath(nativeLinking, path, options);
    },
    getPathFromState(state: State, options: Parameters<typeof getPathFromState>[1]) {
      return (
        getPathFromState(state, {
          ...config,
          ...options,
        }) ?? '/'
      );
    },
    // Add all functions to ensure the types never need to fallback.
    // This is a convenience for usage in the package.
    getActionFromState,
  };
}
